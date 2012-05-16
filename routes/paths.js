
routes['/'] = {
  get: function(req, res) {
    return res.render("index", {
      title: "Express"
    });
  }
};
