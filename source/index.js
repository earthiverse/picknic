"use strict";

var app = require("./server");
var http = require("http");

var port = 8080;
app.set("port", port);

var server = http.createServer(app);
server.listen(port);
