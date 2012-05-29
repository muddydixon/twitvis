express = require('express')
config = require 'config'
https = require 'https'
qs = require 'querystring'
base64 = require 'base64'
app = module.exports = express.createServer()
io = require('socket.io').listen(app)
db = require('monk')(config.database.host + ':' + config.database.port + '/' + config.database.db)
Tweets = db.get('tweets')
MeCab = require './mecab'

stopWords = (() ->
  sws = 'this that down up co jp nifty http https a of the by till until must shoud can may could will would i my me mine you your yours he his him she her hers it is do rt for gt = =" gt at and or '.split(/\s/)
  obj = {}
  for sw in sws
    obj[sw] = true
  return obj
  )()

m = new MeCab.Tagger()

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

normalize = (w) ->
  w = w.toLowerCase()

getProp = (props) ->
  props.split(',')

calcAndEmit = () ->
  Tweets.find({}, {limit: 100}, (err, tweets) ->
    words = {}
    for tweet in tweets
      ws = m.parse(tweet.text).split(/\s/)

      while ws.length > 0
        word = ws.shift()
        props = ws.shift()
        continue unless props?

        props = getProp(props)
        continue unless props[0] is '名詞' or props[0] is '動詞' or props[0] is '形容詞'

        word = normalize(word)
        continue if word.length < 2 or word.match(/^\d+$/) or word.match(/^[:\/\\\$\@\.\_;]+$/) or stopWords[word]
        words[word] = 0 unless words[word]?
        words[word] += if word.match(/^[a-zA-Z0-9]+$/) then 1 else 5

    io.sockets.emit 'summary', words
    return
    )
  return

setInterval( calcAndEmit, 3000)
