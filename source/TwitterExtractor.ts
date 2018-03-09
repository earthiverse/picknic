import Cheerio = require('cheerio')
import Moment = require("moment")
import Nconf = require("nconf")
import Path = require("path")
import Request = require('request-promise-native')
var Twitter = require('twitter')
var RateLimiter = require('limiter').RateLimiter

export namespace TwitterExtractor {
  // Load Config
  Nconf.file(Path.join(__dirname, "../config.json"))
  let twitterConfig = Nconf.get("twitter")

  let twitter = new Twitter({
    consumer_key: twitterConfig.consumer_key,
    consumer_secret: twitterConfig.consumer_secret,
    access_token_key: twitterConfig.access_token_key,
    access_token_secret: twitterConfig.access_token_secret
  })

  let twitterLimits = new RateLimiter(1, 'second')
  let externalLimits = new RateLimiter(1, 'second')

  export function fromAPIData(data: any) {
    let clean_data: any = {};

    // DEBUG
    console.log(JSON.stringify(data, null, '  '))

    clean_data["name"] = data["name"]; // Account name (Display name)
    clean_data["screen_name"] = data["screen_name"] // Twitter handle (username)
    clean_data["description"] = data["description"]
    clean_data["created_at"] = Moment(data["created_at"], 'dd MMM DD HH:mm:ss ZZ YYYY', 'en') // Account creation date
    clean_data["location"] = data["location"] // Account location (city/country)
    clean_data["followers_count"] = data["followers_count"] // Number of followers
    clean_data["verified"] = data["verified"] // Official account?
    clean_data["statuses_count"] = data["statuses_count"] // Number of tweets
    clean_data["listed_count"] = data["listed_count"] // Number of lists the user appears in
    clean_data["favourites_count"] = data["favourites_count"] // Number of favourited tweets

    // Get the URL for the twitter account
    if (data["entities"]) {
      if (data["entities"]["url"]) {
        if (data["entities"]["url"]["urls"]) {
          if (data["entities"]["url"]["urls"][0]["expanded_url"]) {
            clean_data["url"] = data["entities"]["url"]["urls"][0]["expanded_url"]
          } else if (data["entities"]["url"]["urls"][0]["url"]) {
            clean_data["url"] = data["entities"]["url"]["urls"][0]["url"]
          }
        }
      }
    }

    return clean_data;
  }

  export function fromUserSearch(search: string) {
    return new Promise(function (resolve, reject) {
      twitter.get("users/search", {
        "q": search,
        "json": true
      }, function (error: any, tweets: any, response: any) {
        if (error) {
          reject(error)
        } else {
          let data: any[] = JSON.parse(response.body)

          // TODO: A more sophisticated algorithm?

          // Choose the first result ¯\_(ツ)_/¯
          if (data.length == 0) {
            reject("No search results for '" + search + "'")
          } else {
            data = data[0];
            resolve(fromAPIData(data))
          }
        }
      })
    })
  }

  export function fromScreenName(screen_name: string) {
    return new Promise(function (resolve, reject) {
      twitter.get("users/show", {
        "screen_name": screen_name,
        "json": true
      }, function (error: any, tweets: any, response: any) {
        if (error) {
          reject(error)
        } else {
          resolve(fromAPIData(JSON.parse(response.body)));
        }
      })
    })
  }

  // Search a page's html for links to twitter accounts and return them.
  export function scrapeHTMLForTwitterUsers(url: string) {
    return new Promise(function (resolve, reject) {
      let users = new Set<string>()

      // Enforce rate limit
      externalLimits.removeTokens(1, function () {
        Request({ uri: url }).then(function (html: string) {
          let $ = Cheerio.load(html)

          // TODO: Grab users from URLs like https://www.twitter.com/cityofsaskatoon
          $(html).find("a").each(function (i) {
            let url = $(this).attr("href")
            let result
            if ((result = /^(http[s]:\/\/)?(www\.)?twitter\.com\/(#!\/)?@?(?!(twitterapi|intent|share|search))([A-Za-z0-9_]+)/.exec(url)) !== null) {
              users.add(result[5])
            }
          })

          // TODO: Grab users from URLs like "https://twitter.com/search?q=from%3Acityofedmonton%2C%20OR%20from%3AEdmontonPrepare%2C%20OR%20from%3AEdmontonClerk%2C%20OR%20from%3AtakeETSalert

          resolve(Array.from(users));
        })
      })
    })
  }
}