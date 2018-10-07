import Bcrypt = require("bcrypt");
import Express = require("express");
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");
import Request = require("request");
import { IUser, User } from "../../models/User";
import { Module } from "../Module";

// Load Settings
Nconf.file(Path.join(__dirname, "../../../config.json"));
const keys = Nconf.get("keys");
const bcryptConfig = Nconf.get("bcrypt");

export class UserModule extends Module {

  public static getLoggedInUser(req: Express.Request) {
    if (!req.session.user) {
      return undefined;
    }
    return req.session.user as string;
  }

  public static setLoggedIn(req: Express.Request, user: IUser, rememberMe?: boolean) {
    if (rememberMe) {
      req.session.cookie.expires = new Date(Date.now() + 2592000000);
    }
    req.session.user = user.email;
  }
  public addRoutes(app: Express.Application) {
    app.post("/user/login", (req, res) => {
      // TODO: Error messages
      const email: string = req.body.email;
      const plaintextPassword: string = req.body.password;
      const rememberMe: boolean = req.body.rememberMe !== undefined;

      // Find email
      User.findOne({
        email,
      }).exec().then((user) => {
        if (!user) {
          // No username was found, try again
          res.redirect("/login.html?error=Incorrect username or password. Please try again.");
        } else {
          // Verify password
          Bcrypt.compare(plaintextPassword, user.password, (bcryptError, correctPassword) => {
            if (bcryptError) {
              res.send("Error: " + bcryptError);
              res.redirect("/login.html?error=An unknown error occurred.");
            } else if (correctPassword) {
              UserModule.setLoggedIn(req, user, rememberMe);
              res.redirect("/");
            } else {
              res.redirect("/login.html?error=Incorrect username or password. Please try again.");
            }
          });
        }
      });
    });
    app.post("/user/register", (req, res) => {
      const captcha: string = req.body["g-recaptcha-response"];
      const email: string = req.body.email;
      const plaintextPassword: string = req.body.password;
      // NOTE: req's "clientIp" property is only available due to the 'request-ip' package
      const ipAddress: string = (req as any).clientIp;

      // Verify fields are filled out
      if (!email) {
        // No email
        res.redirect("/register.html?error=Please%20enter%20a%20valid%20email%20address.");
        return;
      }
      if (!plaintextPassword) {
        res.redirect("/register.html?email=" + email + "&error=Please%20enter%20a%20password.");
        return;
      }

      // Verify captcha
      if (!captcha) {
        // No Captcha
        res.redirect("/register.html?email=" + email + "&error=Please%20fill%20out%20the%20captcha.");
        return;
      }
      Request.post({
        formData: {
          remoteip: ipAddress,
          response: captcha,
          secret: keys.private.recaptcha,
        },
        url: "https://www.google.com/recaptcha/api/siteverify",
      },
        (captchaError: boolean, response: any, body: string) => {
          if (captchaError) {
            res.send("Error: " + captchaError);
            return;
          }
          const captchaResponse = JSON.parse(response.body);

          if (!captchaResponse.success) {
            // Failed Captcha
            res.redirect("/register.html?email=" + email + "&error=There%20was%20a%20problem%20with%20the%20captcha.");
            return;
          }

          // Register user
          Bcrypt.hash(plaintextPassword, bcryptConfig.cost).then((passwordHash) => {
            const user = new User({
              email,
              joined: Date.now(),
              password: passwordHash,
            });

            User.create(user, (userCreateError: any, newUser: IUser) => {
              if (userCreateError) {
                res.send("Error: " + userCreateError);
                return;
              } else {
                UserModule.setLoggedIn(req, newUser);
                res.redirect("/");
              }
            });
          });
        });
    });
    app.get("/user/logout", (req: Express.Request, res: Express.Response) => {
      req.session.destroy((sessionDestroyError) => {
        if (sessionDestroyError) {
          res.send("Error: " + sessionDestroyError);
        }
        res.redirect("/");
      });
    });
  }
}
