import Nconf = require("nconf")
import Path = require("path")
var Twitter = require('twitter')
var RateLimiter = require('limiter').RateLimiter

export namespace TwitterExtractor {
  let twitter: any
  let twitterLimits: any

  // Load Config
  Nconf.file(Path.join(__dirname, "../config.json"))
  let twitterConfig = Nconf.get("twitter")

  twitter = new Twitter({
    consumer_key: twitterConfig.consumer_key,
    consumer_secret: twitterConfig.consumer_secret,
    access_token_key: twitterConfig.access_token_key,
    access_token_secret: twitterConfig.access_token_secret
  })

  twitterLimits = new RateLimiter(1, 'second')

  function fromAPIData(data: any) {
    let clean_data: any = {};

    clean_data["name"] = data["name"]; // Account name (Display name)
    clean_data["screen_name"] = data["screen_name"] // Twitter handle (username)
    clean_data["description"] = data["description"]
    clean_data["created_at"] = data["created_at"] // Account creation date
    clean_data["location"] = data["location"] // Account location (city/country)
    clean_data["followers_count"] = data["followers_count"] // Number of followers
    clean_data["verified"] = data["verified"] // Official account?
    clean_data["statuses_count"] = data["statuses_count"] // Number of tweets

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

  function fromUserSearch(search: string) {

    twitter.get("users/search", {
      // TODO: Send the username
      "q": search,
      "json": true
    }, function (error: any, tweets: any, response: any) {
      // TODO: Check for errors
      // TODO: Chanage the response from JSON to an actual object
      let data = "{}"
      return fromAPIData(JSON.parse(data))
    })
  }

  function fromScreenName(screen_name: string) {
    twitter.get("users/show", {
      // TODO: Send the username
      "screen_name": screen_name,
      "json": true
    }, function (error: any, tweets: any, response: any) {
      // TODO: Check for errors

      return fromAPIData(response)
    })
  }
}