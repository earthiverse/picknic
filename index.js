// Load Modules
var bodyParser = require('body-parser');
var config = require('config.json')(__dirname + '/config/config.json');
var express = require('express');
var fs = require('fs');
var http = require('http');
var mongoose = require('mongoose');

// Setup Express
var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

fs.readdirSync(__dirname + '/app').forEach(function(folder) {
  require(__dirname + '/app/' + folder + '/routes')(app);
  console.log("Added Routes for Application " + folder);
});

// Setup MongoDB Connection
mongoose.connection.on('error', console.error);
mongoose.connect('mongodb://localhost/picknic', function(err) {
  if(err) {
    console.log("Error connecting to MongoDB. Error: " + err);
    process.exit(1);
  } else {
    console.log("Connected to MongoDB!");
  }
});

// Start Listening & Serving Requests
var server = http.createServer(app);
server.listen(config.http.port, function() {
  console.log('Serving Requests on Port ' + config.http.port);
});
