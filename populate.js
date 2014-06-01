var Twit             = require("twit");
var scrape           = require("../twitter-scrape/index.js");

var MongoClient      = require("mongodb").MongoClient;

var sentimentAfinn   = require("sentiment");
var sentimentClips   = require("emotional");

var db_op = require("./database.js");

var T = new Twit({
    consumer_key:         "cp6cWd4WsWLGKY4qGMYFxtNCO",
    consumer_secret:      "t83CoscSgmJDNfD2zvjfmz4d6AKcaDjDIlVyZLjCkJSo7s89pt",
    access_token:         "893209110-46kjkoB7BTsAf2UX0GQVJXUuoHncSvL6U8ArzigD",
    access_token_secret:  "PDp3fLoWV0mrQxJ3CNFxHxfhQKqOXeNs3HBUlQ4J814vw"
});

var MAX_TWEETS = 600;
var MAX_FOLLOWERS = 10;

// from arras to Apeldoorn
// Sadly not enough twits
// var stream = T.stream('statuses/filter', {locations: ['50.30','266', '52.12', '5.91']});
// var stream = T.stream('statuses/filter', {locations: ['46.29', '-0.104', '53.01', '13.82']});
// var stream = T.stream('statuses/filter', {locations: ['49.62', '-10.74', '58.83', '1.89']});


// Command line arguments 
if (process.argv.length != 5) {
  // > node scrape users clips positive
  throw Error("call with: <column to safe to> <afinn | clips> <negative | positive>");
}

var column      = process.argv[2];
var sentimentDB = process.argv[3];
var polarity    = process.argv[4];
var sentiment   = (sentimentDB === "afinn") ? "sentiment_afinn" : "sentiment_clips";


// load the clips database
sentimentClips.load(function () {

  // Connect to database and start scraping
  MongoClient.connect("mongodb://localhost:27017/infectwit", function(err, db) {
    if (err)
      return console.log(err);

    // find a matching user from the stream and start scraping
    findUser(
      // exists? callback
      function (user, cb) {
        db_op.existsUser(user, db, column, cb);

      // save user callback
    }, function (user) {
      db_op.saveUser(user, db, column, function (err) {
        if (err)
          return console.log(err);
        console.log("user " + user.id + " saved!");
      });
    });
  });



  // Goes through the stream of samples, and finds a tweets that is above or under the threshold
  // for positive or negative
  function findUser(existsUser, saveUser) {
    var stream = T.stream("statuses/sample");
    console.log('listening to stream');
    stream.on("tweet", function (tweet) {
      // console.log(tweet.id);
      if (filterTweet(tweet)) {
        var user = tweet.user;
        stream.stop();
        scrape.tweets(T, user.id, MAX_TWEETS, function (tweets) {
          user.tweets = tweets;
          getAverageSentiment(user, function () {
            if (tweet.user.tweets.length >= 100 && (filterScore(user[sentiment]))) {
              console.log(tweet.text);
              tweet.user.hub = true;
              getUserGraph(tweet.user, 2, existsUser, saveUser);
            } else {
              findUser(existsUser, saveUser);
            }
          });
        });
      }
    });
  }

  // Get the tweets of given user + get its followers
  // Do recursively for every follower for n deep.
  function getUserGraph(user, n, exists, store) {
    console.log("getting " + user.screen_name);
    console.log(" * followers: " + user.followers_count);
    exists(user, function (skip) {
      if (skip) {
        console.log("already in database: " + user.screen_name);
        return;
      }

      scrape.tweets(T, user.id, MAX_TWEETS, function (tweets) {
        user.tweets = tweets;
        getAverageSentiment(user, function () {
          console.log('got user, sentiment: ' + user[sentiment]);
          store(user);

          if (n !== 0) {
            scrape.followers(T, user.id, MAX_FOLLOWERS, function (followers) {
              user.follower_ids = followers.map(function (f) { return f.id; });

              store(user);
              followers.forEach(function (follower) {
                getUserGraph(follower, n-1, exists, store);
              });
            });
          }
        });
      });
    });
  }

  // Returns true if this tweet qualifies as an initial tweet to start from the sample stream
  function filterTweet(tweet) {
    var score = getSentiment(tweet.text);
    return ((tweet.user.followers_count > 100) &&
            // (tweet.user.followers_count < 500) &&
            (tweet.lang === "en") &&
            (!tweet.text.match(/follow/i)) &&
            (!tweet.text.match(/win/i)) &&
            (!tweet.text.match(/free/i)) &&
            filterScore(score));
  }


  // Check whether the sentiment score suffices to qualify the tweet
  function filterScore(score) {
    console.log('score: ' + score);
    if (sentimentDB === "afinn") {
      if (polarity === "positive") {
        return (score > 4);
      }
      return score < 4;
    }
    if (polarity === "positive") {
      return (score > 0.25);
    }
    return (score < -0.25);
  }

  // Get the sentiment of given string, depending the database supplied on commandline
  function getSentiment(str) {
    if (sentimentDB === "afinn") {
      return sentimentAfinn(str).score;
    }
    return sentimentClips.get(str).polarity;
  }


  // Calculate the average sentiment of this user by taking the average sentiment of all its tweets
  function getAverageSentiment(user, finish) {
    user[sentiment] = user.tweets.reduce(function (acc, tweet) {
      tweet[sentiment] = getSentiment(tweet.text);
      return (acc + tweet[sentiment]);
    }, 0) / user.tweets.length;
    if (isNaN(user[sentiment]) || !user[sentiment]) {
      user[sentiment] = 0;
    }
            console.log('average sentiment: ' + user[sentiment]);

    finish(user[sentiment]);
  }

});