import Cheerio = require('cheerio');

import { TwitterExtractor } from "../../../TwitterExtractor";
import { WikipediaExtractor } from "../../../WikipediaExtractor"

// Scrape the list of cities to get the table
WikipediaExtractor.GetPage("List of municipalities in Alberta").then(function (html: any) {
  WikipediaExtractor.FindTable(html, "Urban municipalities of Alberta").then(function (table: any) {
    table.rows.forEach(function (row: string[]) {
      // Get the page title from the link in the first column
      let name = row[0]
      let $ = Cheerio.load(name)
      let cityPage = $("a").attr("title")
      name = $("a").text()

      // Scrape the city's wiki
      WikipediaExtractor.GetPage(cityPage).then(function (html: any) {
        // Get the official website URL
        let $ = Cheerio.load(html)
        let external_url = $(".official-website").find("a").attr("href")

        if (external_url) {
          TwitterExtractor.scrapeHTMLForTwitterUsers(external_url).then(function (users: string[]) {

            console.log(name)
            console.log("  " + external_url)
            users.forEach(function (user) {
              console.log("  " + user)
            })
          })
        }
      })
    })
  })
})