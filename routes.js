var mongoose = require('mongoose');
var moment = require('moment');
var Room = require('./room.js');
//var mysql = require('./mysql.js');
var uuid = require('node-uuid');
var timezone = process.env.TZ = 'Asia/Manila';

var uristring =
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/db_chat';

mongoose.connect(uristring, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + uristring);
  }
});

var messagesSchema = mongoose.Schema({
    nickname: String,
    room_name: String,
    content: String,
    date : Date,
});

var roomsSchema = mongoose.Schema({
    id: String,
    name: String,
    owner : String,
    people : { type : Array , "default" : [] },
    status : { type : String, "default" : 'available' }
});

var MessagesModel = mongoose.model('messages', messagesSchema);
var RoomsModel = mongoose.model('rooms', roomsSchema);

module.exports = function(app,io){

	app.get('/', function(req, res){
		res.redirect('/home');
	});

	app.get('/home', function(req, res){
		params = new Object();
		params.error_message = '';
		if(req.session != undefined && req.session.error_message != undefined)
		{
			params.error_message  = req.session.error_message;
			delete req.session.error_message;
		}
			
		res.render('join-conference', params);
	});

	app.post('/authenticate',  function(req, res){

	    nick_name = req.body.nick_name;
	    room_name = req.body.room_name;

		RoomsModel.findOne({name : room_name }).exec(function(err, room){
			if (room == null) 
			{
				room_id = uuid.v4();
			    new_room = new RoomsModel({
			    	id : room_id,
			    	name : room_name,
			    	owner : nick_name,
			    	status : 'available',
			    	people : []
			    });
			    new_room.save(function (err){
			    	if (err) console.log ('Error on save!' + err);
			    });

			    req.session.nick_name = nick_name;
			    req.session.room_name = room_name;
			    req.session.room_id = room_id;

			    res.redirect('/conference/' + room_name + '/' + nick_name);
			}
			else
			{
				if(room.people.indexOf(nick_name) === -1)
				{
				    req.session.nick_name = nick_name;
				    req.session.room_id = room.id;
				    req.session.room_name = room_name;

				    res.redirect('/conference/' + room_name + '/' + nick_name);
				}
				else
				{
			    	req.session.error_message = "Nickname already taken! Please input a new one.";
			    	res.redirect('/home');
				}
			}
		});
	});

	app.get('/conference/:id/:name', function(req,res){
		room_name = req.path.split('/')[2];
		nick_name = req.path.split('/')[3];
		if(req.session == undefined || req.session.nick_name != nick_name || req.session.room_name != room_name || req.session.nick_name == undefined)
			res.redirect('/home');
		else
		{
			params = new Object();
			params.nick_name = req.session.nick_name;
			params.room_name = req.session.room_name;
			params.room_id = req.session.room_id;

			res.render('conference', params);
		}
	});

	app.get('/logout',function (req,res){
		req.session.destroy();
		res.redirect('/home');
	});


	var home = io.of('/home');

	home.on('connection', function(client_socket){

		client_socket.emit("update", "@home Namespace, You have connected to the server.");
		RoomsModel.find(function (err, rooms) {
		  if (err) return console.error(err);

		  formattedRooms = new Object();
		  for (var i = 0; i < rooms.length; i++) 
		  	formattedRooms[rooms[i].id] = rooms[i];

		  client_socket.emit('room_list', formattedRooms);
		});

		console.log('new home connection:' + client_socket.id);

		client_socket.on('disconnect',function(){

			console.log('disconnected home id:' +client_socket.id);

		});

	});

	var conference = io.of('/conference');

	conference.on('connection', function (client_socket) {

		client_socket.emit("update", "@conference Namespace, You are connected to the server.");

		console.log('new conference connection:' + client_socket.id);

		client_socket.on('disconnect', function(){

			client_socket.emit("update", "@conference Namespace, You are disconnected from the server.");
			RoomsModel.findOneAndUpdate(
			    {id  	: client_socket.room_id },
			    {$pull	: {people: client_socket.nick_name}},
			    {safe	: true, upsert: true, 'new'  : true },
			    function(err, room) 
			    {
			        if(err) throw err;

					io.of('/home').emit('update_rooms_available', room);
					client_socket.broadcast.to(client_socket.room_name).emit('update_user_list', {'user' : nick_name, 'action' : 'delete'} );
			    }
			);
			client_socket.leave(client_socket.room_name);
			console.log('disconnected conference id:' +client_socket.id);
		});

		client_socket.on('load_data', function(data)
		{
			client_socket.room_name = data.room_name;
			client_socket.nick_name = data.nick_name;
			client_socket.room_id = data.room_id;

			client_socket.join(client_socket.room_name);

			RoomsModel.find().where('id').equals(client_socket.room_id).exec(function(err, room_fetched){

				//broadcast to the room where the socket have joined
				client_socket.broadcast.to(client_socket.room_name).emit('update_user_list', {'user' : client_socket.nick_name, 'action' : 'add' } );

				RoomsModel.findOneAndUpdate(
				    {id: client_socket.room_id},
				    {$push: {people: client_socket.nick_name}},
				    {safe: true, upsert: true, 'new'  : true },
				    function(err, updated_room) {
				        console.log(err);

						//Emit Room List to the new Socket Connected
						client_socket.emit('receive_user_list', updated_room.people );
				        io.of('/home').emit('update_rooms_available', updated_room);
				    }
				);
			});

			MessagesModel.find().where('room_name').equals(client_socket.room_name).exec(function (err, messages) {
			  if (err) return console.error(err);
			  client_socket.emit('receive_messages', messages );
			});

			// mysql.getConnection(function(err,connection){
			// 	connection.query('SELECT * FROM tbl_messages WHERE room_name ="'+socket.room_name+'"', function(err, rows, fields) {
			// 		if (err) throw err;
			// 		socket.emit('receive_messages', rows );
			// 		io.of('/conference').in(socket.room_name).emit('receive_user_list', rooms[socket.room_name] );
			// 	});
			// 	connection.release();
			// });
		});

		client_socket.on('type_start',function(nick_name){
			client_socket.broadcast.to(client_socket.room_name).emit('type_start', {nick_name : nick_name, id : client_socket.id} );
		});

		client_socket.on('type_end',function(nick_name){
			client_socket.broadcast.to(client_socket.room_name).emit('type_end', {nick_name : nick_name, id : client_socket.id});
		});

		client_socket.on('send_message',function(data){
			nick_name = data.nick_name;
			message = data.message;
			date = moment().format('YYYY-MM-DD HH:mm:s');

		    messageObject = new Object ({
		    	room_name : room_name,
		    	nickname  : nick_name,
		    	content	  : message,
		    	date      : date
		    });

		    message = new MessagesModel(messageObject);
		    message.save(function (err) {if (err) console.log ('Error on save!' + err)});

			// statement = "INSERT INTO tbl_messages(date, nickname, room_name, content) VALUES('"+date+"','"+nick_name+"','"+client_socket.room_name+"','"+message+"')";
			// mysql.getConnection(function(err,connection){
			// 	connection.query(statement, function(err) {
			// 	  if (err) 
			// 	  	throw err;
			// 	  else
			// 	  	console.log('insert success');
			// 	});
			// 	connection.release();
			// });

			array = [];
		    //messageObject.date = moment().fromNow();
			array.push(messageObject); 
			io.of('/conference').in(client_socket.room_name).emit('receive_messages', array);
		});
	});
};
