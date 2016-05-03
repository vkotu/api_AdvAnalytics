var express = require('express');
var router = express.Router();
var request = require('request');
var eventful = require('eventful-node');
var client = new eventful.Client("gFNTdP3rLVhWS6rw");
var mysql = require('./mysql');
var Promise = require('promise');
var Twit = require('twit');
var sentimentAnalysis = require('sentiment-analysis');
var sentiment = require('sentiment');
var kmeans = require('node-kmeans');

var Categories = require('./categories');

var T = new Twit({
  consumer_key:         'Y62466vWGYk4ZLLXMTgeEWCP2',
  consumer_secret:      '0LN9VcFwgRmIlUwRTNFIFnqZUZmW7OEDMXrzLccoe3pHT2kuX3',
  access_token:         '1569590946-Q1NKHAmVLil5fVzrvtKsuj7rqY9s4Cy7mhkFCR6',
  access_token_secret:  'hDJ8kgI9vpvtHiYqhvTPewJWRTVTifKWqwLteAiQIiEGi',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

//kiran credentials
var T1 = new Twit({
  consumer_key:         'dWyPxnoPbmghErLht5DXiCkPq',
  consumer_secret:      'TXQdQvaHtNYYJ7SjtJsd8bIR3qIjbziVwyjOIp6znEpdeQKaVI',
  access_token:         '3300096272-rn0Z0nIHng3mUvqtkeLMaZ1dZFrMsYxVMhYq01x',
  access_token_secret:  '5NHVOJKAE9iExcxnvPYzVvwvHkh8r8p184u2AZVJoDwKg',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});



router.post('/getScores',function(req,res){
  var category = req.param("category");
  var state = req.param("state");
  var qry;
  var params;
  if(state){
    qry   = "SELECT * FROM adv.events where category_id = ? and region_name = ?";
    params = [category,state];
  }else{
    qry = "SELECT * FROM adv.events where category_id = ?";
    params = [category];
  }
  var sql_qry = "update events set score = ? , comparative = ? where id = ?";
  console.log("For category=> " + category );
  mysql.fetchData(qry,params,function(err,results) {
    if(err){
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else {
      console.log("length=> " +results.length);
      var eventsScore = {};
      var count = 0;
      if(results.length) {
        for(var i in results) {
          (function(i){
            var title = results[i].title;
            console.log("For Event " + title);
            //T.get('search/tweets', { q: title, count: 100 }, function(err, data, response) {
            T1.get('search/tweets', { q: title, count: 100 }, function(err, data, response) {
              if(err){
                console.log(err);
                res.send(err);
              }else{
                // console.log(data);
                var statuses = data.statuses;
                // console.log("initial length=> "+statuses.length);
                var op = {};
                var sentimentReport;
                var score = 0;
                var comparative = 0;
                if(statuses.length>0){
                  for(var j in statuses) {
                    (function(j){
                      sentimentReport = sentiment(statuses[j].text);
                      score += parseInt(sentimentReport.score);
                      comparative += (sentimentReport.comparative);
                      //console.log("statuses.length=>" + statuses.length);
                      if(parseInt(j) === (statuses.length - 1)){
                        count++;
                        var finalScore = Math.round(score);
                        var finalComparative = Math.round(comparative * 1000) / 1000;
                        console.log("searching the twitter data...");
                        console.log("Running the sentiment analysis based on  user's discussion about the event..");
                        console.log("calculating scores based on the sentiment analysis......");
                        console.log("score : " + finalScore + " comparative : " + finalComparative)
                        eventsScore[title] = {score: finalScore , comparative: finalComparative};
                        mysql.execQuery(sql_qry,[finalScore,finalComparative,results[i].id],function(err,resl){
                          if(err){
                            console.log(err);
                          }else{

                          }
                        });
                       // console.log("count is " + count + " and results.length is"  + results.length);
                        if(parseInt(count) === (results.length-1)) {
                          var data = {
                            status: "success",
                            eventScore: eventsScore
                          };
                          res.statusCode = 200;
                          res.send(data);
                        }
                      }
                    })(j);
                  }
                }else{
                  count++;
                 // console.log("count is " + count + " and results.length is"  + results.length);
                  eventsScore[title] = 0;
                  if(parseInt(count) === (results.length-1)) {
                    var data = {
                      status: "success",
                      eventScore: eventsScore
                    };
                    res.statusCode = 200;
                    res.send(data);
                  }
                }
              }
            });
          })(i);
        };
      }else{
        res.statusCode = 500;
        res.send(errorMessage("Category not found"));
      }
    }
  });
});

router.post('/findCategory', function (req, res) {
  var name = req.param("name");
  var inputValues = name.split(/\s+/);
  var qryToTwitter = "";
  for(var val in inputValues){
    if(parseInt(val) === inputValues.length-1){
      qryToTwitter += "%23" + inputValues[val];
    }else{
      qryToTwitter += "%23" + inputValues[val] + "+";
    }
  }
  console.log("query prepared for the twitter" + qryToTwitter);
  var category = req.param("category");
  var targetCategory={};
  var comesUnderCategory=[] ;
  var categoryString = Categories.csvOfCategories;
  for (var obj in Categories.categories) {
   // console.log(name.indexOf(obj));
    //console.log(category.indexOf(obj));
    if (obj.indexOf(name) > 0 || obj.indexOf(category) > 0) {
      //console.log("="+obj);
      comesUnderCategory.push(obj);
      var queryString = "SELECT * FROM adv.events where"
      for(var keyVal in comesUnderCategory) {
        if(parseInt(keyVal) === comesUnderCategory.length-1){
          queryString += " category_id = ? "
        }else{
          queryString += " category_id = ? or"
        }
      }
      queryString += " order by score desc";
      mysql.fetchData(queryString,comesUnderCategory,function(err,results){
        if(err){
          console.log(err);
          res.statusCode = 500;
          res.send(errorMessage(err));
        }else{
          res.send({
            targetCategory: comesUnderCategory,
            events: results
          });
        }
      });
    }
  }
  if (comesUnderCategory.length === 0) {
    var hashTags = {};
    //console.log("not found");
    console.log(qryToTwitter);
    T.get('search/tweets', {q: qryToTwitter, count: 100}, function (err, data, response) {
      var statuses = data.statuses;
      if (statuses.length) {
        // console.log("statuses exists");
        for (var i in statuses) {
          var twet = statuses[i];
          if (twet.hasOwnProperty("entities")) {
            var entities = twet.entities;
            if (entities.hasOwnProperty("hashtags")) {
              //   console.log(entities);
              // console.log("entities exists");
              var tags = entities.hashtags;
              for (var j in tags) {
                //console.log(tags[j]);
                var tempText  =tags[j].text.toLowerCase()
                if (hashTags.hasOwnProperty(tempText)) {
                  hashTags[tempText] += 1;
                }else{
                  hashTags[tempText] = 1;
                }
              }
            }
          }
        }
        console.log("*********************************************");
        console.log("Searching twitter for keywords  along with the user input...");
        console.log("keywords with their frequency..");
        console.log(hashTags);
        for (var key in hashTags) {
          var tempKeyWord = "";
         // console.log(key + "==>>>>" +hashTags[key]);
          //console.log("***************************")
          if(key.length >= 3) {
            var index = categoryString.indexOf(key);
            if (index >= 0) {
              //console.log(key + "==>>>>");
              //console.log(key + "==>>>>" +hashTags[key]);
              //console.log(Categories.csvOfCategories);
              //console.log("***************************");
              //for (var i = index; i < categoryString.length; i++) {
              //  if (categoryString[i] === ",") {
              //    break;
              //  }
              //  tempKeyWord += categoryString[i];
              //}
              targetCategory[key] = hashTags[key];
            }
          }
        }
        var sortable = [];
        console.log("calculated TF-IDF for each keyword that are found similar to the user input.. ")
        //console.log(targetCategory);
        for (var category in targetCategory)
          sortable.push([category, targetCategory[category]])
        sortable.sort(function (a, b) {
          return b[1] - a[1];
        });
        console.log(sortable);
        for(var ar in sortable){
          var checkCategory = sortable[ar][0];
          //console.log("============");
          //console.log(checkCategory);
          for(var ke in Categories.categories){
            //console.log(ke+ "=" + "checkCategory" + ke.indexOf(checkCategory) );
            if(ke.indexOf(checkCategory) >= 0) {
              comesUnderCategory.push(ke);
            }
          }
        }
        var queryString = "SELECT * FROM adv.events where"
        for(var keyVal in comesUnderCategory) {
          if(parseInt(keyVal) === comesUnderCategory.length-1){
            queryString += " category_id = ? "
          }else{
            queryString += " category_id = ? or"
          }
        }
        queryString += " order by score desc";
        mysql.fetchData(queryString,comesUnderCategory,function(err,results){
          if(err){
            console.log(err);
            res.statusCode = 500;
            res.send(errorMessage(err));
          }else{
            console.log("get the events bases on the categories found similar to user interests and based on the scores")
            if(results.length === 0 ){
              res.send({
                status: fail,
                msg: "No events found",
                events: []
              });
            }else{
              var vectors = new Array();
              for(var n = 0 ; n< results.length ; n++){
                vectors[n] = [results[n]['score'],results[n]['comparative']];
              }
              console.log("****vectors generated*****");
              console.log(vectors);
              kmeans.clusterize(vectors, {k:2}, function(err,cres) {
                if(err) {
                  console.log(err);
                }else{
                  console.log("****************GENERATE CLUSTERS***************** ");
                  console.log("******CLUSTER 1*********");
                  console.log("Centroid: "+ cres[0].centroid);
                  console.log("Elements in this cluster: " );
                  var temCls = "";
                  for(var i in cres[0].cluster){
                    console.log(cres[0].cluster[i]);
                  }
                  console.log("******CLUSTER 2*********");
                  console.log("Centroid: "+ cres[1].centroid);
                  console.log("Elements in this cluster: " );
                  var temCls = "";
                  for(var i in cres[1].cluster){
                    console.log(cres[1].cluster[i]);
                  }
                  res.send({
                    targetCategory: comesUnderCategory,
                    events: results,
                    clusterResponse:cres
                  });
                }
              });
            }
          }
        });
      } else {
        var data = {
          status: "fail",
          msg: "Cannot find the category",

        };
        res.statusCode = 200;
        res.send(data);
      }
    });
  }
});

router.post('/searchTwitter',function(req,res){
  T.get('search/tweets', {q: '%23' + "hp beats" , count: 100}, function (err, data, response){
    console.log(data);
    res.send(data);
  });
});

router.post('/testSentiment',function(req,res){
  var text = req.param("text")
  //var txt = "Cats are stupid";
  var r1 = sentiment(text);
  res.send(r1);
});

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
  var qry = "select category_id as name , count(*) as value , count(*) as y from adv.events where region_name = ? group by category_id ";
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


router.post('/demographics_age', function(req,res){
  var categoryid = req.param("category_id");
  var qry = "SELECT audience_id  FROM adv.audience_interests where interest_name = ?";
  var data = {
    status: "success",
    male:{
      "18-24" : 1,
      "25-34" : 2,
      "35-44" : 3,
      "45-54" : 4,
      "55-64" : 5,
      "65+" : 6
    },
    female:{
      "18-24" : 1,
      "25-34" : 2,
      "35-44" : 3,
      "45-54" : 4,
      "55-64" : 5,
      "65+" : 6
    },
  };
  mysql.fetchData(qry,[categoryid],function(err,results){
    if(err){
      console.log(err);
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      var audiences = results;
      console.log(results);
      var audienceids = "";
      for(var val in audiences){
        audienceids +=  audiences[val].audience_id+ ",";
      }
      audienceids = audienceids.replace(/,$/,"");
      var sql = "select gender ,count(*) as count from audience where audience_id in ("+audienceids+") and age >= 18 && age <=24 group by gender ;"
      mysql.fetchData(sql,[],function(err,results){
        if(err){
          console.log(err);
          res.statusCode = 500;
          res.send(errorMessage(err));
        }else{
          for(val in results){
            if(results[val].gender === "male"){
              data.male["18-24"] = results[val].count;
            }else{
              data.female["18-24"] = results[val].count;
            }
          }
          var sql1 = "select gender ,count(*) as count from audience where audience_id in ("+audienceids+") and age >= 25 && age <=34 group by gender ;"
          mysql.fetchData(sql1,[],function(err,results){
            if(err){
              console.log(err);
              res.statusCode = 500;
              res.send(errorMessage(err));
            }else{
              for(val in results){
                if(results[val].gender === "male"){
                  data.male["25-34"] = results[val].count;
                }else{
                  data.female["25-34"] = results[val].count;
                }
              }
              var sql = "select gender ,count(*) as count from audience where audience_id in ("+audienceids+") and age >= 35 && age <=44 group by gender ;"
              mysql.fetchData(sql,[],function(err,results){
                if(err){
                  console.log(err);
                  res.statusCode = 500;
                  res.send(errorMessage(err));
                }else{
                  for(val in results){
                    if(results[val].gender === "male"){
                      data.male["35-44"] = results[val].count;
                    }else{
                      data.female["35-44"] = results[val].count;
                    }
                  }
                  var sql = "select gender ,count(*) as count from audience where audience_id in ("+audienceids+") and age >= 45 && age <=54 group by gender ;"
                  mysql.fetchData(sql,[],function(err,results){
                    if(err){
                      console.log(err);
                      res.statusCode = 500;
                      res.send(errorMessage(err));
                    }else{
                      for(val in results){
                        if(results[val].gender === "male"){
                          data.male["45-54"] = results[val].count;
                        }else{
                          data.female["45-54"] = results[val].count;
                        }
                      }
                      var sql = "select gender ,count(*) as count from audience where audience_id in ("+audienceids+") and age >= 55 && age <=64 group by gender ;"
                      mysql.fetchData(sql,[],function(err,results){
                        if(err){
                          console.log(err);
                          res.statusCode = 500;
                          res.send(errorMessage(err));
                        }else{
                          for(val in results){
                            if(results[val].gender === "male"){
                              data.male["55-64"] = results[val].count;
                            }else{
                              data.female["55-64"] = results[val].count;
                            }
                          }
                          var sql = "select gender ,count(*) as count from audience where audience_id in ("+audienceids+") and age >= 65 group by gender ;"
                          mysql.fetchData(sql,[],function(err,results){
                            if(err){
                              console.log(err);
                              res.statusCode = 500;
                              res.send(errorMessage(err));
                            }else{
                              for(val in results){
                                if(results[val].gender === "male"){
                                  data.male["65+"] = results[val].count;
                                }else{
                                  data.female["65+"] = results[val].count;
                                }
                              }
                              res.statusCode = 200;
                              res.send(data);
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

router.post('/getEventsInStateForCategory', function(req,res) {
  var category = req.param("category");
  var state = req.param("state");
  var qry = "SELECT * FROM adv.events where category_id = ? and region_name = ? order by score desc";
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
  var state = req.param("state");
  var qry;
  var params;
  if(state){
    qry   = "SELECT * FROM adv.events where category_id = ? and region_name = ? order by score desc";
    params = [category,state];
  }else{
    qry = "SELECT * FROM adv.events where category_id = ? order by score desc";
    params = [category];
  }
  console.log(category);
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

router.post('/getEventsInCity', function(req,res) {
  var state = req.param("state");
  var category_id = req.param("category_id");
  var qry = "select city_name , count(*) as value from events where region_name = ?  and category_id = ? group by city_name order by score desc";
  var params = [state,category_id];
  mysql.fetchData(qry,params,function(err,results) {
    if(err){
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      var citydata = {};
      for(var val in results){
        citydata[results[val].city_name] = results[val].value;
      }
      console.log(results.length);
      var finaldata = {
        status: "success",
        data: citydata
      };
      res.statusCode = 200;
      res.send(finaldata);
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

router.post('/insertInterests',function(req,res){
  var qry = "SELECT * FROM adv.categories";
  mysql.fetchData(qry,[],function(err,results) {
    if(err){
      res.statusCode = 500;
      res.send(errorMessage(err));
    }else{
      for(var i in results) {
        var cat = results[i].category_id;
        var sql = "insert into audience_interests (interest_name,audience_id) values(?,?)";
        for(i=1; i<= 17; i++){
          mysql.execQuery(sql,[cat,i],function(err,results){
            if(err){
              res.statusCode = 500;
              res.send(errorMessage(err));
            }else{
              if(i === (results.length-1)){
                res.statusCode = 200;
                res.send(data);
              }
            }
          });
        }
      }
    }
  });
});


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

router.post('/updateEvents', function(req,res,next) {
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


router.post('/categoriesList', function(req,res,next) {
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

router.post('/testcloudsql', function(req, res, next) {
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
