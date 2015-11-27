// This file is executed in the browser, when people visit /chat/<random id>

// connect to the socket
// var socket = io('http://localhost:8080/home');
// var id = 0;
// rooms = [];

// // on connection to server get the id of person's room
// socket.on('connect', function(){
// 	//$('input[name=socket_id]').val(socket.id);
// });

// socket.on('join_response', function(room_number, nick_name){
// 	window.location = 'conference/' + room_number + "/" + nick_name;

// });

// socket.on('error_message', function(error_message){
// 	alert(error_message);
// });

// socket.on('update',function(data){
// 	console.log('update:' + data);
// 	// if(data == 'create')
// 	// {
// 	// 	window.location = 'conference/' + $('#room_number').val() + '/' + $('#nick_name').val();
// 	// }
// 	// else if(data == 'join')
// 	// {
// 	// 	window.location = 'conference/' + $('#room_number').val() + '/' + $('#nick_name').val();
// 	// }
// });

// socket.on('room_list', function(rooms){
// 	keys = Object.keys(rooms);
// 	for (var i = 0; i < keys.length; i++) 
// 	{
// 		// $('#rooms_available_body').append('<tr>\
// 		// 									  <td>'+rooms[keys[i]].name+'</td>\
// 		// 									  <td>'+rooms[keys[i]].people.length+'</td>\
// 		// 								   </tr>');
// 	};

// });

// socket.on('new_room', function(room){
// 	// $('#rooms_available_body').append('<tr>\
// 	// 									  <td>'+room.name+'</td>\
// 	// 									  <td>'+room.people.length+'</td>\
// 	// 								   </tr>');
// });

// $('#joinRoom').on('submit', function(e){

// 	//socket.emit('join_conference_room', $('#nick_name').val(), $('#room_number').val());

// });


var app = angular.module('home', ['socket.io']);

app.config(function ($socketProvider) {
    $socketProvider.setConnectionUrl('http://192.168.1.58:8080/home');
    //$socketProvider.setConnectionUrl('http://localhost:8080/home');
    $socketProvider.setConnectTimeout(30000);
    $socketProvider.setReconnect(true);
    $socketProvider.setReconnectionDelay(1000);
    $socketProvider.setMaxReconnectionAttempts(5);
});

app.controller('RoomList', function RoomList($scope, $socket) 
{
	$scope.rooms = [];
	$socket.on('room_list', function(data) 
	{
		console.log('this client has received a room list. This event happens when this client has successfully connected to the server');
		$scope.rooms = data;
	});

	$socket.on('update_rooms_available', function(room)
	{
		console.log('a new update for room has come');
		console.log(room);
		$scope.rooms[room.id] = room;
	});

	$socket.on('update',function(message){
		console.log(message);
	});

});

