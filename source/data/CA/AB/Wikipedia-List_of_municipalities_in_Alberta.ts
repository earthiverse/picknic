import Cheerio = require('cheerio');

import { TwitterExtractor } from "../../../TwitterExtractor";
import { WikipediaExtractor } from "../../../WikipediaExtractor"

// Scrape the list of cities to get the table
WikipediaExtractor.GetPage("List of municipalities in Alberta").then(function (html: any) {
  WikipediaExtractor.FindTable(html, "Urban municipalities of Alberta").then(function (table: any) {
    table.rows.forEach(function (row: string[]) {
      // Get the page title from the link in the first column
      let $ = Cheerio.load(row[0])
      let cityWikiPage = $("a").attr("title")
      let cityName = $("a").text()

      // Scrape the city's wiki
      WikipediaExtractor.GetPage(cityWikiPage).then(function (html: any) {
        let cityWebsite = WikipediaExtractor.FindWebsite(html)
        if (cityWebsite) {
          TwitterExtractor.scrapeHTMLForTwitterUsers(cityWebsite).then(function (users: string[]) {

            console.log(cityName)
            console.log("  " + cityWebsite)
            users.forEach(function (user) {
              console.log("  " + user)
            })
          })
        }
      })
    })
  })
})