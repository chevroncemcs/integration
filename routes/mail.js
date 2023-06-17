var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
require('dotenv').config();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CEMCS' });
});

router.post('/send', function(req, res){
    if(req.header("APIKEY")!=process.env.APIKEY){
      res.send({
        error:true,
        message:"You are not authorized to access this resource!"
      })
    }
    const{to,subject,cc=null,html}=req.body;
    var transporter = nodemailer.createTransport({
        host:"premium123.web-hosting.com",
        port: 465,
        secure: true,
        auth: {
          user: 'mail@chevroncemcs.com',
          pass: process.env.EMAIL_PASSWORD
        }
      });
      if(cc==null){
        var mailOptions = {
          from: 'Chevron CEMCS <mail@chevroncemcs.com>',
          to: to,
          subject: subject,
          html: html
        };
      }
      else{
        var mailOptions = {
          from: 'Chevron CEMCS <mail@chevroncemcs.com>',
          to: to,
          cc:cc,
          subject: subject,
          html: html
        };
      }
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          if(error) throw error;
          res.send({
            error:true,
            message:error
          })
        } else {
        //   console.log('Email sent: ' + info.response);
            res.send({
                error:false,
                message:info.response
            })
        }
      });
})
module.exports = router;
