import Bcrypt = require('bcrypt')
import Express = require('express')
import Mongoose = require('mongoose')
import Nconf = require('nconf')
import Path = require("path")
import Request = require('request')
import { Module } from "../Module"
import { User, IUser } from "../../models/User"

// Load Settings
Nconf.file(Path.join(__dirname, "../../../config.json"))
var keys = Nconf.get("keys")
var bcryptConfig = Nconf.get("bcrypt")

export class UserModule extends Module {
  addRoutes(app: Express.Application) {
    app.post("/user/login", function (req, res) {
      // TODO: Error messages
      let email: string = req.body["email"]
      let plaintextPassword: string = req.body["password"]
      let ipAddress: string = req.ip
      let rememberMe: boolean = req.body["rememberMe"] != undefined
      let now: number = Date.now()

      // Find email
      let user = User.findOne({
        "email": email
      }).exec().then(function (user) {
        if (!user) {
          // No username was found, try again
          res.redirect("/login.html?error=Incorrect username or password. Please try again.")
        } else {
          // Verify password
          Bcrypt.compare(plaintextPassword, user.password, function (err, correctPassword) {
            if (err) {
              console.log(err)
              res.redirect('/login.html?error=An unknown error occurred.')
            }
            if (correctPassword) {
              UserModule.setLoggedIn(req, user, rememberMe)
              res.redirect('/')
            } else {
              res.redirect("/login.html?error=Incorrect username or password. Please try again.")
            }
          })
        }
      })
    })
    app.post("/user/register", function (req, res) {
      let captcha: string = req.body["g-recaptcha-response"]
      let email: string = req.body["email"]
      let plaintextPassword: string = req.body["password"]
      // NOTE: req's "clientIp" property is only available due to the 'request-ip' package
      let ipAddress: string = (req as any).clientIp
      let now: number = Date.now()

      // Verify fields are filled out
      if (!email) {
        // No email
        res.redirect("/register.html?error=Please%20enter%20a%20valid%20email%20address.")
        return
      }
      if (!plaintextPassword) {
        res.redirect("/register.html?email=" + email + "&error=Please%20enter%20a%20password.")
        return
      }

      // Verify captcha
      if (!captcha) {
        // No Captcha
        res.redirect("/register.html?email=" + email + "&error=Please%20fill%20out%20the%20captcha.")
        return
      }
      Request.post({
        url: "https://www.google.com/recaptcha/api/siteverify",
        formData: {
          secret: keys.private.recaptcha,
          response: captcha,
          remoteip: ipAddress
        }
      },
        function (error: boolean, response: any, body: string) {
          let captchaResponse = JSON.parse(response.body)

          if (!captchaResponse.success) {
            // Failed Captcha
            res.redirect("/register.html?email=" + email + "&error=There%20was%20a%20problem%20with%20the%20captcha.")
            return
          }

          // Register user
          Bcrypt.hash(plaintextPassword, bcryptConfig.cost).then(function (passwordHash) {
            let user = new User({
              "email": email,
              "password": passwordHash,
              "joined": Date.now()
            })

            User.create(user, function (error: any, newUser: IUser) {
              if (error) {
                res.send("We had an error... " + error)
                console.log(error)
                return
              } else {
                UserModule.setLoggedIn(req, newUser)
                res.redirect('/')
              }
            })
          })
        })
    })
    app.get("/user/logout", function (req: Express.Request, res: Express.Response) {
      req.session.destroy(function (err) {
        if (err) {
          console.log(err)
        }
        res.redirect('/')
      })
    })
  }

  static getLoggedInUser(req: Express.Request) {
    if (!req.session.user) {
      return undefined
    }
    return req.session.user as string
  }

  static setLoggedIn(req: Express.Request, user: IUser, rememberMe?: boolean) {
    if (rememberMe) {
      req.session.cookie.expires = new Date(Date.now() + 2592000000)
    }
    req.session.user = user.email
  }
}