// TODO
// https://data.stadt-zuerich.ch/dataset/picknickplatz
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Stadt Zürich Open Data"
let dataset_name = "Picknickplatz"
let dataset_url_human = "https://data.stadt-zuerich.ch/dataset/picknickplatz"
let dataset_url_geojson = "https://data.stadt-zuerich.ch/dataset/picknickplatz/resource/b533a584-6cd8-460c-8c3f-5b71cd0207ca/download/picknickplatz.json"
let license_name = "CC0 1.0 Universal"
let license_url = "https://creativecommons.org/publicdomain/zero/1.0/"

// TODO: Implement the rest

Mongoose.disconnect();