infectwit
=========

Research whether twitter users influence each other in their tweeting and visualize tweeting sentiment history.



install
-------

    npm install infectwit

Usage
-----

Have fresh mongoDB server running on "mongodb://localhost:27017/infectwit".

Start server

    npm server

Visit browser

    http://localhost:3000


populate database with twitter data

     node populate <collection to safe to> <afinn | clips> <negative | positive>