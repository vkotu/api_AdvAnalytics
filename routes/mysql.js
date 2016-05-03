/**
 * Created by kotu on 3/27/16.
 */
var ejs= require('ejs');
var mysql = require('mysql');

//function getConnection(){
//    var connection = mysql.createConnection({
//        host     : 'localhost',
//        user     : 'root',
//        password : 'password',
//        database : 'Advertiser_Analytics'
//    });
//    return connection;
//}


function getConnection(){
    var connection = mysql.createConnection({
        host     : '104.197.18.167',
        user     : 'root',
        password : 'root',
        database : 'adv'
    });
    return connection;
}


function fetchData(sqlQuery,params,callback){

    console.log("\nSQL Query::"+sqlQuery);
    var connection=getConnection();


    connection.query(sqlQuery,params, function(err, rows, fields) {
        if(err){
            console.log("ERROR: " + err.message);
        }
        else
        {	// return err or result
            //console.log("DB Results:"+rows);
            callback(err, rows);
        }
    });
    //console.log("\nConnection closed..");
    connection.end();
}
//params is an array
function execQuery(query, params,callback) {
    var connection=getConnection();

    connection.query(query, params,function(err,result){
        if(err) {
            console.log("In exec Qeury = "+ err);
        }
        callback(err,result);
    });

    console.log("\nConnection closed..");
    connection.end();

}

exports.fetchData=fetchData;
exports.execQuery=execQuery;