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
    callChartDraw(words);
  });

  var getColor = function(){
    var range = 255, offset = 64;
    return 'rgb(' + [0|Math.random() * (range - offset) + offset, 0|Math.random() * (range - offset) + offset, 0|Math.random() * (range - offset) + offset].join(',')+')';
  };

  var callChartDraw = function(words){
    d3.layout.cloud().size([300, 300])
      .words(words.map(function(d){
        return {text: d, size: 10 + Math.random() * 90, color: getColor()};
      })).rotate(function(d){
        return ~~(Math.random() * 2) * 90 * Math.random();
      }).fontSize(function(d){
        return d.size;
      }).fill(function(d){
        return d.color;
      }).on('end', draw).start();
  };
  
  var draw = function(words){
    d3.select('div#cloud').append('svg').attr('width', 500).attr('height', 500).append('g').attr('transform', 'translate(300, 300)')
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
  
  callChartDraw('As word placement can be quite slow for more than a few hundred words, the layout algorithm can be run asynchronously, with a configurable time step size. This makes it possible to animate words as they are placed without stuttering. It is recommended to always use a time step even without animations as it prevents the browser’s event loop from blocking while placing the words'.split(' '));
}());