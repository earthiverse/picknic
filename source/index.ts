
// It's not feasible to fix other packages at the moment.
// We need:
// - @types/connect-mongo (one that doesn't break compiling typescript)
// - @types/geoip2
// - @types/i18next-sync-fs-backend
import BodyParser = require("body-parser");
// tslint:disable-next-line:no-var-requires
const ConnectMongo = require("connect-mongo");
import Express = require("express");
import requestLanguage = require("express-request-language");
import ExpressSession = require("express-session");
// tslint:disable-next-line:no-var-requires
const geoip2 = require("geoip2");
import I18next = require("i18next");
// tslint:disable-next-line:no-var-requires
const i18nextBackend = require("i18next-sync-fs-backend");
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");
import requestIp = require("request-ip");

import { AddressInfo } from "net";

// Load Configuration
Nconf.file(Path.join(__dirname, "../config.json"));
const portConfig: number = Nconf.get("port");
const mongoConfig = Nconf.get("mongo");
const keysConfig = Nconf.get("keys");

// Setup Mongo
Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true });
Mongoose.set("useCreateIndex", true);
const connectMongo = ConnectMongo(ExpressSession);

// Setup i18next
I18next
  .use(i18nextBackend)
  .init({
    backend: {
      addPath: Path.join(__dirname, "../source/locales/{{lng}}/{{ns}}.missing.json"),
      loadPath: Path.join(__dirname, "../source/locales/{{lng}}/{{ns}}.json"),
    },
    defaultNS: "main",
    fallbackLng: "en",
    fallbackNS: "main",
    initImmediate: false,
    ns: ["main"],
    preload: ["en", "ja"],
    saveMissing: true,
    saveMissingTo: "all",
  });

// Setup Geoip2
geoip2.init();

// Setup Express
const app = Express();
app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());
app.use(ExpressSession({
  resave: true,
  saveUninitialized: false,
  secret: keysConfig.private.session,
  store: new connectMongo({ url: mongoConfig.picknic }),
}));
app.use(requestLanguage({
  languages: ["en", "ja", "fr"],
}));
app.use(requestIp.mw());

// Load Modules
import { DataModule } from "./modules/data/DataModule";
const dataModule = new DataModule(app);
import { UserModule } from "./modules/user/UserModule";
const userModule = new UserModule(app);
import { TemplatingModule } from "./modules/templating/TemplatingModule";
const templatingModule = new TemplatingModule(app, I18next, geoip2);

// Serve static files
app.use(Express.static(Path.join(__dirname, "../source/public")));

// Start Serving Requests
// TODO: Create config & set port in config
const server = app.listen(portConfig, () => {
  const info = server.address() as AddressInfo;
  console.log("Picknic has started on port %s!", info.port);
});
