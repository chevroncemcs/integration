var express = require('express');
var router = express.Router();
// var url=`https://staging-onlinemerchants.suregifts.com/api/voucherredemption`
var url=`https://onlinemerchants.suregifts.com/api/voucherredemption`
var request = require('request');

var TIMEOUT = 15000; // stay under the Hub's 20s

function parseJson(body){
    try { return JSON.parse(body); } catch(e){ return null; }
}

router.get('/balance',async(req,res)=>{
    if(req.header("APIKEY")!=process.env.APIKEY){
      return res.send({
        error:true,
        message:`You are not authorized to access this resource!`
      })
    }
    const {code}=req.body
    var options = {
      'method': 'GET',
      'url': `${url}?VoucherCode=${encodeURIComponent(code||'')}`,
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': process.env.SUREGIFT_AUTH
      },
      timeout: TIMEOUT
    };
    request(options, function (error, response) {
      if (error) {
        console.error('Suregift balance error:', error.message);
        return res.status(502).send({error:true, message:error.message});
      }
      console.log(response.body);
      var data=parseJson(response.body);
      if(data===null){
        return res.status(502).send({error:true, message:response.body});
      }
      res.send(data);
    });
})

router.post('/redeem',async(req,res)=>{
    if(req.header("APIKEY")!=process.env.APIKEY){
      return res.send({
        error:true,
        message:`You are not authorized to access this resource!`
      })
    }
    const {code,amount}=req.body
    var options = {
      'method': 'POST',
      'url': `${url}`,
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': process.env.SUREGIFT_AUTH
      },
      body: JSON.stringify({
          "VoucherCode": code,
          "amountToUse": amount
      }),
      timeout: TIMEOUT
    };
    request(options, function (error, response) {
      if (error) {
        console.error('Suregift redeem error:', error.message);
        return res.status(502).send({error:true, message:error.message});
      }
      console.log(response.body);
      var sres=parseJson(response.body);
      if(sres===null){
        return res.status(502).send({error:true, message:response.body});
      }

      // Answer the Hub FIRST.
      res.send(sres);

      // Then log to ERP.
      var status = sres.Response=="00" ? 'Success' : 'Failed';
      create_erp_voucher(code,amount,status,(ok)=>{
          if(!ok && status=='Success'){
              console.error('RECONCILE: voucher redeemed but not logged in ERP', JSON.stringify({code, amount, at:new Date().toISOString()}));
          }
      });
    });
})

function create_erp_voucher(code,amount,status,callback){
    var options = {
        'method': 'POST',
        'url': 'https://erp.chevroncemcs.com/api/resource/Suregift%20Voucher',
        'headers': {
            'Content-Type': 'application/json',
            'Authorization': process.env.ERP_AUTH,
        },
        body: JSON.stringify({
            "code": code,
            "amount": amount,
            "tstatus": status,
            "docstatus": 1
        }),
        timeout: TIMEOUT
    };
    request(options, function (error, response) {
        if (error) {
            console.error('ERP voucher log error:', error.message);
            return callback(false);
        }
        console.log(response.body);
        callback(response.statusCode>=200 && response.statusCode<300);
    });
}

module.exports = router;