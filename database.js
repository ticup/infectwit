/*
 * Database
 */

 // save given user to given column with its tweets and follower id's
function saveUser(user, db, col, finish) {

  // refactor the tweets to filter out unnecessary data
  var tweets = user.tweets.map(function (tweet) {
    return {id: tweet.id,
            created_at: tweet.created_at,
            text: tweet.text,
            retweetet: (typeof tweet.retweetet_status !== "undefined" ? tweet.retweetet_status.id : false)};
  });

  // save to db
  db.collection(col).save({"_id": user.id, name: user.name, screen_name: user.screen_name, 
                               description: user.description, sentiment_afinn: user.sentiment_afinn, sentiment_clips: user.sentiment_clips,
                               followers_count: user.followers_count, friends_count: user.friends_count,
                               created_at: user.created_at, location: user.location, time_zone: user.time_zone,
                               followers_ids: user.followers_ids,
                               tweets: tweets, hub: user.hub}, {safe:true}, function (err, success) {
    if (err)
      return console.log(err);
    finish(success);
  });
}

// does the user already exist in the db or not?
function existsUser(user, db, col, finish) {
  db.collection(col).findOne({"_id": user.id}, function (err, result) {
    if (err) return console.log(err);
    finish(result);
  });
}


module.exports = {
  saveUser: saveUser,
  existsUser: existsUser
};