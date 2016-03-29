var express = require('express');
var router = express.Router();
var request = require('request');
var eventful = require('eventful-node');
var client = new eventful.Client("gFNTdP3rLVhWS6rw");
var mysql = require('./mysql');
var Promise = require('promise');
/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: 'Express' });
});

router.get('/categoriesList', function(req,res,next) {
  console.log(req.query.category);
  client.listCategories(function(err, data){

    if(err){

      return console.error(err);

    }
    for(var i in data){
      (function(i){
        console.log('Available event categories: ');
        console.log('id:' + data[i].id);
        //console.log('id:' + data[i].name);
        var id   = data[i].id.trim();
        var name = data[i].name.trim();
        name = name.replace(/&amp;/g,'');
        var qry = "insert into categories (eventid,eventname) values(?, ?)";
        var params = [id,name];
        mysql.execQuery(qry,params, function(err,results){
          if(err){
            console.log("error updating sumary up" + err);
          }else{
            console.log("executed > "+ id+ " , "+name);
          }
        });
      })(i);
    }
  });
  res.end();

});

router.get('/searchCategory',function(req,res){
  var keyword = req.param("keyword");
  client.searchEvents({ keywords: keyword, date: 'Future', page_size: 100,location: "United States",page_number:1 }, function(err, data){

    if(err){

      return console.error(err);

    }else{
      console.log('===========Recieved=========== ' + data.search.total_items + ' events');
      res.send(data);
      res.end();
    }
  });
});

router.get('/searchAndInsertCategory',function(req,res) {
  var keyword = req.param("keyword");
  client.searchEvents({ keywords: keyword, date: 'Future', page_size: 100,location: "United States",page_number:1 }, function(err, data){

    if(err){

      return console.error(err);

    }else{
      console.log('===========Recieved=========== ' + data.search.total_items + ' events');
      for(var i in data.search.events.event){
        console.log('Event: ' + i);
        var curEvent = data.search.events.event[i];
        var params = [curEvent.title,curEvent.url,"No description available",curEvent.start_time,curEvent.stop_time,curEvent.venue_url,
          curEvent.venue_name,curEvent.venue_address,curEvent.city_name,curEvent.region_name,curEvent.region_abbr,curEvent.postal_code,
          curEvent.country_name,curEvent.country_abbr,curEvent.latitude,curEvent.longitude,curEvent.created,curEvent.modified,curEvent.image.url,keyword];
        console.log(params+ " ");
        var q2 = "INSERT INTO Advertiser_Analytics.events ( title, url, description, start_time, stop_time, venue_url," +
            "venue_name,  venue_address, city_name, region_name, region_abbr, postal_code, country_name, country_abbr, latitude, longitude, " +
            "created, modified, image_url,eventid) VALUES (? ,? ,? ,? ,? ,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        mysql.execQuery(q2,params, function(err,results){
          if(err){

            console.log("error singing up");
            var msg = "error singing up:     " + err;
            // res.send({'status':'fail','msg':msg});
            throw err;
          }
          else{
            //  res.send({'status':'success'});
          }
        });
      }
      res.send(data);
      res.end();
    }
  });
});

router.get('/getEventCounts',function(req,res) {
  var category = req.param("category");
  var qry = "select region_name, region_abbr, count(*) as noOfEvents from events where eventid = ? group by region_abbr , region_name";
  var params = [category];
  mysql.fetchData(qry,params,function(err,results){
    if(err) {
      console.log(err);
      res.statusCode = 500;
      var obj = {
        status: "failed",
        msg: err
      };
      res.send(JSON.stringify(obj));
    }else{
      console.log(results.length);
      var data = {
        status: "success",
        totalNoOfStates: results.length,
        eventCounts: results
      };
      res.statusCode = 200;
      res.send(JSON.stringify(data));
    }
  });
});




router.get('/searchEvents', function(req,res,next) {
  var keyword = req.param("keyword");
  console.log("keyword user entered is " +keyword );

  var q1 = "SELECT * FROM Advertiser_Analytics.categories";
  var params = [];
  var sendBack = function(data) {
    res.send(data);
    res.end();
  };
  mysql.fetchData(q1,params,function(err,results){
    if(err) {
      console.log(err);
      throw err;
    }else {
      for(var j = 0 ; j < results.length ;  j++) {
        (function(j){
          console.log(results[j].eventid);
          client.searchEvents({ keywords: results[j].eventid, date: 'Future', page_size: 1000,location: "United States",page_number:1 }, function(err, data){

            if(err){

              return console.error(err);

            }else{
              console.log('===========Recieved=========== ' + data.search.total_items + ' events');
              for(var i in data.search.events.event){
                console.log('Event: ' + i);
                var curEvent = data.search.events.event[i];
                var params = [curEvent.title,curEvent.url,"No description available",curEvent.start_time,curEvent.stop_time,curEvent.venue_url,
                  curEvent.venue_name,curEvent.venue_address,curEvent.city_name,curEvent.region_name,curEvent.region_abbr,curEvent.postal_code,
                  curEvent.country_name,curEvent.country_abbr,curEvent.latitude,curEvent.longitude,curEvent.created,curEvent.modified,curEvent.image.url,results[j].eventid];
                console.log(params+ " ");
                var q2 = "INSERT INTO Advertiser_Analytics.events ( title, url, description, start_time, stop_time, venue_url," +
                    "venue_name,  venue_address, city_name, region_name, region_abbr, postal_code, country_name, country_abbr, latitude, longitude, " +
                    "created, modified, image_url,eventid) VALUES (? ,? ,? ,? ,? ,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                mysql.execQuery(q2,params, function(err,results){
                  if(err){

                    console.log("error singing up");
                    var msg = "error singing up:     " + err;
                    // res.send({'status':'fail','msg':msg});
                    throw err;
                  }
                  else{
                    //  res.send({'status':'success'});
                  }
                });
              }

            }
          });
        })(j);
      }
    }
  });
  res.send("ok");
  res.end();
});


module.exports = router;
