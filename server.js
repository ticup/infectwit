var express = require("express");
var app = express();
var MongoClient = require("mongodb").MongoClient;
var Twit = require("twit");
var emotional = require("emotional");
var sentiment = require("sentiment");
var scrape = require("twitter-scrape");
var db_op = require("./database.js");


var T = new Twit({
    consumer_key:         "cp6cWd4WsWLGKY4qGMYFxtNCO",
    consumer_secret:      "t83CoscSgmJDNfD2zvjfmz4d6AKcaDjDIlVyZLjCkJSo7s89pt",
    access_token:         "893209110-46kjkoB7BTsAf2UX0GQVJXUuoHncSvL6U8ArzigD",
    access_token_secret:  "PDp3fLoWV0mrQxJ3CNFxHxfhQKqOXeNs3HBUlQ4J814vw"
});


emotional.load(function () {

// var col = "users_clips_neg";

app.use(express.static(__dirname + "/public"));

// min/max sentiment
// db.users.aggregate([{ $group: {_id: 0, min_sentiment: {$min: "$sentiment"}, max_sentiment: {$max: "$sentiment"}}}])

/*
 * collections.json
 * get a list of all collections
 */
app.get("/collections.json", function (req, res) {
  fromDB(function (db, finish) {
    db.collectionNames(function (err, result) {
      if (err) console.log(err);
      console.log(result);
      var user_cols = [];
      result.forEach(function (c) { 
        if (c.name.indexOf("users") !== -1) {
          user_cols.push(c.name.split(".")[1]);
        }
      });
      res.send(user_cols);
      finish();
    });
  }, res);
});

/*
 * users.json
 * get a list of users of given collection
 * params: collection, filter, limit_tweets
 */
app.get("/users.json", function (req, res) {
  fromDB(function (db, finish) {
    var limit = parseInt(req.query.limit || 100, 10);
    var filter = parseInt(req.query.filter_tweets, 10);
    var sort = req.query.sort;
    var col = req.query.collection;
    var users;

    if (!isNaN(filter)) {
      var query = {};
      query["tweets." + filter] = {$exists:true};
      users = db.collection(col).find(query);
    } else {
      users = db.collection(col).find();

    }

    users = users.limit(limit);
    
    if (sort) {
      users = users.sort({$sentiment: 1});
    }

    users.toArray(function (err, users) {
      if (err) {
        console.log(err);
        return (res.send(err));
      }

      if (filter) {
        var filtered = [];
        users.forEach(function (user) {
          if (user.tweets.length > 0) {
            filtered.push(user);
          }
        });
        return res.send(filtered);
      }
      res.send(users);
      finish();
    });
  }, res);
});


/*
 * user.json
 * Scrape tweets for given user
 */
var scraping = false;
app.get("/user.json", function (req, res) {
  console.log("got /user.json");
  if (scraping) {
    return res.send({error: "Already scraping a user, please try again later"});
  }
  fromDB(function (db, finish) {
    var screen_name = req.query.screen_name;

    // check if already present in db: just return from db
    db.collection("users_scraped").findOne({screen_name: screen_name}, function (err, entry) {
      if (entry) {
        finish();
        return res.send(entry);
      }
    

      // otherwise, scrape
      scraping = true;
      T.get("users/show", {screen_name: screen_name}, function (err, user) {
        if (err) {
          scraping = false;
          return res.send({error: "could not find given screen_name " + screen_name});
        }

        console.log("got " + user.id);
        scrape.tweets(T, user.id, Infinity, function (tweets) {
          user.tweets = tweets;
          
          // calculate sentiments
          var s_clips = user.tweets.reduce(function (acc, tweet) {
            tweet.sentiment_clips = emotional.get(tweet.text).polarity;
            return (acc + tweet.sentiment_clips);
          }, 0) / user.tweets.length;
          var s_afinn = user.tweets.reduce(function (acc, tweet) {
            tweet.sentiment_afinn = sentiment(tweet.text).score;
            return (acc + tweet.sentiment_afinn);
          }, 0) / user.tweets.length;

          if (isNaN(s_clips) || !s_clips) {
            s_clips = 0;
          }
          if (isNaN(s_afinn) || !s_afinn) {
            s_afinn = 0;
          }
          user.sentiment_afinn = s_afinn;
          user.sentiment_clips = s_clips;

          res.send(user);
          scraping = false;
          user._id = user.id;
          db_op.saveUser(user, db, "users_scraped", function () {
            finish();
          });
          // db.collection("users_scraped").update({"_id": user._id}, user, {upsert: true}, function (err, success) {
          //   console.log(err);
          //   console.log(success);
          //   finish();
          // });
        });
      });
    });
  });
});


/*
 * graph.json
 * get the data to make a graph of given user collection
 * params: collection
 */
app.get("/graph.json", function (req, res) {
  fromDB(function (db, finish) { 
    var col = req.query.collection;
    db.collection(col).find().toArray(function (err, users) {
      if (err) return console.log(err);
      var used = {};
      var userMap = {};
      users.forEach(function (user) {
        if (user.tweets && user.tweets.length > 0) {
          userMap[user._id] = {id: user._id, name: user.screen_name, sentiment_clips: user.sentiment_clips, sentiment_afinn: user.sentiment_afinn, tweets_length: user.tweets.length};
        }
      });
      var followers = users.map(function (user) {
        if (user.followers_ids) {
          var followers = [];
          user.followers_ids.forEach(function (follower_id) {
            if (userMap[follower_id] && userMap[user._id]) {
              used[follower_id] = userMap[follower_id];
              used[user._id] = userMap[user._id];
              followers.push({source: follower_id, target: user._id});
            }
          });
          return followers;
        }
        return [];
      });
      var flattenedFollowers = [].concat.apply([], followers);
      res.send({followers: flattenedFollowers, users: userMap});
      finish();
    });
  }, res);
});



// db call helper
function fromDB(callback, res) {
  MongoClient.connect("mongodb://localhost:27017/infectwit", function(err, db) {
    if (err) {
      console.log(err);
      return res.send(err);
    }

    callback(db, function () {
      db.close();
    });
  });
}

app.listen(3000);
});