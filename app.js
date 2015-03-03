var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var autoIncrement = require('mongoose-auto-increment');

var app = express();
app.set('view engine', 'jade');

var connection = mongoose.connect('mongodb://devleague-user:puglife@ds049181.mongolab.com:49181/devleague-todo-crud');
autoIncrement.initialize(connection);

app.use(bodyParser.urlencoded({ extended: false }));
app.use( methodOverride( function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;

    return method;
  }
}));
app.use(express.static(__dirname + '/public'));
app.get('/', todo_main);
app.post('/new_item', todo_add);
app.delete('/delete/:item', todo_delete);
app.put('/check/:item', todo_check);
app.put('/uncheck/:item', todo_uncheck);


var Schema = mongoose.Schema;

var todoItemSchema = new Schema({
  item_id: String,
  item: String,
  finished: Boolean,
});
todoItemSchema.plugin(autoIncrement.plugin, 'Book');

var TodoItem = mongoose.model('todoItem', todoItemSchema);

function todo_add (req, res) {
  var todo = new TodoItem({
    item: req.body.item,
    finished: false
  });

  todo.save(function(err) {
    if (err) throw err;
      res.redirect("/");
  });
}

function todo_check (req, res) {
  var id = req.params.item;

  TodoItem
    .find({_id : parseInt(id)})
    .update({finished: true}, function(err) {
      if (err) throw err;

      res.send("OK");
    });
}

function todo_uncheck (req, res) {
  var id = req.params.item;

  TodoItem
    .find({_id : parseInt(id)})
    .update({finished: false}, function(err) {
      if (err) throw err;

      res.send("OK");
    });
}

function todo_delete (req, res) {
  var id = req.params.item;

  console.log(id);
  TodoItem
    .find({_id : parseInt(id)})
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

  TodoItem.find( function(err, items) {
    if (err) throw err;

    console.log(items);

    items.map(function(val) {
      console.log(val);

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
      total: uncheckedCount + checkedCount
    });  
  });

}

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

