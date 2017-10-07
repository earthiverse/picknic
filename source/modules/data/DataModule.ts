import Express = require('express');
import * as multer from 'multer';
import { Module } from "../Module";
import { Picnic } from "../../models/Picnic";
import { UserModule } from "../user/UserModule";

export class DataModule extends Module {
  addRoutes(app: Express.Application) {
    // Tables
    app.post('/data/tables/find/within', function (req: Express.Request, res: Express.Response) {
      let bounds = req.body;
      Picnic.find({}).where("geometry").within(bounds).lean().exec().then(function (tables: any) {
        res.send(tables);
      });
    });
    app.post('/data/tables/add', multer().single(), function (req: Express.Request, res: Express.Response) {
      // Authenticate
      let username = UserModule.getLoggedInUser(req);
      if (!username) {
        res.send("Error: No user authentication.");
        return;
      }

      let fields = req.body;

      let table = new Picnic({
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [Number(fields.longitude), Number(fields.latitude)]
        },
        "properties": {
          "type": "table",
          "comment": fields.comment,
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
      });

      // Switch form text (yes/no) to boolean
      switch (fields.sheltered.toLowerCase()) {
        case "yes":
          table.properties.sheltered = true;
          break;
        case "no":
          table.properties.sheltered = false;
          break;
      };
      switch (fields.accessible.toLowerCase()) {
        case "yes":
          table.properties.accessible = true;
          break;
        case "no":
          table.properties.accessible = false;
          break;
      }

      // Add picnic table to database
      Picnic.create(table, function (error: any, tables: string) {
        if (error) {
          res.send("We had an error... " + error);
          console.log(error);
        } else {
          res.redirect(req.header('Referer'));
        }
      });
    });
  }
}
