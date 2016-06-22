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
    app.post('/data/tables/add', function(req:Express.Request, res:Express.Response) {
      let fields = req.body;
      Table.create({
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [ Number(fields.longitude), Number(fields.latitude) ]
        },
        "properties": {
          "comment": "DEBUG, DELETE ME IF YOU SEE ME!",
          "license": {
            "url": fields.license_url,
            "name": fields.license_name
          },
          "source": {
            "url": fields.source_url,
            "name": fields.source_name,
            "retrieved": Date.now()
          }
        }
      }, function(error:any, tables:string) {
        if(error) {
          res.send(error);
          console.log(error);
        } else {
          console.log("----- Fields! -----");
          console.log(fields);
          res.send(fields);
        }
      });
    });
  }
}
