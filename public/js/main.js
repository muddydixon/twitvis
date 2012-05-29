$(function(){
  var socket = io.connect('http://localhost/');

  var width = $('div#cloud').width()
  , height = 0 | $('div#cloud').height();

  var TweetTemplate = $([
      '<div class="tweet">'
    , '<div><img /></div>'
    , '<div><p /></div>'
    , '</div>'
  ].join(''));
  socket.on('init', function(){
    
  });
  socket.on('tweet', function(tweet){
    var elm = TweetTemplate.clone();
    elm.find('p').text(tweet.text);
    elm.prependTo('#tweets');
  });
  socket.on('summary', function(words){
    callChartDraw(words);
  });

  var getColor = function(){
    var range = 255, offset = 64;
    return 'rgb(' + [0|Math.random() * (range - offset) + offset, 0|Math.random() * (range - offset) + offset, 0|Math.random() * (range - offset) + offset].join(',')+')';
  };

  var callChartDraw = function(words){
    d3.layout.cloud().size([width, height])
      .words(words.map(function(d){
        return {text: d, size: 10 + Math.random() * 90, color: getColor()};
//         return {text: d.text, size: d.size, color: getColor()};
      })).rotate(function(d){
        return ~~(Math.random() * 2) * 90 * Math.random();
      }).fontSize(function(d){
        return d.size;
      }).fill(function(d){
        return d.color;
      }).on('end', draw).start();
  };
  
  var draw = function(words){
    d3.select('div#cloud').append('svg').attr('width', width).attr('height', height).append('g').attr('transform', 'translate('+(0|width / 2)+', '+(0|height / 2)+')')
      .selectAll('text').data(words)
      .enter().append('text')
      .style('font-size', function(d){
        return d.size + 'px';
      }).style('fill', function(d){
        return d.fill;
      }).attr('text-anchor', 'middle')
      .attr('transform', function(d){
        return 'translate('+[d.x, d.y]+') rotate('+d.rotate+')';
      })
    .text(function(d){
      return d.text;
    });
  };

  var uniqnize = function(words){
    var dics = {};
    $(words).each(function(){
      if(!dics.hasOwnProperty(''+this)){
        dics[''+this] = 0;
      }
      dics[''+this] ++;
    });

    var queries = [];
    for(var word in dics){
      queries.push({text: word, size: dics[word]});
    }
    return queries;
  };
//   callChartDraw(uniqnize('As word placement can be quite slow for more than a few hundred words, the layout algorithm can be run asynchronously, with a configurable time step size. This makes it possible to animate words as they are placed without stuttering. It is recommended to always use a time step even without animations as it prevents the browser’s event loop from blocking while placing the words'.split(' ')));
  callChartDraw('As word placement can be quite slow for more than a few hundred words, the layout algorithm can be run asynchronously, with a configurable time step size. This makes it possible to animate words as they are placed without stuttering. It is recommended to always use a time step even without animations as it prevents the browser’s event loop from blocking while placing the words'.split(' '));

});