var status = 'idle',
 	room_name = document.getElementById('room_name').value,
 	nick_name = document.getElementById('nick_name').value,
 	room_id = document.getElementById('room_id').value,
 	message = document.getElementById('message'),
 	send_message_form = document.getElementById('send_message_form'),
 	socket,
	app = angular.module('conference', ['socket.io']);

app.config(function ($socketProvider) {
    $socketProvider.setConnectionUrl('http://192.168.1.58:8080/conference');
	//$socketProvider.setConnectionUrl('http://localhost:8080/conference');
    $socketProvider.setConnectTimeout(30000);
    $socketProvider.setReconnect(true);
    $socketProvider.setReconnectionDelay(1000);
    $socketProvider.setMaxReconnectionAttempts(5);
});

app.controller('MessagesBody', function MessagesBody($scope, $socket){
	$scope.nick_name = nick_name;
	$scope.messages = [];
	$socket.on('receive_messages', function(messages){
		console.log('this client has received a message(s).');
		console.log(messages);
		for (var i = 0; i < messages.length; i++) 
			$scope.messages.push(messages[i]);

		setTimeout(function(){scrolldown_message_container(); }, 100);
	});
});

app.controller('ConferenceUsers', function ConferenceUsers($scope, $socket){
	$scope.nick_name = nick_name;
	$scope.users = [];
	$scope.logout = function(){
		window.location = '/logout';
	}

	$socket.on('connect', function(){
		console.log('this client is now connected to the socket. Now we will send to node the creds via emit');
		$socket.emit('load_data', {room_name : room_name, nick_name : nick_name, room_id : room_id});
	});
	
	$socket.on('receive_user_list', function(users){

		console.log('this client has received a user list.');
		usersObject = new Object();

		for (var i = 0; i < users.length; i++) 
			usersObject[users[i]] = users[i];

		console.log(usersObject);
		$scope.users = usersObject;
	});

	$socket.on('update_user_list', function(response){

		userObject = new Object({});
		userObject[response.user] = response.user;
		console.log('this client has an update for the user list.');
		console.log(response);
		console.log('after modifying the response, we will now update it to the list using this object');
		console.log(userObject);

		if(response.action == 'add')
			$scope.users[response.user] = response.user;
		else if(response.action == 'delete')
			delete $scope.users[response.user];
	});

	$socket.on('update',function(message){
		console.log(message);
	});
});

app.controller('ConferenceTyping', function ConferenceTyping($scope, $socket){
	socket = $socket;
	$scope.typing = [];
	$socket.on('type_start', function(data){
		console.log('we have emitted type_start to server. Server will broadcast this event inside this room.');
		$scope.typing.push(data);
	});

	$socket.on('type_end',function(data){
		console.log('we have emitted type_end to server. Server will broadcast this event inside this room.');
		$scope.typing.splice(data.id,1);
	});

});


message.addEventListener('keydown', function(e){
	if((e.keyCode != 8 && e.keyCode != 13 && e.keyCode != 9) && this.value.length+1 > 0 && status!='typing')
	{
		status = 'typing';
		socket.emit('type_start', nick_name);
	}
	else if(e.keyCode == 8 && (this.value.length-1 < 1))
	{
		if(status == 'typing')
		{
			socket.emit('type_end', nick_name);
			status = 'idle';
		}
	}
});

send_message_form.addEventListener('submit', function(e){
	e.preventDefault();
	if(status != 'idle')
	{
		status = 'idle';
		socket.emit('type_end', nick_name);
		socket.emit('send_message', { nick_name : nick_name, message : message.value } );
		message.value = '';
	}
});

function scrolldown_message_container()
{
	var messageContainer = document.getElementById('conference_body');
	messageContainer.scrollTop = messageContainer.scrollHeight;
}

function updateTime()
{
	console.log('time updated!');
	dates = document.getElementsByClassName('date');
	for (var i = 0; i < dates.length; i++) 
	{
		formatted_date = moment(dates[i].data);
		dates[i].textContent = formatted_date.fromNow();
	}
}



