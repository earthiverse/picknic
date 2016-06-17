import Express = require('express');
import { Module } from "../Module";
import { Table } from "../../models/Table";

export class DataModule extends Module {
  addRoutes(app:Express.Application) {
    // DEBUG
    app.get('/data', function(req:Express.Request, res:Express.Response) {
      res.send("THE SYSTEM WORKS!");
    });

    // Tables
    app.post('/data/tables/find_within', function(req:Express.Request, res:Express.Response) {
      let polygon = req.body;
      let table = Table.find({}).exec(function(what) {
        console.log("what: " + what);
      });
      console.log("table: " + table);
      res.send(table);
    });
  }
}

