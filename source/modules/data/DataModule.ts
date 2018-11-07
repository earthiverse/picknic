import Express = require("express");
import Geohash = require("latlon-geohash");
import Nconf = require("nconf");
import Path = require("path");

import * as multer from "multer";

import { Picnic } from "../../models/Picnic";
import { User } from "../../models/User";
import { Module } from "../Module";
import { UserModule } from "../user/UserModule";

// Load Configuration
Nconf.file(Path.join(__dirname, "../../../config.json"));
const picknicConfig = Nconf.get("picknic");

export class DataModule extends Module {
  public addRoutes(app: Express.Application) {
    // All
    // NOTE: Right now these are the same as /data/tables/find/near because we only return tables...
    //       If we start returning more than tables, it will be handier.
    app.post("/data/all/find/near", async (req: Express.Request, res: Express.Response) => {
      const bounds = req.body;
      const query = Picnic.find({}).limit(picknicConfig.data.near.default).where("geometry").near(bounds).lean();
      res.send({
        tables: await query.exec(),
      });
    });
    app.post("/data/all/find/within", async (req: Express.Request, res: Express.Response) => {
      const bounds = req.body;
      const query = Picnic.find({}).where("geometry").within(bounds).lean();
      res.send({
        tables: await query.exec(),
      });
    });

    // Tables
    app.post("/data/tables/find/near", async (req: Express.Request, res: Express.Response) => {
      const bounds = req.body;
      const query = Picnic.find({}).limit(picknicConfig.data.near.default).where("geometry").near(bounds).lean();
      res.send({
        tables: await query.exec(),
      });
    });
    app.post("/data/tables/find/within", async (req: Express.Request, res: Express.Response) => {
      const bounds = req.body;
      const query = Picnic.find({}).where("geometry").within(bounds).lean();
      res.send({
        tables: await query.exec(),
      });
    });
    app.get("/data/tables/get", async (req: Express.Request, res: Express.Response) => {
      const id = req.query.id;
      if (id) {
        const query = Picnic.findById(id).lean();
        res.send({
          tables: await query.exec(),
        });
      } else {
        res.send("Error: No ID supplied.");
      }
    });
    app.get("/data/tables/heatmap", async (req: Express.Request, res: Express.Response) => {
      // TODO: Add admin permissions, because this is quite computational.

      const query = Picnic.find().lean();
      const tables = await query.exec();
      // Geohash the locations, and calculate the number of tables in each hashed area.
      // TODO: Change this to a set?
      const weightedSet: any = {};
      const newWeightedSet: Set<string> = new Set<string>();

      for (const table of tables) {
        const lng: number = table.geometry.coordinates[0];
        const lat: number = table.geometry.coordinates[1];
        // TODO: This 4 was created by trial and error. If there are more than 10,000 results returned
        //       then decrease the number by one (i.e. change 4 to 3)
        const geohash = Geohash.encode(lat, lng, 4);
        newWeightedSet.add(geohash);
        if (weightedSet.hasOwnProperty(geohash)) {
          weightedSet[geohash] += 1;
        } else {
          weightedSet[geohash] = 1;
        }
      }

      // Decode the geohashes and return a weighted heatmap
      const returnSet = new Array();
      newWeightedSet.forEach((table) => {
        const point = Geohash.decode(table);
        const numTables = weightedSet[table];
        returnSet.push([point.lat, point.lon, numTables]);
      });

      res.send(JSON.stringify(returnSet));
    });
    app.post("/data/tables/add", multer().single(), (req: Express.Request, res: Express.Response) => {
      // Authenticate
      const user = UserModule.getLoggedInUser(req);
      if (!user) {
        res.send("Error: No user authentication.");
        return;
      }

      const fields = req.body;

      const table = new Picnic({
        geometry: {
          coordinates: [Number(fields.longitude), Number(fields.latitude)],
          type: "Point",
        },
        properties: {
          comment: fields.comment,
          license: {
            name: fields.license_name,
            url: fields.license_url,
          },
          source: {
            name: fields.source_name,
            retrieved: Date.now(),
            url: fields.source_url,
          },
          type: "table",
          user,
        },
        type: "Feature",
      });

      // Switch form text (yes/no) to boolean
      switch (fields.sheltered.toLowerCase()) {
        case "yes":
          table.properties.sheltered = true;
          break;
        case "no":
          table.properties.sheltered = false;
          break;
      }
      switch (fields.accessible.toLowerCase()) {
        case "yes":
          table.properties.accessible = true;
          break;
        case "no":
          table.properties.accessible = false;
          break;
      }

      // Add picnic table to database
      Picnic.create(table, (error: any) => {
        if (error) {
          res.send("Error: " + error);
          // console.log(error);
        } else {
          res.redirect(req.header("Referer"));
        }
      });
    });
    app.post("/data/tables/edit", multer().single(), (req: Express.Request, res: Express.Response) => {
      // Authenticate
      const user = UserModule.getLoggedInUser(req);
      if (!user) {
        res.send("Error: No user authentication.");
        return;
      }

      // TODO: Authenticate the permission on the actual table.
      User.findOne({ email: user }, async (userFindError) => {
        if (userFindError) {
          res.send("Error: There was an error checking permissions.");
        }

        const fields = req.body;

        const table = await Picnic.findOne({ id: fields.id }).exec();

        table.properties.comment = fields.comment;
        table.properties.license.url = fields.license_url;
        table.properties.license.name = fields.license_name;

        // Switch form text (yes/no) to boolean
        switch (fields.sheltered.toLowerCase()) {
          case "yes":
            table.properties.sheltered = true;
            break;
          case "no":
            table.properties.sheltered = false;
            break;
        }
        switch (fields.accessible.toLowerCase()) {
          case "yes":
            table.properties.accessible = true;
            break;
          case "no":
            table.properties.accessible = false;
            break;
        }

        table.save((err) => {
          if (err) {
            res.send("Error: Failed saving updated table.");
          } else {
            res.redirect(req.header("Referer"));
          }
        });
      });
    });
  }
}
