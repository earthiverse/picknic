import Cheerio = require('cheerio');

import { TwitterExtractor } from "../../../TwitterExtractor";
import { WikipediaExtractor } from "../../../WikipediaExtractor"

// Scrape the list of cities to get the table
WikipediaExtractor.GetPage("List of municipalities in British Columbia").then(function (html: any) {
  WikipediaExtractor.FindTable(html, "List of municipalities").then(function (table: any) {
    console.log(table.rows.length)
    table.rows.forEach(function (row: string[]) {
      // Get the page title from the link in the first column
      let name = row[0]
      let $ = Cheerio.load(name)
      let cityPage = $("a").attr("title")
      name = $("a").text()

      // Scrape the city's wiki
      WikipediaExtractor.GetPage(cityPage).then(function (html: any) {
        // Get the official website URL
        let external_url = WikipediaExtractor.FindWebsite(html)

        if (external_url) {
          TwitterExtractor.scrapeHTMLForTwitterUsers(external_url).then(function (users: string[]) {
            console.log(name)
            console.log("  " + external_url)
            users.forEach(function (user) {
              console.log("  " + user)
            })
          })
        } else {
          console.log(name)
          console.log("  Cannot find external url")
        }
      })
    })
  })
})