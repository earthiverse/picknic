import Express = require("express");
import Fs = require("fs");
import I18next from "i18next";
import Mustache = require("mustache");
import Nconf = require("nconf");
import Path = require("path");
import { Module } from "../Module";

// Load Settings
Nconf.file(Path.join(__dirname, "../../../config.json"));
const keys = Nconf.get("keys");

// Load all partials (Mustache templates) into a list
const partials: any = {};
const viewsPath = Path.join(__dirname, "../../../source/views/");
Fs.readdir(viewsPath, (readDirError, files) => {
  if (readDirError) {
    // console.log(err);
    return;
  }
  files.forEach((file) => {
    if (Path.extname(file) === ".mustache") {
      Fs.readFile(Path.join(viewsPath, file), "utf8", (readFileError, data) => {
        if (readFileError) {
          // console.log(err);
          return;
        }
        partials[Path.basename(file, ".mustache")] = data;
      });
    }
  });
});

export class TemplatingModule extends Module {
  public static mi18n: I18next.i18n;
  public static maxmind: any;

  constructor(app: Express.Application, i18n: I18next.i18n, maxmind: any) {
    super(app);
    TemplatingModule.mi18n = i18n;
    TemplatingModule.maxmind = maxmind;
  }
  public addRoutes(app: Express.Application) {
    app.get("/", (req: Express.Request, res: Express.Response) => {
      res.redirect("index.html");
    });

    app.get("/*.html", (req: Express.Request, res: Express.Response) => {
      // Serve the requested language
      // NOTE: req's "language" property is only available due to the 'express-request-language' package
      TemplatingModule.mi18n.changeLanguage((req as any).language);

      // Get the index.html from the views folder
      const fileLocation = Path.join(viewsPath, req.path);
      Fs.readFile(fileLocation, "utf8", (readFileError, data) => {
        if (readFileError) {
          // console.log(err);
          res.send("There was an error loading " + req.path);
          return;
        }
        // Render it with Mustache
        res.send(Mustache.render(data, {
          i18n() { // Internationalization
            return (text: string, render: any) => {
              return render(TemplatingModule.mi18n.t(text));
            };
          },
          keys: keys.public, // API Keys
          session: req.session,
          // TODO: This is clunky, and shouldn't be here.
          show_map_search: (req.path.endsWith("index.html")),
          maxmind() {
            return () => {
              try {
                // NOTE: req's "clientIp" property is only available due to the 'request-ip' package
                const result = TemplatingModule.maxmind.get((req as any).clientIp);
                return JSON.stringify({ lat: result.location.latitude, lng: result.location.longitude });
              } catch {
                // Something went wrong trying to retrieve the location, so we'll just use Edmonton's.
                return "{ lat: 53.5444, lng: -113.4904 }";
              }
            };
          },
        }, partials));
      });
    });
  }
}
