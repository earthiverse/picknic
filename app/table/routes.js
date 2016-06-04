var Table = require("./model").Table;

module.exports = function(app) {
  // DEBUG: Get just gets some tables in Churchill Square. We'll use post to actually do stuff.
  app.get('/get/tables', function(req, res) {
    let stuff = Table.within({type: "Polygon", coordinates: [[[-113.49083,53.54337],[-113.49099,53.54446],[-113.48913,53.54457],[-113.48892,53.54347],[-113.49083,53.54337]]]},
      function(error, tables) {
        res.json(tables);
      });
  });
  app.post('/get/tables', function(req, res) {
    let polygon = req.body;
    let stuff = Table.within(polygon, function(error, tables) {
      if(error != null) {
        console.log("Errored: " + error);
      } else if(res.headersSent) {
        console.log("Ugh, mongoose... It's got a bug that I've submitted an issue for");
      } else {
        res.json(tables);
      }
    });
  });
}
