var express = require('express');
var router = express.Router();
var mysql = require('./mysql');
var passport = require('passport');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.post('/login',
    passport.authenticate('local', { session: false, failureRedirect: "http://localhost:5200/" }),
    function(req, res) {
      console.log(req.user);
      updateUserToken(req.user,function(msg){
        if(msg.status == 'fail'){
          res.status(500);
          res.send({"msg":msg.msg});
          res.end();
        }else{
          res.status(200);
          res.send({"msg":"Valid Login",accessToken:msg.accessToken});
          res.end();
        }
      });
    }
);


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
      res.send({"msg":err});
      res.end();
    }
    else{
      res.status(200);
      res.send({"msg":"successfully created user"});
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
        params = [accessToken,profile.provider, email];
        var updQry = "update users set token = ?  where  email = ? ";
        mysql.execQuery(updQry,params, function(err,results){
          if(err){
            console.log("error singing up");
            callback( {status:'fail',msg:err} );
          }
          else{
            console.log("updated user acces token");
            callback( {status:'ok',accessToken:accessToken} );
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
