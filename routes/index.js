var app, routes;

module.exports = routes = {};

app = module.parent.exports;

routes['/'] = {
  get: function(req, res) {
    return res.render("index", {
      title: "Express"
    });
  }
};
