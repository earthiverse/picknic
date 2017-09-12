import BodyParser = require('body-parser'); 
import Express = require('express');
import ExpressStatic = require('express-serve-static-core');
import Http = require('http');
import Mongoose = require("mongoose");
import Path = require("path");

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Setup Express
let app = Express();
app.use(BodyParser.urlencoded({extended: false}));
app.use(BodyParser.json());

// Serve Static Files
// NOTE: It is faster & more efficient to serve these directories through an nginx reverse proxy.
app.use(Express.static(Path.join(__dirname, "../source/public")));

// Load Modules
import { DataModule } from "./modules/data/DataModule";
new DataModule(app);

// Start Serving Requests
// TODO: Create config & set port in config
let server = app.listen(3000, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
