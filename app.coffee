express = require('express')
config = require 'config'
https = require 'https'
qs = require 'querystring'
base64 = require 'base64'
app = module.exports = express.createServer()
io = require('socket.io').listen(app)
db = require('monk')(config.database.host + ':' + config.database.port + '/' + config.database.db)
Tweets = db.get('tweets')

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(__dirname + '/public')

app.configure 'development', ->
  app.use express.errorHandler(
    dumpExceptions: true
    showStack: true
  )

app.configure 'production', ->
  app.use express.errorHandler()

app.startStream = (query, opt, cb) ->
  opt = if opt then opt else
    host: 'stream.twitter.com'
    port: 443
    path: '/1/statuses/filter.json?' + qs.stringify
      track: query or config.tracks.join ','
    headers:
      Authorization: 'Basic ' + base64.encode [config.twitter.username, config.twitter.password].join ':'

  req = https.get opt, (res) ->

    buf = ''
    res.setEncoding 'utf8'
    res.on 'data', (chunk) ->
      buf += chunk

      while (id = buf.indexOf '\r\n') > -1
        json = buf.substr 0, id
        buf = buf.substr id + 2

        if json.length > 0
          try
            tweet = JSON.parse json
            data = {text: tweet.text, username: tweet.user.screen_name, icon: tweet.user.profile_image_url, created_at: tweet.created_at, place: tweet.place, rt: if tweet.retweeted_status? then tweet.retweeted_status.retweet_count else 0}
            io.sockets.emit 'tweet', data
            Tweets.insert data
            return
          catch err
            console.error err
            return

    res.on 'error', (err) ->
      console.error err
    res.on 'end', () ->
      console.log 'end'

routes = require('./routes')
for route of routes
  for method of routes[route]
    app[method] route, routes[route][method]

app.listen config.web.port
console.log 'Express server listening on port %d in %s mode', app.address().port, app.settings.env

app.startStream null

calcAndEmit = () ->
  Tweets.find({}, {}, {limit: 100}, (tweeets) ->
    console.log (tweeets)
    )
  return

setInterval( calcAndEmit, 1000)
