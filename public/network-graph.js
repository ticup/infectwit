/*
 * Network Graph
 *
 * Display a given network of users, coloring according to their sentiment and size according to their number of tweets
 *
 */
function makeGraph(element, data, color) {
    var links = data.followers.map(function (link) {
      link.type = "end";
      return link;
    });
    var nodes = data.users;
    console.log(nodes);

    // Compute the distinct nodes from the links.
    links.forEach(function(link) {
      link.source = nodes[link.source] || (nodes[links.source] = {name: links.source, sentiment_afinn: 0, sentiment_clips: 0, tweets_length: 0});
      link.target = nodes[link.target] || (nodes[links.target] = {name: links.target, sentiment_afinn: 0, sentiment_clips: 0, tweets_length: 0});
    });
        console.log(nodes);


    // graph dimensions
    var width = 1200,
        height = 1200;

    // setup the force directed algorithm
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(10)
        .charge(-20)
        .on("tick", tick)
        .start();

    // create the elements that will be drawn by the force directed algorithm
    var svg = d3.select(element).html("").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Links
    var path = svg.append("g").selectAll("path")
        .data(force.links())
      .enter().append("path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

    // Nodes
    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
      .enter().append("circle")
        .attr("r", radius)
        .style("fill", color)
        .style("stroke", color) 
        .call(force.drag);

    // Show name if very postive or very negative
    // var text = svg.append("g").selectAll("text")
    //     .data(force.nodes())
    //   .enter().append("text")
    //     .attr("x", 8)
    //     .attr("y", ".31em")
    //     .text(function(d) { if (d.sentiment > 2 || d.sentiment < -1.5) { return d.name; } });


    // Show screen name upon hovering over the node using TipsTooltip
    $(element).find('svg circle').tipsy({
        gravity: 'w', 
        html: true, 
        title: function() {
          var d = this.__data__;
          return d.name; 
        }
      });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
      path.attr("d", linkArc);
      circle.attr("transform", transform);
      text.attr("transform", transform);
    }

    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }

    function radius(d) {
      return ((d.tweets_length / 180) + 1);
    }
}