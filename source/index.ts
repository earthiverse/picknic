/// <reference path="../typings/index.d.ts" />
import BodyParser = require('body-parser');
import Express = require('express');
import ExpressStatic = require('express-serve-static-core');
import Http = require('http');
import Mongoose = require("mongoose");
import Path = require("path");

// Setup Mongoose
Mongoose.connect('mongodb://localhost/picknic');

// Setup Express
let app = Express();
app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());

// Serve Static Files
app.use(Express.static(Path.join(__dirname, "../source/public")));

// Start Serving Requests
// TODO: Create config & set port in config
let server = app.listen(3000, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});