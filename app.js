var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var methodOverride = require('method-override');
var autoIncrement = require('mongoose-auto-increment');
var bcrypt = require('bcrypt');

var app = express();
app.set('view engine', 'jade');
//app.set('port', (process.env.PORT || 3000));

var connection = mongoose.connect('mongodb://devleague-user:puglife@ds049181.mongolab.com:49181/devleague-todo-crud');
autoIncrement.initialize(connection);

app.use(session({
  secret: 'hedgehog Todo',
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use( methodOverride( function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;

    return method;
  }
}));
app.use(function(req, res, next) {
  console.log("Request from: " + req.ip);

  next();

});
app.use(express.static(__dirname + '/public'));
app.get('/login', todo_login);
app.post('/login', todo_checklogin);
app.use(function(req, res, next) {
  console.log('Associated user: ', req.session.user);
  req.session.lastLoginError = undefined;

  if (req.session.user === undefined) {
    res.redirect('/login');
  }
  else {
    next();
  }
});

app.get('/', todo_main);
app.get('/edit/:item', todo_edit);
app.get('/add', todo_newpage_add);
app.post('/new_item', todo_add);
app.delete('/delete/:item', todo_delete);
app.put('/check/:item', todo_check);
app.put('/uncheck/:item', todo_uncheck);
app.put('/update/:item', todo_update);


var Schema = mongoose.Schema;

var todoItemSchema = new Schema({
  item_id: String,
  item: String,
  description: String,
  finished: Boolean,
  user: String
});

var TodoItem = mongoose.model('todoItem', todoItemSchema);
todoItemSchema.plugin(autoIncrement.plugin, 'todoItem');

var SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true }
});

UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

var User = mongoose.model('User', UserSchema);

function todo_add (req, res) {
  var todo = new TodoItem({
    item: req.body.item,
    description: req.body.description,
    finished: false,
    user: req.session.user
  });

  todo.save(function(err) {
    if (err) throw err;
      res.redirect("/");
  });
}

function todo_login (req, res) {
  req.session.user = undefined;

  res.render('login', {
    error: req.session.lastLoginError ? req.session.lastLoginError : ""
  });
}
function todo_checklogin (req, res) {
  console.log(req.body);

  if (req.body.action === 'login') {
    // fetch user and test password verification
    User.findOne({ username: req.body.username }, function(err, user) {
        if (err) throw err;

        if (user === null) {
          req.session.lastLoginError = "No such user.";
          res.redirect("/login");
          return;
        }

        // test a matching password
        user.comparePassword(req.body.password, function(err, isMatch) {
            if (err) throw err;
            console.log('Login password match:', isMatch); // -&gt; Password123: true

        if (isMatch) {
          req.session.user = req.body.username;
          res.redirect("/");
        }
        else {
          req.session.lastLoginError = "Invalid user/password combination.";
          res.redirect("/login");
        }


        });
    });

  }
  else if (req.body.action === 'create') {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });

    newUser.save(function(err) {
      if (err) {
        console.log(err);
        req.session.lastLoginError = err.err;
        res.redirect("/login");
        return;
      }

      req.session.user = req.body.username;
      
      console.log(req.session.user);
      res.redirect('/');
      
    });
  }
}

function todo_update (req, res) {
  var id = req.params.item;
  var newTitle = req.body.item;
  var newDesc = req.body.description;

  console.log(id, req.body, req.params, newTitle, newDesc);

  TodoItem
    .update({_id : parseInt(id), user: req.session.user}, {
      item: newTitle,
      description: newDesc,
    }, function(err) {
      if (err) throw err;

      res.redirect("/");
    });
}

function todo_check (req, res) {
  var id = req.params.item;

  TodoItem
    .find({_id : parseInt(id), user: req.session.user})
    .update({finished: true}, function(err) {
      if (err) throw err;

      res.send("OK");
    });
}

function todo_uncheck (req, res) {
  var id = req.params.item;

  TodoItem
    .find({_id : parseInt(id), user: req.session.user})
    .update({finished: false}, function(err) {
      if (err) throw err;

      res.send("OK");
    });
}

function todo_newpage_add (req, res) {
  res.render('add', {user: req.session.user } );
}

function todo_delete (req, res) {
  var id = req.params.item;

  console.log(id);
  TodoItem
    .find({_id : parseInt(id), user: req.session.user})
    .remove(function(err) {
      if (err) throw err;

      req.method = 'GET';
      res.status(401).redirect('/');

  });
}

function todo_item (req, res) {
  var item = req.params.item();
}

function todo_main (req, res) {
  var items;
  var checkedCount = 0, uncheckedCount = 0;

  TodoItem.find({user: req.session.user},  function(err, items) {
    if (err) throw err;

    items.map(function(val) {
      if (val.finished) {
        checkedCount++;
      }
      else {
        uncheckedCount++;
      }

    });

    res.render('main', {
      items: items,
      unfinished: uncheckedCount,
      total: uncheckedCount + checkedCount,
      user: req.session.user
    });  
  });
}

function todo_edit (req, res) {
  var items;
  var checkedCount = 0, uncheckedCount = 0;

  TodoItem.find( {user: req.session.user } , function(err, items) {
    if (err) throw err;

    items.map(function(val) {
      // console.log(val);

      if (val.finished) {
        checkedCount++;
      }
      else {
        uncheckedCount++;
      }

    });

    console.log(items);

    res.render('edit', {
      items: items,
      unfinished: uncheckedCount,
      total: uncheckedCount + checkedCount,
      current: req.params.item,
      user: req.session.user
    });  
  });

}

var server = app.listen(process.env.PORT || 3000) , function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

