const nconf = require('nconf');
const path = require("path");
const replace = require('replace-in-file');

// Load Settings
nconf.file(path.join(__dirname, "../../config.json"));
var keys = nconf.get("keys");

// Fix Google Maps API Keys
replace({
  files: path.join(__dirname, '../public/*.html'),
  from: /https:\/\/maps\.googleapis\.com\/maps\/api\/js\?key=.*?[&]/g,
  to: "https://maps.googleapis.com/maps/api/js?key=" + keys.public.googleMaps + "&"
});

// Fix Recaptcha API Keys
replace({
  files: path.join(__dirname, '../public/*.html'),
  from: /=\"g-recaptcha\" data-sitekey=\".*?\"/g,
  to: "=\"g-recaptcha\" data-sitekey=\"" + keys.public.recaptcha + "\""
});
