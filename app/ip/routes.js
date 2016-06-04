//  ip - Returns the users IP address
//    The current implementation might only work when the site is behind
//    a reverse proxy.

module.exports = function(app) {
  app.get('/data/ip', function(req, res) {
    if('x-forwarded-for' in req.headers) {
      res.json({ip: req.headers['x-forwarded-for']})
    } else {
      res.json({'error': 'Unknown (no x-forwarded-for header)'});
    }
  });
}
