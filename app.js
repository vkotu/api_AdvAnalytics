var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('./routes/mysql');
var routes = require('./routes/index');
var users = require('./routes/users');
//var twitterAPI = require('./routes/twitter');
var secretKey = "venkat";
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jwt-simple');
var passport = require('passport');

app.use('/', routes);
app.use('/users', users);
// app.use('/twit',twitterAPI);

passport.use(new LocalStrategy({usernameField: 'email',passwordField: 'password',session:false,passReqToCallback:true},
    function(req,username, password, done) {
      console.log(req);
      var getUser="select * from users where email=? and password= ?";
      var params = [username,password];
      mysql.fetchData(getUser,params,function(err,results){
        if(err){
          var msg = "Error occurred while logging in " + err;
          return done(msg);
        }
        else
        {
          if(results.length > 0){
            console.log("valid Login");
            console.log(results[0]);
            var user = results[0];
            user.provider = 'local';
            var id = user.id;
            var token = jwt.encode(id, secretKey);
            user.accessToken = token;
            return done(null,user)
          }
          else {
            console.log("Invalid Login");
            return done(null,false);
          }
        }
      });
    }
));
app.use(passport.initialize());
app.use(passport.session());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var server = app.listen(5200, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port)

});

module.exports = app;
