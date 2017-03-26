/**
 * Created by Iulian.Pelin on 3/24/2017.
 */

var express = require('express');
var http = require('http');

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;


//it can be set to environment if i had more configs :)
var config = require('./config/dev');
var app = express();

//create the magic server
var server = http.createServer(app);

//high load
if (cluster.isMaster) {

    for (var i = 0; i < numCPUs; i++) {
        // Create a worker
        cluster.fork();
    }

    // restart slave if it dies :(
    cluster.on('exit', function (worker, code, signal) {
        cluster.fork();
    });

    cluster.on('online', function(worker) {
        console.log('Slave ' + worker.process.pid + ' is up!');
    });
} else {

    //inject the route
    app.use('/api/image', require('./api/image'));

    //check port
    var port = config.port ? config.port : 9010;

    //starting slave
    server.listen(port, function () {

    });

    // just to be safe :)
    process.on('uncaughtException', function (err) {
        console.log('Threw Exception: ', err.message);
        console.log(err.stack);
    });
}

