import Bcrypt = require('bcrypt');
import Express = require('express');
import { Module } from "../Module";

const saltRounds = 10;

export class UserModule extends Module {
  addRoutes(app: Express.Application) {
    app.post("/user/login", function (req: Express.Request, res: Express.Response) {

    });
    app.post("user/register", function (req: Express.Request, res: Express.Response) {
      console.log(req.body);
    });
  }
}