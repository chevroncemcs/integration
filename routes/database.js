var express = require('express');
var router = express.Router();
// const md5 = require('md5');
// const con = require('../connection/index').connect();

/* GET home page. */
router.get('/', function(req, res, next) {
//   res.render('index', { title: 'CEMCS' });
    // var sql= `SELECT * FROM user;`
    // con.query(sql, (err, res) => {
    //      if(err) throw err;
  
    //     res.send({
    //         error:false,
    //         data:res
    //     }) 
    // });

});

module.exports = router;
