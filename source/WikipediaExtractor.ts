import Cheerio = require('cheerio')
import Geolib = require('geolib')
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

  export function FindWebsite(html: string) {
    let $ = Cheerio.load(html)
    let e = $(".official-website")
    if (e.length) {
      return e.find("a").attr("href")
    }

    e = $("th[scope=row]:contains('Website')")
    if (e.length) {
      return e.next().find("a").attr('href')
    }
  }

  export function FindCoordinates(html: string) {
    let $ = Cheerio.load(html)
    // The replaces and the trims are because Geolib's regex isn't the greatest...
    let lat = $(".latitude").first().text().replace('′', '\'').replace('″', '"').trim()
    let lng = $(".longitude").first().text().replace('′', '\'').replace('″', '"').trim()

    return [Geolib.sexagesimal2decimal(lng), Geolib.sexagesimal2decimal(lat)]
  }

  export function FindTable(html: string, tableName: string) {
    return new Promise(function (resolve, reject) {
      let $ = Cheerio.load(html)

      function cleanTable(table: Cheerio) {
        // Remove all supplementary data
        table.find("sup").remove()
        // Remove all sortkeys
        table.find(".sortkey").remove()
        // Remove all linebreaks
        table.find("br").replaceWith(" ")
      }

      // METHOD 1: Table has a top row with the text
      let table = $("th:contains('" + tableName + "')")

      if (table.length && (table.text().trim() == tableName)) {
        table = table.parent().parent()
        cleanTable(table);
      } else {
        // METHOD 2: Look for the table in a section with the name
        table = $("h2:contains('" + tableName + "')").nextUntil("h2", ".wikitable")
        if (table.length == 1) {
          cleanTable(table);
        } else {
          // We're out of options (for now...)
          reject("Couldn't find the table '" + tableName + "'...")
        }
      }

      function cleanColumn(column: string) {
        // Combine all multiple spaces to one space
        // Decode entities (e.g. &amp; -> &)
        return htmlEntities.decode(column.replace(/\s+/g, ' ').trim());
      }

      // Create columns list
      let columns: string[] = [];
      let e = table.find("th[scope=col]")
      if (e.length > 0) {
        e.each(function (i) {
          // Skip colspan'd columns (these just describe other columns)
          if ($(this).attr('colspan'))
            return;

          columns.push(cleanColumn($(this).html()))
        })
      } else {
        table.find("th").each(function (i) {
          // Skip colspan'd columns (these just describe other columns)
          if ($(this).attr('colspan'))
            return;

          columns.push(cleanColumn($(this).html()))
        })
      }

      // Create data list
      let rows: any[][] = []
      e = table.find("td[scope=row]")
      if (e.length > 0) {
        e.parent().each(function (i) {
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
      } else {
        table.find("tr").each(function (i) {
          let row: any[] = []
          $(this).children("td").each(function (i) {
            row.push($(this).html().trim())
          })
          if (row.length > 0) {
            rows.push(row)
          }
        })
      }

      resolve({
        columns: columns,
        rows: rows
      })
    })
  }
}