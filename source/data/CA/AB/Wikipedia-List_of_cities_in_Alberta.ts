import Cheerio = require('cheerio');

import { TwitterExtractor } from "../../../TwitterExtractor";
import { WikipediaExtractor } from "../../../WikipediaExtractor"

// Scrape the list of cities to get the table
WikipediaExtractor.GetPage("List of cities in Alberta").then(function (html: any) {
  WikipediaExtractor.FindTable(html, "List").then(function (table: any) {
    console.log(JSON.stringify(table))
    table.rows.forEach(function (row: string[]) {
      // Get the page title from the link in the first column
      let name = row[0]
      let $ = Cheerio.load(name)
      let cityPage = $("a").attr("title")
      name = $("a").text()

      console.log(name + " - " + cityPage);
    })
  })
})