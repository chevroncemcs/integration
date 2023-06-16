require('dotenv').config();

const mysql = require('mysql');
const con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    port: 1433,
    database: process.env.DATABASE
});

con.connect(function(err) {
    if (err) throw err;
    //console.log("Connected to database!");
});

exports.connect=()=>{    
    return con
}