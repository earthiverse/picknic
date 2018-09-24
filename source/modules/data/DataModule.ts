import Express = require('express')
import Geohash = require('latlon-geohash')
import Nconf = require("nconf")
import Path = require("path")

import * as multer from 'multer'

import { Module } from "../Module"
import { Picnic } from "../../models/Picnic"
import { User } from "../../models/User"
import { UserModule } from "../user/UserModule"

// Load Configuration
Nconf.file(Path.join(__dirname, "../../../config.json"))
let picknicConfig = Nconf.get("picknic")

export class DataModule extends Module {
  addRoutes(app: Express.Application) {
    // Tables
    app.post('/data/tables/find/near', function (req: Express.Request, res: Express.Response) {
      let bounds = req.body
      Picnic.find({}).limit(picknicConfig.data.near.default).where("geometry").near(bounds).lean().exec().then(function (tables: any) {
        res.send(tables)
      })
    })
    app.post('/data/tables/find/within', function (req: Express.Request, res: Express.Response) {
      let bounds = req.body
      Picnic.find({}).where("geometry").within(bounds).lean().exec().then(function (tables) {
        res.send(tables)
      })
    })
    app.get('/data/tables/get', function (req: Express.Request, res: Express.Response) {
      let id = req.query.id
      if (id) {
        Picnic.findById(id).lean().exec().then(function (table) {
          res.send(table)
        })
      } else {
        res.send("Error: No ID supplied.")
      }
    })
    app.get('/data/tables/heatmap', function (req: Express.Request, res: Express.Response) {
      // TODO: Add admin permissions, because this is quite computational.

      Picnic.find().lean().exec().then(function (tables) {
        // Geohash the locations, and calculate the number of tables in each hashed area.
        let table_set = new Set()
        let weighted_set: any = {}

        for (let table of tables) {
          let lng: number = table.geometry.coordinates[0]
          let lat: number = table.geometry.coordinates[1]
          let geohash = Geohash.encode(lat, lng, 4) // TODO: This 4 was created by trial and error. We should probably figure it out instead.
          // DEBUG (related to above TODO): table_set.add(geohash)
          if (weighted_set.hasOwnProperty(geohash)) {
            weighted_set[geohash] += 1
          } else {
            weighted_set[geohash] = 1
          }
        }

        // Decode the geohashes and return a weighted heatmap
        let return_set = new Array();
        for (let table in weighted_set) {
          let point = Geohash.decode(table)
          let num_tables = weighted_set[table]
          return_set.push([point.lat, point.lon, num_tables])
        }

        res.send(JSON.stringify(return_set))
      })
    })
    app.post('/data/tables/add', multer().single(), function (req: Express.Request, res: Express.Response) {
      // Authenticate
      let user = UserModule.getLoggedInUser(req)
      if (!user) {
        res.send("Error: No user authentication.")
        return
      }

      let fields = req.body

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
          },
          "user": user
        }
      })

      // Switch form text (yes/no) to boolean
      switch (fields.sheltered.toLowerCase()) {
        case "yes":
          table.properties.sheltered = true
          break
        case "no":
          table.properties.sheltered = false
          break
      }
      switch (fields.accessible.toLowerCase()) {
        case "yes":
          table.properties.accessible = true
          break
        case "no":
          table.properties.accessible = false
          break
      }

      // Add picnic table to database
      Picnic.create(table, function (error: any, newTable: string) {
        if (error) {
          res.send("We had an error... " + error)
          console.log(error)
        } else {
          res.redirect(req.header('Referer'))
        }
      })
    })
    app.post('/data/tables/edit', multer().single(), function (req: Express.Request, res: Express.Response) {
      // Authenticate
      let user = UserModule.getLoggedInUser(req)
      if (!user) {
        res.send("Error: No user authentication.")
        return
      }

      // TODO: Authenticate the permission on the actual table.
      User.findOne({ 'email': user }, async function (err, userData) {
        if (err) {
          res.send("Error: There was an error checking permissions.")
        }

        let fields = req.body

        let table = await Picnic.findOne({ 'id': fields.id }).exec()

        table.properties.comment = fields.comment
        table.properties.license.url = fields.license_url
        table.properties.license.name = fields.license_name

        // Switch form text (yes/no) to boolean
        switch (fields.sheltered.toLowerCase()) {
          case "yes":
            table.properties.sheltered = true
            break
          case "no":
            table.properties.sheltered = false
            break
        }
        switch (fields.accessible.toLowerCase()) {
          case "yes":
            table.properties.accessible = true
            break
          case "no":
            table.properties.accessible = false
            break
        }

        table.save(function (err, updatedTable) {
          if (err) {
            res.send("Error: Failed saving updated table.")
          } else {
            res.redirect(req.header('Referer'))
          }
        })
      })
    })
  }
}
