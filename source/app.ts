/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../typings/index.d.ts" />
"use strict";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
  }

  /**
   * Configure application
   */
  private config() {
    // Setup bodyParser
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));

    // Setup express to serve the static assets
    this.app.use(express.static(path.join(__dirname, "public")));
  }
}

let myApp = new App();
export var app = myApp.app;
