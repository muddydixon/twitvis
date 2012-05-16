app = module.parent.exports
routes['/'] =
  get: (req, res) ->
    return res.render("index", {
      title: "Express"
    })
