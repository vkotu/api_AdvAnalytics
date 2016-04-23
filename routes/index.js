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



router.post('/getCategories', function(req,res,next) {
  var qry = "SELECT * FROM adv.categories";
  mysql.fetchData(qry,[],function(err,results) {
    if(err){
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      console.log(results.length);
      var data = {
        status: "success",
        totalNoOfEvents: results.length,
        events: results
      }
      res.statusCode = 200;
      res.send(data);
    }
  });
});

router.post('/searchEventFulAPI',function(req,res){
  console.log(req.body);
  var keyword = req.param("category").trim();
  var location = req.param("location").trim();
  var pageNumber = req.param("pageNumber").trim();
  client.searchEvents({ keywords: keyword, date: 'Future', page_size: 100,location: location, page_number: pageNumber}, function(err, data){
    if(err){
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      console.log('===========Recieved=========== ' + data.search.total_items + ' events');
      res.send(data);
      res.end();
    }
  });
});


router.post('/getEventCountsByCategory',function(req,res) {
  var category = req.param("category");
  category = category.trim();
  var qry = "select region_name, region_abbr, count(*) as noOfEvents from events where category_id = ? group by region_abbr , region_name";
  var params = [category];
  mysql.fetchData(qry,params,function(err,results){
    if(err) {
      console.log(err);
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      console.log(results.length);
      var data = {
        status: "success",
        totalNoOfStates: results.length,
        eventCounts: results
      };
      res.statusCode = 200;
      res.send(data);
    }
  });
});


router.post('/geo_instate_count',function(req,res) {
  var qry = "select region_abbr as state , count(*) as value from adv.events group by region_abbr";
  mysql.fetchData(qry,[],function(err,results){
    if(err) {
      console.log(err);
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      results = results.map(function(val){
        val["hc-key"] = val.state;
        return val;
      });
      console.log(results.length);
      var data = {
        status: "success",
        results: results
      };
      res.statusCode = 200;
      res.send(data);
    }
  });
});

router.post('/geo_instate_categoryCount',function(req,res) {
  var state = req.param("state");
  state = state.trim();
  var qry = "select category_id as name , count(*) as value from adv.events where region_name = ? group by category_id";
  mysql.fetchData(qry,[state],function(err,results){
    if(err) {
      console.log(err);
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      console.log(results.length);
      var data = {
        status: "success",
        results: results
      };
      res.statusCode = 200;
      res.send(data);
    }
  });
});


router.post('/getEventsInStateForCategory', function(req,res) {
  var category = req.param("category");
  var state = req.param("state");
  var qry = "SELECT * FROM adv.events where category_id = ? and region_abbr = ?";
  var params = [category, state];
  mysql.fetchData(qry,params,function(err,results) {
    if(err){
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      console.log(results.length);
      var data = {
        status: "success",
        totalNoOfEvents: results.length,
        events: results
      }
      res.statusCode = 200;
      res.send(data);
    }
  });
});

router.post('/getEvents', function(req,res) {
  var category = req.param("category");
  var qry = "SELECT * FROM adv.events where category_id = ? ";
  console.log(category);
  var params = [category];
  mysql.fetchData(qry,params,function(err,results) {
    if(err){
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      console.log(results.length);
      var data = {
        status: "success",
        totalNoOfEvents: results.length,
        events: results
      }
      res.statusCode = 200;
      res.send(data);
    }
  });
});




var errorMessage = function sendError(err){
  var obj = {
    status: "fail",
    msg: err
  };
  return JSON.stringify(obj);
};









/*

************
Ignore all end points below,  for internal purpose only
************


 */

router.post('/searchAndInsertCategory',function(req,res) {
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
        var q2 = "INSERT INTO adv.events ( title, url, description, start_time, stop_time, venue_url," +
            "venue_name,  venue_address, city_name, region_name, region_abbr, postal_code, country_name, country_abbr, latitude, longitude, " +
            "created, modified, image_url,category_id) VALUES (? ,? ,? ,? ,? ,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
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

router.get('/updateEvents', function(req,res,next) {
  var keyword = req.param("keyword");
  console.log("keyword user entered is " +keyword );

  var q1 = "SELECT * FROM adv.categories";
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
      var sql2 = "truncate table adv.events ";
      mysql.execQuery(sql2,[],function(err,res){
        if(err){

        }else{
          for(var j = 0 ; j < results.length ;  j++) {
            (function(j){
              console.log(results[j].category_id);
              client.searchEvents({ keywords: results[j].category_id, date: 'Future', page_size: 1000,location: "United States",page_number:1 }, function(err, data){

                if(err){

                  return console.error(err);

                }else{
                  console.log('===========Recieved=========== ' + data.search.total_items + ' events');
                  for(var i in data.search.events.event){
                    console.log('Event: ' + i);
                    var curEvent = data.search.events.event[i];
                    var state = curEvent.region_abbr;
                    state = "us-"+state.toLowerCase();
                    var params = [curEvent.title,curEvent.url,"No description available",curEvent.start_time,curEvent.stop_time,curEvent.venue_url,
                      curEvent.venue_name,curEvent.venue_address,curEvent.city_name,curEvent.region_name,state,curEvent.postal_code,
                      curEvent.country_name,curEvent.country_abbr,curEvent.latitude,curEvent.longitude,curEvent.created,curEvent.modified,curEvent.image.url,results[j].category_id];
                    console.log(params+ " ");
                    var q2 = "INSERT INTO adv.events ( title, url, description, start_time, stop_time, venue_url," +
                        "venue_name,  venue_address, city_name, region_name, region_abbr, postal_code, country_name, country_abbr, latitude, longitude, " +
                        "created, modified, image_url,category_id) VALUES (? ,? ,? ,? ,? ,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
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
    }
  });
  res.send("ok");
  res.end();
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
        var qry = "insert into categories (category_id,category_name) values(?, ?)";
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

router.get('/testcloudsql', function(req, res, next) {
  var qry = "select * from categories";
  mysql.fetchData(qry,[],function(err,results) {
    if(err) {
      console.log(err);
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      console.log(results.length);
      var data = {
        status: "success",
        totalNoOfStates: results.length,
        eventCounts: results
      };
      res.statusCode = 200;
      res.send(data);
    }
  });

});



module.exports = router;
