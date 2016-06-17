import Express = require('express');
import { Module } from "../Module";
import { Table } from "../../models/Table";

export class DataModule extends Module {
  addRoutes(app:Express.Application) {
    // Tables
    app.post('/data/tables/find/within', function(req:Express.Request, res:Express.Response) {
      let bounds = req.body;
      Table.find({}).where("geometry").within(bounds).lean().exec().then(function(tables) {
        res.send(tables);
      });
    });
  }
}
