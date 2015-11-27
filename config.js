// This file handles the configuration of the app.
// It is required by app.js

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

module.exports = function(app){

	// Set .html as the default template extension
	app.set('view engine', 'html');

	// Initialize the ejs template engine
	app.engine('html', require('ejs').renderFile);

	// Tell express where it can find the templates
	app.set('views', __dirname + '/views');

	// Make the files in the public folder available to the world
	app.use(express.static(__dirname + '/public'));

	app.use(session({
	  name: 'session',
	  secret: 'WS314@23123%$!s43dqaDQ',
	  duration: 30 * 60 * 1000,
	  resave : false,
	  saveUninitialized : false,
	  activeDuration: 365 * 24 * 60 * 60 * 1000,
	    cookie: {
	    //path: '/home', // cookie will only be sent to requests under '/'
	    maxAge: 365 * 24 * 60 * 60 * 1000, // duration of the cookie in milliseconds, defaults to duration above
	    httpOnly: true, // when true, cookie is not accessible from javascript
	    secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
	  }
	}));

	// support json encoded bodies
	app.use(bodyParser.json()); 

	// support encoded bodies
	app.use(bodyParser.urlencoded({ extended: true })); 
};
