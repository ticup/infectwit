var Twit = require('twit');
var sentiment = require('sentiment');
var emotional = require('emotional');
var MongoClient = require('mongodb').MongoClient;

// var col = 'users_clips_neg';

emotional.load(function () {
  MongoClient.connect("mongodb://localhost:27017/infectwit", function(err, db) {
    if (err)
      return console.log(err);

    db.collectionNames(function (err, result) {
      result.forEach(function (c) { 
        if (c.name.indexOf("users") !== -1) {
          var col = c.name.split(".")[1];
          db.collection(col).find().toArray(function (err, users) {
            if (err) return console.log(err);
            var s_clips, s_afinn;

            users.forEach(function (user) {
              // console.log(usersr.id);
              if (user.tweets) {
                s_clips = user.tweets.reduce(function (acc, tweet) {
                  tweet.sentiment_clips = emotional.get(tweet.text).polarity;
                  return (acc + tweet.sentiment_clips);
                }, 0) / user.tweets.length;
                s_afinn = user.tweets.reduce(function (acc, tweet) {
                  tweet.sentiment_afinn = sentiment(tweet.text).score;
                  return (acc + tweet.sentiment_afinn);
                }, 0) / user.tweets.length;
              }
              if (isNaN(s_clips) || !s_clips) {
                s_clips = 0;
              }
              if (isNaN(s_afinn) || !s_afinn) {
                s_afinn = 0;
              }
              console.log(s_clips);
              console.log(s_afinn);
              db.collection(col).update({'_id': user._id}, {$set: {sentiment_clips: s_clips, sentiment_afinn: s_afinn, tweets: user.tweets}}, function (err, success) {
                if (err) return console.log(err);
                console.log('success: ' + success);
              });
            });
          });
        }
      });
    });
  });
});