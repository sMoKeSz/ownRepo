/**
 * Created by Iulian.Pelin on 3/24/2017.
 */

var express = require('express');
var http = require('http');



//it can be set to environment if i had more configs :)
var config = require('./config/dev');
var app = express();

//create the magic server
var server = http.createServer(app);


//inject the route
app.use('/api/image', require('./api/image'));

//check port
var port = config.port ? config.port : 9010;

//starting server
server.listen(port, function () {
    console.log('We are up and running on ', config.port);
});