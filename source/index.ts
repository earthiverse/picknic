import BodyParser = require('body-parser');
import Express = require('express');
const requestLanguage = require('express-request-language');
import ExpressStatic = require('express-serve-static-core');
import ExpressSession = require('express-session');
const MongoStore = require('connect-mongo')(ExpressSession);
const geoip2 = require('geoip2');
import Http = require('http');
import I18next = require('i18next');
const i18nextBackend = require('i18next-sync-fs-backend');
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");
const requestIp = require('request-ip');

// Load Configuration
Nconf.file(Path.join(__dirname, "../config.json"));
let portConfig: Number = Nconf.get("port");
let mongoConfig = Nconf.get("mongo");
let keysConfig = Nconf.get("keys");

// Setup Mongo
Mongoose.connect(mongoConfig.picknic);

// Setup i18next
I18next
  .use(i18nextBackend)
  .init({
    initImmediate: false,
    ns: ['main'],
    preload: ['en', 'ja'],
    defaultNS: "main",
    fallbackLng: "en",
    fallbackNS: "main",
    saveMissing: true,
    saveMissingTo: "all",
    backend: {
      loadPath: Path.join(__dirname, '../source/locales/{{lng}}/{{ns}}.json'),
      addPath: Path.join(__dirname, '../source/locales/{{lng}}/{{ns}}.missing.json')
    },
  });

// Setup Geoip2
geoip2.init();

// Setup Express
let app = Express();
app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());
app.use(ExpressSession({
  "secret": keysConfig.private.session,
  "resave": true,
  "saveUninitialized": false,
  "store": new MongoStore({
    mongooseConnection: Mongoose.connection
  })
}));
app.use(requestLanguage({
  languages: ['en', 'ja', 'fr']
}));
app.use(requestIp.mw())

// Load Modules
import { DataModule } from "./modules/data/DataModule";
new DataModule(app);
import { UserModule } from "./modules/user/UserModule";
new UserModule(app);
import { TemplatingModule } from "./modules/templating/TemplatingModule";
new TemplatingModule(app, I18next, geoip2);

// Serve static files
app.use(Express.static(Path.join(__dirname, "../source/public")));

// Start Serving Requests
// TODO: Create config & set port in config
let server = app.listen(portConfig, () => {
  let host = server.address().address;
  let port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
