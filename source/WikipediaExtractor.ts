import Cheerio = require('cheerio')
import HtmlEntities = require('html-entities')
const Wiki = require('wikijs').default
const RateLimiter = require('limiter').RateLimiter

export namespace WikipediaExtractor {
  let wikipediaLimits = new RateLimiter(1, 'second')
  let htmlEntities = new HtmlEntities.AllHtmlEntities()

  export function GetPage(page: string) {
    return new Promise(function (resolve, reject) {
      // Enforce rate limit
      wikipediaLimits.removeTokens(1, function () {
        // Get HTML for the page
        return Wiki().page(page).then(function (data: any) {
          data.html().then(function (html: string) {
            resolve(html)
          })
        })
      })
    })
  }

  export function FindTable(html: string, tableName: string) {
    return new Promise(function (resolve, reject) {
      let $ = Cheerio.load(html)

      let table = $("th:contains('" + tableName + "')").parent().parent()
      // Remove all supplementary data
      table.find("sup").remove()
      // Remove all sortkeys
      table.find(".sortkey").remove()
      // Remove all linebreaks
      table.find("br").replaceWith(" ")

      // Create columns list
      var columns: string[] = [];
      table.find("th[scope=col]").each(function (i) {
        // Skip colspan'd columns (these just describe other columns)
        if ($(this).attr('colspan'))
          return;

        let column: string = $(this).html()
        // Combine all multiple spaces to one space
        column = column.replace(/\s+/g, ' ').trim();
        // Decode entities (e.g. &amp; -> &)
        column = htmlEntities.decode(column);

        columns.push(column)
      })

      // Create data list
      let rows: any[][] = []
      table.find("td[scope=row]").parent().each(function (i) {
        let row: any[] = []
        $(this).children("td").each(function (i) {
          let e = $(this).html().trim()

          if (i == 0) {
            // Remove the anchor
            e = e.replace(/^<span id="."><\/span>/, '')
          }

          row.push(e)
        })
        rows.push(row)
      })

      resolve({
        columns: columns,
        rows: rows
      })
    })
  }
}