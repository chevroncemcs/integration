var express = require('express');
var router = express.Router();
// var url=`https://staging-onlinemerchants.suregifts.com/api/voucherredemption`
var url=`https://onlinemerchants.suregifts.com/api/voucherredemption`
var request = require('request');

router.get('/balance',async(req,res)=>{  
    if(req.header("APIKEY")!=process.env.APIKEY){
      res.send({
        error:true,
        message:`You are not authorized to access this resource!`
      })
    }
    else{    
      const {code}=req.body
      var request = require('request');
      var options = {
        'method': 'GET',
        'url': `${url}?VoucherCode=${code}`,
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': process.env.SUREGIFT_AUTH
        }      
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        res.send(JSON.parse(response.body));
      });
      
    }
})

router.post('/redeem',async(req,res)=>{  
    if(req.header("APIKEY")!=process.env.APIKEY){
      res.send({
        error:true,
        message:`You are not authorized to access this resource!`
      })
    }
    else{    
      const {code,amount}=req.body
      var request = require('request');
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
        })    
      };
      request(options, async function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        var sres=JSON.parse(response.body);
        if(sres.Response=="00"){            
            create_erp_voucher(code,amount,'Success',(eres)=>{
                res.send(JSON.parse(response.body));
            });
        }
        else{
            create_erp_voucher(code,amount,'Failed',(eres)=>{
                res.send(JSON.parse(response.body));
            });
        }
        
      });
      
    }
})


async function create_erp_voucher(code,amount,status,callback){
    var request = require('request');
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
        })            

        };
        request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        return callback(response.body)
        });

}

module.exports = router;