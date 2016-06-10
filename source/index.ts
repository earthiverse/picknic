/// <reference path="app.ts"/>
"use strict";

import { app } from "./app";
import * as Http from "http";

let server = Http.createServer(app);
server.listen(8080);
