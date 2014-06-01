/* 
 * Fill collection selects from web service
 */
$.ajax({
  dataType: "json",
  url: "/collections.json",
  success: function (data) {
    $(function () {
      data.forEach(function (d) {
        $('#tweetsCollection').append("<option value='" + d + "'>" + d + "</option>");
        $('#tweetsCollection2').append("<option value='" + d + "'>" + d + "</option>");
      });
    });
  }
})


/*
 * Setup "Graph" tab
 */
$('.make-graph-form').submit(function (event) {

  // get user input
  var collection = $(this).find('#tweetsCollection2').val();
  var algo = $(this).find('#graphAlgorithm').val();
  var color;
  if (algo === 'afinn') {
    color = function(d) {
      return color_afinn(d.sentiment_afinn);
    }
  } else {
    color = function(d) {
      return color_clips(d.sentiment_clips);
    }
  }

  // show loading screen
  $("#graph-container").html("<h3>Loading data...</h3>");
  

  // get the graph data from the web service
  $.ajax({
    dataType: "json",
    url: "graph.json",
    data: {collection: collection},
    success: function (data) {

      // draw the graph
      makeGraph("#graph-container", data, color);
    }
  });
  event.preventDefault();
});




/*
 * Setup "Users" tab
 */
$('.get-users-form').submit(function (event) {
  // get user input
  var filter = $(this).find('#filterTweets').val();
  var limit = $(this).find('#limitUsers').val();
  var collection = $(this).find('#tweetsCollection').val();

  // get users from the web service
  getUsers(collection, limit, filter);
  event.preventDefault();
});
$('#tweets-graph').hide();


// get the users from the web service
function getUsers(collection, limit, filter_tweets) {
  $.ajax({
    dataType: "json",
    url: "/users.json",
    data: {limit: limit, filter_tweets: filter_tweets, collection: collection},
    success: showUsers
  });
}

// display the retrieved users
function showUsers(users) {
  var editing;
  console.log('users arrived: ' + users.length);
  $('#users').html('');
  users.forEach(function (user) {
    $("<div class='list-group-item row'>" +
        "<div class='col-md-4 sub-item'>" + user.screen_name + " (" + user.tweets.length + ")</div>" +
        "<div class='col-md-4 sub-item' style='background-color:" + color_afinn(user.sentiment_afinn) + "'>" + user.sentiment_afinn + "</div>" +
        "<div class='col-md-4 sub-item' style='background-color:" + color_clips(user.sentiment_clips) + "'>" + user.sentiment_clips + "</div>" +
      "</div>")
    .appendTo($('#users'))
    .click(function (e) {
      if (editing) {
        if (editing == user) {
          $('#tweets-graph div').html('');
          $('#tweets-graph').hide();
          editing = null;
          return;
        }
        $('#tweets-graph div').html('');
        $('#tweets-graph').hide();
      }
      editing = user;
      var container = $('tweets-graph');
      $('#tweets-graph').insertAfter($(this)).show();
      makeTweetsGraph('#tweets-graph1', 'afinn sentiment', user, function (u) { return u.sentiment_afinn; }, color_afinn2);
      makeTweetsGraph('#tweets-graph2', 'clips sentiment', user, function (u) { return u.sentiment_clips; }, color_clips2);
      e.preventDefault();
    });
  });
  $('#users-tab h1').html('Users('+ users.length + ')');
  $('#tweets-graph').hide();
}






/*
 * Setup "User" Tab
 */
$("#scraped-user").hide();
$('#get-user-form').submit(function (event) {

  // get user input
  var screen_name = $(this).find("#scrapeScreenName").val();
  
  // show loading screen
  $("#scraping-user-information").html("Our monkeys are getting the data, please bare with us (don't refresh!)...");
  $("#scraped-user").hide();
  
  // get users from web service
  $.ajax({
    dataType: "json",
    url: "/user.json",
    data: {screen_name: screen_name},
    success: showUser
  });

  // display the users 
  function showUser(user) {
    if (typeof user.error !== "undefined") {
      return $("#scraping-user-information").html(user.error);
    }

    $("#scraped-user").show();
    $("#scraping-user-information").html("");
    window.user = user;
    console.log(user);
    $("#scraped-user h2").html(user.screen_name);
    $("#scraped-user-screen-name").html(user.screen_name);
    $("#scraped-user-name").html(user.name);
    $("#scraped-user-id").html(user.id);
    $("#scraped-user-description").html(user.description);
    $("#scraped-user-since").html(user.created_at);
    $("#scraped-user-followers").html(user.followers_count);
    $("#scraped-user-friends").html(user.friends_count);
    $("#scraped-user-tweets-count").html(user.tweets.length);
    $("#scraped-user-location").html(user.location);
    $("#scraped-user-time-zone").html(user.time_zone);
    $("#scraped-user-afinn-sentiment").html(user.sentiment_afinn);
    $("#scraped-user-clips-sentiment").html(user.sentiment_clips);
    $("#scraped-user-afinn-sentiment").css("background-color", color_afinn(user.sentiment_afinn));
    $("#scraped-user-clips-sentiment").css("background-color", color_clips(user.sentiment_clips));

    makeTweetsGraph('#scraped-user-tweets-graph1', 'afinn sentiment', user, function (u) { return u.sentiment_afinn; }, color_afinn2);
    makeTweetsGraph('#scraped-user-tweets-graph2', 'clips sentiment', user, function (u) { return u.sentiment_clips; }, color_clips2);
  }
  event.preventDefault();
});





/*
 * Coloring Functions
 * Display gradual coloring (from green to red) for the different sentiment values
 */
var AFINN_SCALE = 6;
var CLIPS_SCALE = 2;


function color_afinn(s) {
  var d = s + 3;
  return "hsl(" + (120 * d)/AFINN_SCALE + ",  50%, 50%)";
}

function color_afinn2(s) {
  var d = s + 10;
  return "hsl(" + (120 * d)/20 + ",  50%, 50%)";
}

function color_clips(s) {
  var d = s + 0.9;
  return "hsl(" + (120 * d)/CLIPS_SCALE + ",  50%, 50%)";
}

function color_clips2(s) {
  var d = s + 1;
  return "hsl(" + (120 * d)/CLIPS_SCALE + ",  50%, 50%)";
}