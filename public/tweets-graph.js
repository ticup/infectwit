/* 
 * Tweets Graph
 *
 * Plot the given tweets according to its time of posting and sentiment value
 *
 */

// dimensions (margin, width, height)
var m = [79, 80, 160, 79],
    w = 600 - m[1] - m[3],
    h = 500 - m[0] - m[2],
    parse = d3.time.format("%Y-%m-%d").parse,
    format = d3.time.format("%Y");


function makeTweetsGraph(element, title, user, getValue, color) {
  console.log(user);

  // Reset the container
  d3.select(element).html("");

  // Scales. Note the inverted domain for the y-scale: bigger is up!
  var x = d3.time.scale().range([0, w]),
      y = d3.scale.linear().range([h, 0]),
      xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(-h, 0).tickPadding(6),
      yAxis = d3.svg.axis().scale(y).orient("right").tickSize(-w).tickPadding(6);

   // Make a zoom object to allow zooming on the graph
   var zoom = d3.behavior.zoom()
    .on("zoom", draw);

   // Parse dates and numbers.
    var data = [];
    user.tweets.forEach(function(d) {
      data.push({
        date: new Date(d.created_at),
        value: getValue(d),
        text: d.text
      });
    });

    // Compute the maximum date/value.
    // http://www.d3noob.org/2012/12/setting-scales-domains-and-ranges-in.html
    x.domain([d3.min(data, function (d) { return d.date; }), d3.max(data, function(d) { return d.date; })]);
    y.domain([d3.min(data, function (d) { return d.value; }), d3.max(data, function(d) { return d.value; })]);
    zoom.x(x);

  // Create the svg element
  var svg = d3.select(element).append("svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
    .append("g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

  // Create the title (which dynamically changes according to the current x-domain)
  var titleEl = svg.append("text")
        .attr("x", (w / 2))             
        .attr("y", 0 - (m[0] / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline");

  // Create y-axis
  svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + w + ",0)");

  
  // Create y-axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + h + ")");

  // Create the frame with zoom
  var rect = svg.append("rect")
      .attr("class", "pane")
      .attr("width", w)
      .attr("height", h)
      .call(zoom);

  // Create the tweet dots
  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.value); })
      .style("fill", function(d) { return color(d.value); });

  // Create the tooltip to show the tweet upon hovering the dots
  $('svg circle').tipsy({
        gravity: 'w', 
        html: true, 
        title: function() {
          var d = this.__data__;
          return d.text; 
        }
      });

    draw();


  // Redraw after zooming
  function draw() {
    svg.select("g.x.axis").call(xAxis);
    svg.select("g.y.axis").call(yAxis);
    svg.selectAll("circle")
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.value); })
      .style("fill", function(d) { return color(d.value); });
    titleEl.text(title + " " + x.domain().map(format).join("-"));
  }

}
