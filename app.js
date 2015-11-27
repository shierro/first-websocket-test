
var app = require('express')(),
    port = process.env.PORT || 8080,
    io = require('socket.io').listen(app.listen(port)),
    config = require('./config')(app),
    routes = require('./routes')(app, io);  

console.log('Your application is running on http://localhost:' + port);