var mysqlr = require('mysql');

var localhost_connection = {
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'db_chat'
};

var mes_connection = {
  host     : 'mes-server',
  port 	   : 50000,
  user     : 'root',
  password : 'qwerty321',
  database : 'db_chat'
};

mysql = mysqlr.createPool(localhost_connection);
module.exports = mysql;