(function(){
  var socket = io.connect('http://localhost/');

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
    $('#cloud svg').fadeOut("slow", function(){$(this).remove()});
    callChartDraw(words);
  });

  var getColor = function(){
    var range = 255, offset = 64;
    return 'rgb(' + [0|Math.random() * (range - offset) + offset, 0|Math.random() * (range - offset) + offset, 0|Math.random() * (range - offset) + offset].join(',')+')';
  };

  var callChartDraw = function(words){
    var queries = [];
    for(var i in words){
      if(words.hasOwnProperty(i)){
        queries.push({text: i, size: words[i] * 3 + 20, color: getColor()});
      }
    }
    queries = queries.sort(function(a, b){return b.size - a.size; }).slice(0, 50);

    d3.layout.cloud().size([500, 500])
      .words(queries).rotate(function(d){
        return ~~(Math.random() * 2) * 90 * Math.random();
      }).fontSize(function(d){
        return d.size;
      }).fill(function(d){
        return d.color;
      }).on('end', draw).start();
  };
  
  var draw = function(words){
    d3.select('div#cloud').append('svg').attr('width', 800).attr('height', 800).append('g').attr('transform', 'translate(200, 350)')
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
  
}());