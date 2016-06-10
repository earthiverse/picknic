import Express = require('express');
import { Module } from "../Module"

export class DataModule extends Module {
  addRoutes(app:Express.Application) {
    app.get('/data', function(req:Express.Request, res:Express.Response) {
      res.send("THE SYSTEM WORKS!");
    });
  }
}