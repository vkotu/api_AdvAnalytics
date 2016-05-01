var Twit = require('twit');
var express = require('express');
var router = express.Router();
var request = require('request');
var eventful = require('eventful-node');
var client = new eventful.Client("gFNTdP3rLVhWS6rw");
var mysql = require('./mysql');
var Promise = require('promise');

var T = new Twit({
    consumer_key:         'KHCkhKIPK0yX5rXOExXEa3u41',
    consumer_secret:      'VQFYps31BIAH95mgPDDID3DFPZh3nZH8XxOYez5FVUOXR21OPL',
    access_token:         ' 1569590946-Q1NKHAmVLil5fVzrvtKsuj7rqY9s4Cy7mhkFCR6',
    access_token_secret:  'hDJ8kgI9vpvtHiYqhvTPewJWRTVTifKWqwLteAiQIiEGi',
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});


//T.get('search/tweets', { q: 'banana since:2011-07-11', count: 100 }, function(err, data, response) {
//    console.log(data)
//})


router.get('/',function(req,res){
    T.get('search/tweets', { q: 'nike mens shoes', count: 100 }, function(err, data, response) {
        console.log(data);
        res.send(data);
    });
});