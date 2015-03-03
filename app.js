var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var app = express();
app.set('view engine', 'jade');

var connection = mongoose.connect('mongodb://devleague-user:puglife@ds049181.mongolab.com:49181/devleague-todo-crud');
autoIncrement.initialize(connection);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.get('/', todo_main);
app.post('/additem/:item', todo_add);
app.delete('delete/:item', todo_delete);

var Schema = mongoose.Schema;

var todoItemSchema = new Schema({
  item_id: String,
  item: String,
  finished: Boolean,
});
todoItemSchema.plugin(autoIncrement.plugin, 'Book');


var TodoItem = mongoose.model('todoItem', todoItemSchema);

function todo_add (req, res) {
//  console.log(req.body, req.params);

  var todo = new TodoItem({
    item_id: req.body.id,
    item: req.body.item,
    finished: req.body.finished
  });

  todo.save(function(err) {
    if (err) throw err;

     res.send("OK");
  });

}

function todo_delete (req, res) {

}

function todo_item (req, res) {
  var item = req.params.item();
}

function todo_main (req, res) {
  var items;

  TodoItem.find( function(err, items) {
    if (err) throw err;

    console.log(items);

    res.render('main', {items: items});  
  });

}

function helloworld (req, res) {
  res.send('Hello World!');
}

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

