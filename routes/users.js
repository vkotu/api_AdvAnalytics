var express = require('express');
var router = express.Router();
var mysql = require('./mysql');
var passport = require('passport');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.post('/login',
    passport.authenticate('local', { session: false, failureRedirect: "https://advclient.herokuapp.com/" }),
    function(req, res) {
      console.log(req.user);
      updateUserToken(req.user,function(msg){
        if(msg.status == 'fail'){
          res.status(500);
          res.send({"msg":msg.msg,"status":"fail"});
          res.end();
        }else{
          res.status(200);
          res.send({"msg":"Valid Login","status":"success",accessToken:msg.accessToken});
          res.end();
        }
      });
    }
);


router.post('/getUser', function (req, res) {
  var token = req.param("token");
  var qry = "select id,fname, lname,email, token,gender,age,city,state,country  from adv.users where token = ?";
  if (token) {
    var params = [token];
    var finaldata = {};
    mysql.fetchData(qry, params, function (err, results) {
      if (err) {
        res.status(500);
        res.send({"msg": err,"status":"fail"});
        res.end();
      } else {
        console.log(results);
        if(results.length){
          finaldata.user = results[0];
          var user_id = results[0].id;
          var sql = "SELECT * FROM adv.interests where userid = ?";
          mysql.fetchData(sql, [user_id], function(err,results) {
            if(err){
              res.status(500);
              res.send({"msg": "error while fetching data","status":"fail"});
              res.end();
            }else{
              finaldata.user.interests = results
              res.status(200);
              res.send({"msg": "found user","status":"success", data: finaldata});
              res.end();
            }
          });
        }else{
          res.status(500);
          res.send({"msg": "no user found or session expired, please login again", "status":"fail", data: results});
          res.end();
        }
      }
    });
  } else {
    res.status(500);
    res.send({"msg": "No Token found","status":"fail"});
    res.end();
  }
});


router.post('/updateProfile', function (req, res) {
  var token = req.param("token");
  var fname = req.param("firstname");
  var lname = req.param("lastname");
  var email = req.param("email");
  var password = req.param("password");
  var gender = req.param("gender");
  var age = req.param("age");
  var city = req.param("city");
  var state = req.param("state");
  var country = req.param("country");
  var interests = req.param("interests");
  var qry = "select * from adv.users where token = ? and email = ? ";
  if (token) {
    var params = [token,email];
    mysql.fetchData(qry, params, function (err, results) {
      if (err) {
        res.status(500);
        res.send({"msg": err,"status":"fail"});
        res.end();
      } else {
        console.log(results);
        var user_id = results[0].id;
        if(results.length) {
          var sql1 = "update  users set fname = ?, lname = ?, password= ?, gender= ?, age= ?, city= ? ,state= ?, country= ? where token = ? and email = ?";
          var params = [fname,lname,password,gender,age,city,state,country,token,email];
          mysql.execQuery(sql1, params , function(err, results) {
            if(err) {
              res.statusCode = 500;
              res.send(errorMessage(err));
            }else{
              var sql2 = "delete from adv.interests where userid = ?";
              mysql.execQuery(sql2,[user_id],function(err, results){
                if(err){
                  res.status(500);
                  res.send({"msg": "error updating users", "status":"fail", data: results});
                  res.end();
                }else{

                }
              });
              res.status(200);
              res.send({"msg": "Updated user","status":"success"});
              res.end();
            }
          });
        }else{
          res.status(500);
          res.send({"msg": "no user found or session expired, please login again", "status":"fail", data: results});
          res.end();
        }
      }
    });
  } else {
    res.status(500);
    res.send({"msg": "No Token found","status":"fail"});
    res.end();
  }
});

router.post('/signup', function(req,res) {
  var fname = req.param("firstname");
  var lname = req.param("lastname");
  var email = req.param("email");
  var password = req.param("password");
  var qry = "insert into users (fname,lname,email,password) values (?,?,?,?)";
  var params = [fname, lname, email, password];
  mysql.execQuery(qry,params, function(err,results){
    if(err){
      res.status(500);
      res.send({"msg":err,"status":"fail"});
      res.end();
    }
    else{
      res.status(200);
      res.send({"msg":"successfully created user","status":"success"});
      res.end();
    }
  });
});


function updateUserToken(profile,callback) {
  var accessToken = profile.accessToken;
  var getUser = "select * from users where email= ?";
  var email = "emails" in profile ? profile.emails[0].value : profile.email;
  var params = [email];

  console.log("check email" + email);
  mysql.fetchData(getUser,params,function(err,results){
    if(err){
      console.log(err);
      callback ({status:'fail',msg:err});
    }
    else
    {
      if(results.length > 0){
        console.log("Email exists in DB");
        params = [accessToken, email];
        var updQry = "update users set token = ?  where  email = ? ";
        mysql.execQuery(updQry,params, function(err,results){
          if(err){
            console.log("error singing up");
            callback( {status:'fail',msg:err} );
          }
          else{
            console.log("updated user acces token");
            callback( {status:'success',accessToken:accessToken} );
          }
        });

      }
      else {
        console.log("error singing up");
        callback( {status:'fail',msg:err} );
      }
    }
  });
}


var errorMessage = function sendError(err){
  var obj = {
    status: "fail",
    msg: err
  };
  return JSON.stringify(obj);
};

module.exports = router;
