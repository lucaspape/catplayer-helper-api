const mysql = require('mysql');

const dbName = 'monstercatDB';

const mysqlConnection = mysql.createConnection({
    host: 'mariadb',
    user: 'root',
    password: 'JacPV7QZ',
    database: dbName
  });

module.exports = {
    getConnection: function(callback, errorCallback){
            if(mysqlConnection.state === 'disconnected'){
                mysqlConnection.connect(err => {
                    if (err) {
                      console.log(err);
                      errorCallback(err);
                    } else {
                        connected = true;
                        callback(mysqlConnection);
                    }
                });
            }else{
                callback(mysqlConnection);
            }
    }
}