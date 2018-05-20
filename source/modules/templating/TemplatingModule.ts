import Express = require('express')
import Fs = require('fs')
import I18next = require('i18next')
import Mustache = require('mustache')
import Nconf = require('nconf')
import Path = require('path')
import { Module } from "../Module"

// Load Settings
Nconf.file(Path.join(__dirname, "../../../config.json"))
let keys = Nconf.get("keys")

// Load all partials (Mustache templates) into a list
let partials: any = {}
let viewsPath = Path.join(__dirname, "../../../source/views/")
Fs.readdir(viewsPath, (err, files) => {
  if (err) {
    console.log(err)
    return
  }
  files.forEach(file => {
    if (Path.extname(file) == ".mustache") {
      Fs.readFile(Path.join(viewsPath, file), 'utf8', (err, data) => {
        if (err) {
          console.log(err)
          return
        }
        partials[Path.basename(file, ".mustache")] = data
      })
    }
  })
})

export class TemplatingModule extends Module {
  static mi18n: I18next.i18n
  static geoip2: any

  constructor(app: Express.Application, i18n: I18next.i18n, geoip2: any) {
    super(app)
    TemplatingModule.mi18n = i18n
    TemplatingModule.geoip2 = geoip2
  }
  addRoutes(app: Express.Application) {
    app.get('/', (req: Express.Request, res: Express.Response) => {
      res.redirect("index.html")
    })

    app.get('/*.html', function (req: Express.Request, res: Express.Response) {
      // Serve the requested language
      // NOTE: req's "language" property is only available due to the 'express-request-language' package
      TemplatingModule.mi18n.changeLanguage((req as any).language)

      // Get the index.html from the views folder
      let fileLocation = Path.join(viewsPath, req.path)
      Fs.readFile(fileLocation, 'utf8', function (err, data) {
        if (err) {
          console.log(err)
          res.send("There was an error loading " + req.path)
          return
        }
        // Render it with Mustache
        res.send(Mustache.render(data, {
          i18n: function () {
            return function (text: string, render: any) {
              return render(TemplatingModule.mi18n.t(text))
            }
          },
          keys: keys.public,
          show_map_search: (req.path.endsWith("index.html")),
          session: req.session,
          // NOTE: req's "clientIp" property is only available due to the 'request-ip' package
          geoip2: TemplatingModule.geoip2.lookupSimpleSync((req as any).clientIp)
        }, partials))
      })
    })
  }
}
