(function() {
  var Tweets, app, base64, calcAndEmit, config, db, express, https, io, method, qs, route, routes;

  express = require('express');

  config = require('config');

  https = require('https');

  qs = require('querystring');

  base64 = require('base64');

  app = module.exports = express.createServer();

  io = require('socket.io').listen(app);

  db = require('monk')(config.database.host + ':' + config.database.port + '/' + config.database.db);

  Tweets = db.get('tweets');

  app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(express.static(__dirname + '/public'));
  });

  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });

  app.configure('production', function() {
    return app.use(express.errorHandler());
  });

  app.startStream = function(query, opt, cb) {
    var req;
    opt = opt ? opt : {
      host: 'stream.twitter.com',
      port: 443,
      path: '/1/statuses/filter.json?' + qs.stringify({
        track: query || config.tracks.join(',')
      }),
      headers: {
        Authorization: 'Basic ' + base64.encode([config.twitter.username, config.twitter.password].join(':'))
      }
    };
    return req = https.get(opt, function(res) {
      var buf;
      buf = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        var data, id, json, tweet;
        buf += chunk;
        while ((id = buf.indexOf('\r\n')) > -1) {
          json = buf.substr(0, id);
          buf = buf.substr(id + 2);
          if (json.length > 0) {
            try {
              tweet = JSON.parse(json);
              data = {
                text: tweet.text,
                username: tweet.user.screen_name,
                icon: tweet.user.profile_image_url,
                created_at: tweet.created_at,
                place: tweet.place,
                rt: tweet.retweeted_status != null ? tweet.retweeted_status.retweet_count : 0
              };
              io.sockets.emit('tweet', data);
              Tweets.insert(data);
              return;
            } catch (err) {
              console.error(err);
              return;
            }
          }
        }
      });
      res.on('error', function(err) {
        return console.error(err);
      });
      return res.on('end', function() {
        return console.log('end');
      });
    });
  };

  routes = require('./routes');

  for (route in routes) {
    for (method in routes[route]) {
      app[method](route, routes[route][method]);
    }
  }

  app.listen(config.web.port);

  console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);

//   app.startStream(null);

  calcAndEmit = function() {
    Tweets.find({}, function(err, tweeets) {
      return console.log(tweeets);
    });
  };

  setInterval(calcAndEmit, 1000);

}).call(this);
