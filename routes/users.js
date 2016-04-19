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
  var qry = "select * from adv.users where token = ?";
  if (token) {
    var params = [token];
    mysql.fetchData(qry, params, function (err, results) {
      if (err) {
        res.status(500);
        res.send({"msg": err,"status":"fail"});
        res.end();
      } else {
        console.log(results);
        if(results.length){
          res.status(200);
          res.send({"msg": "found user","status":"success", data: results});
          res.end();
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


module.exports = router;
