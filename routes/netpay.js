var express = require('express');
var router = express.Router();
var url=`https://apim.chevron.com/public/netpay/v1/`
var request = require('request');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CEMCS' });
});

router.post('/getMemberExposure',(req,res)=>{  
  if(req.header("APIKEY")!=process.env.APIKEY){
    res.send({
      error:true,
      message:"You are not authorized to access this resource!"
    })
  }
  const {empNo,month,year}=req.body
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://member.chevroncemcs.com/api/method/member_extra.mms_extra.api.api.get_exposure',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': process.env.MEMBER_AUTH
    },
    body: JSON.stringify({
      "empNo": empNo,
      "month": month,
      "year": year
    })
  
  };
  // res.send({
  //   error: true
  // });
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body)
    res.send(JSON.parse(response.body).message);
  });
  
})

router.post('/uploadMfb',(req,res)=>{
  const {month,year,deductions}=req.body
  console.log(req.body);
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://member.chevroncemcs.com/api/method/member_extra.mms_extra.api.api.add_mfb_deduction',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': process.env.MEMBER_AUTH
    },
    body: JSON.stringify({      
      "month": month,
      "year": year,
      "deductions":JSON.parse(deductions)
    })
  
  };
  // res.send({
  //   error: true
  // });
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body)
    res.send(JSON.parse(response.body).message);
  });

})

router.post('/getMonthlyPayrollSchedule',(req,res)=>{
  const {month,year}=req.body
  data=[]
  payrollCode=[6020,6030,6040,6050,6070]
  empno=[102234,100232,123422,144322,43228]
  console.log(month,year);
  for (i=0;i<20;i++){
    data.push({
      empNo:empno[Math.floor(Math.random()*empno.length)],
      empName:"John Doe",
      dbaCode:payrollCode[Math.floor(Math.random()*payrollCode.length)],
      deduction:Math.round(Math.random() * 100000,2),
      voucher:"Y"
    })
  }
  res.send({
    error:false,
    data:data
  })
})

router.post('/canEmployeeAccomodateAdditionalMonthlyDeduction',(req,res)=>{
  if(req.header("APIKEY")!=process.env.APIKEY){
    res.send({
      error:true,
      message:"You are not authorized to access this resource!"
    })
  }
  const {empno,currentExposure,monthlyRepayment,repayStartMonth,year,voucher}=req.body
  // console.log(empno,currentExposure,monthlyRepayment,repayStartMonth,year,voucher)
  getToken((responsee)=>{
    console.log(responsee.access_token)
    var options = {
      'method': 'GET',
      'url': url+`employee/${empno}/deductions-eligibility?currentMonthlyDeductions=${currentExposure}&additionalMonthyDeduction=${monthlyRepayment}&startMonth=${repayStartMonth}&year=${year}&key=CEMCS`,
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' +responsee.access_token,
        'Ocp-Apim-Subscription-Key': process.env.OCIM_KEY
      },
    };
    // console.log(options.url)
    request(options, function (error, response) {
      
      console.log("Body:",response.body)
      if (error) throw new Error(error);
      // console.log(response.body);
      result = JSON.parse(response.body)
      if(result.resultDescription=="SUCCESS"){
        res.send({
          error:false,
          value:result.employeeCanPerformAction?1:0,
          message:result.resultDescription
        })
      }
      else{
        res.send({
          error:true,
          value:0,
          message:result.resultDescription,
          // url:options.url
        })
      }
      
    });
    
    // boolea=[1,0]
    // res.send({
    //   error:false,
    //   value:boolea[Math.floor(Math.random()*boolea.length)]
    // })
  })
 
})

router.post('/canEmployeeCollectTargetLoan',(req,res)=>{
  if(req.header("APIKEY")!=process.env.APIKEY){
    res.send({
      error:true,
      message:"You are not authorized to access this resource!"
    })
  }
  var {empno,targetLoanType,currentDeductionForSpecifiedMonth,targetAmount,key}=req.body
  // console.log(empno,targetLoanType,currentDeductionForSpecifiedMonth,targetAmount,key)
  // targetAmount=getTarget(targetAmount)
  // console.log(targetAmount)
  getToken((responsee)=>{
      // console.log(responsee.access_token)
    
      var options = {
        'method': 'GET',
        'url': url+`employee/${empno}/loan/${targetLoanType}/eligibility?employeeNo=${empno}&targetLoanType=${targetLoanType}&currentDeductionForSpecifiedMonth=${currentDeductionForSpecifiedMonth}&targetAmount=${targetAmount}&key=CEMCS`,
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' +responsee.access_token,
          'Ocp-Apim-Subscription-Key': process.env.OCIM_KEY
        },
      };
      // console.log(options.url)
      request(options, function (error, response) {
        
        console.log("Body:",response.body)
        if (error) throw new Error(error);
        // console.log(response.body);
        result = JSON.parse(response.body)
        if(result.resultDescription=="SUCCESS"){
          res.send({
            error:false,
            value:result.employeeCanPerformAction?1:0,
            message:result.resultDescription
          })
        }
        else{
          res.send({
            error:true,
            value:0,
            message:result.resultDescription,
            // url:options.url
          })
        }
        
      });
      
      // boolea=[1,0]
      // res.send({
      //   error:false,
      //   value:boolea[Math.floor(Math.random()*boolea.length)]
      // })
    })

  
  // res.send({
  //   error:false,
  //   value:1,
  //   message:"none"
  // })
  // request(options, function (error, response) {
  //   if (error) throw new Error(error);
  //   // console.log(response.body);
  //   result = JSON.parse(response.body)
  //   if(result.resultDescription=="SUCCESS"){
  //     res.send({
  //       error:false,
  //       value:result.employeeCanPerformAction?1:0,
  //       message:result.resultDescription
  //     })
  //   }
  //   else{
  //     res.send({
  //       error:true,
  //       value:0,
  //       message:result.resultDescription
  //     })
  //   }
  // });

  // boolea=[1,0]
  // if(targetAmount>10000000){
  //   res.send({
  //     error:false,
  //     value:0
  //   })
  // }
  // else{
    // res.send({
    //   error:false,
    //   value:1
    // })
  // }
  
})

router.post('/canEmployeeGetOneTimeIncrease',(req,res)=>{
  if(req.header("APIKEY")!=process.env.APIKEY){
    res.send({
      error:true,
      message:"You are not authorized to access this resource!"
    })
  }
  const {empno,currentDedution,additionalDeduction,month,year,key}=req.body
  console.log(empno,currentDedution,additionalDeduction,month,year,key)
  boolea=[1,0]
  res.send({
    error:false,
    value:boolea[Math.floor(Math.random()*boolea.length)]
  })
})

router.post('/ebenefit',async(req,res)=>{
  if(req.header("APIKEY")!=process.env.APIKEY){
    res.send({
      error:true,
      message:"You are not authorized to access this resource!"
    })
  }
  const {month,year}=req.body
  // console.log(empno,currentDedution,additionalDeduction,month,year,key)
  // boolea=[1,0]
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://member.chevroncemcs.com/api/method/member_experience.api.api.fetch_report',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': process.env.MEMBER_AUTH,
      'Cookie': 'full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image='
    },
    body: JSON.stringify({
      "filters": {
        "member_type": "Regular Member",
        "month": month,
        "year": year
      }
    })

  };
  await getEbenefits(month,year,(result)=>{
    res.send(result);
  });
  // request(options, function (error, response) {
  //   if (error) throw new Error(error);
  //   report=[]
  //   var schedule=JSON.parse(response.body).message
  //   for(j=0;j<schedule.length;j++){
  //     memschedule=schedule[j]
  //     // console.log(memschedule)
  //     var name=memschedule[1]
  //     var empno=memschedule[2]
  //     var exception=[10]//Exception for ebenefits [TSL]
  //     for (i=3;i<=14;i++){
  //       switch(i){
  //         //Savings
  //         case 3:
  //           dbacode=6020
  //           break;
  //         //SD
  //         case 4:
  //           dbacode=6050
  //           break;
  //         //STL
  //         case 5:
  //           dbacode=6060
  //           break;
  //         //LTL
  //         case 6:
  //           dbacode=6070
  //           break;
  //         //CPAY
  //         case 7:
  //           dbacode=6060
  //           break;
  //         //HAL
  //         case 8:
  //           dbacode=6090
  //           break;
  //         //CL Car loan
  //         case 9:
  //           dbacode=6080
  //           break;
  //         //TSL
  //         case 10:
  //           dbacode=7070
  //           break;
  //         //EL1
  //         case 11:
  //           dbacode=6085
  //           break;
  //         //EL2  
  //         case 12:
  //           dbacode=6085
  //           break;
  //         //EL3
  //         case 13:
  //           dbacode=6085
  //           break;
  //         //EL4
  //         case 14:
  //           dbacode=6085
  //           break;
  //       }
  //       if(!exception.includes(i)){
  //         if(memschedule[i]!=0){
  //           report.push({
  //             employee_name:name,
  //             employee_number:empno,
  //             dba_code:dbacode,
  //             deduct_amount:memschedule[i],
  //             AP_voucher:'Y'
              
  //           })
  //         }
  //       }
        
  //     }
  //   }
  //   res.send({
  //     error:false,
  //     value:report
  //   })
  // });
 
})


function getToken(rescallback){
  var request = require('request');
  var options = {
    'method': 'GET',
    'url': 'https://login.microsoftonline.com/fd799da1-bfc1-4234-a91c-72b3a1cb9e26/oauth2/v2.0/token',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded',      
    },
    form: {
      'grant_type': 'client_credentials',
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
      'scope': process.env.SCOPE
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    return rescallback(JSON.parse(response.body))
  });

}

function getTarget(amount){
  return amount*0.75
}

router.get('/ebenefit', async function(req, res, next) {  
  const {month,year}=req.query

  if (month !== undefined && year !== undefined){
    await getEbenefits(month, year, (data)=>{
      ebenefit=data.value;      
      res.render('ebenefits', { title: 'CEMCS - Ebenefits',show:true,month:month,year:year,ebenefit:ebenefit});
    })
  }
  else{
    res.render('ebenefits', { title: 'CEMCS - Ebenefits', show:false });
  }
});

router.get('/mfb', async function(req, res, next) {  
  res.render('mfb', { title: 'CEMCS - Ebenefits' });
});

async function getEbenefits(month,year,callback){
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://member.chevroncemcs.com/api/method/member_experience.api.api.fetch_report',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': process.env.MEMBER_AUTH,
      'Cookie': 'full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image='
    },
    body: JSON.stringify({
      "filters": {
        "member_type": "Regular Member",
        "month": month,
        "year": year
      }
    })

  };
  request(options, async function (error, response) {
    if (error) throw new Error(error);
    report=[]

    await getMFBDeduction(month,year,(mfbdeduction)=>{
      // console.log(mfbdeduction.deduction.data)
      if(mfbdeduction.error==true){
        deduction=[]
      }
      else{
        var deduction=mfbdeduction.data.deduction
      }      
      var schedule=JSON.parse(response.body).message
    for(j=0;j<schedule.length;j++){
    // for(j=0;j<4;j++){
      memschedule=schedule[j]
      // console.log(memschedule)
      var name=memschedule[1]
      var empno=memschedule[2]
      // console.log(empno)
      var exception=[10]//Exception for ebenefits [TSL]

      if(deduction[empno]){            
        mfbded=deduction[empno]
        console.log(empno)
       //  console.log(mfbded)
        report.push({
          employee_name:mfbded.employee_name,
          employee_number:mfbded.employee_number,
          dba_code:6040,  //MFB Code
          deduct_amount:mfbded.deduct_amount, //
          AP_voucher:'Y',
          product:"MFB"               
        })
      }     

          
      for (i=3;i<=14;i++){
        switch(i){
          //Savings
          case 3:
            product="Savings"
            dbacode=6020
            break;
          //SD
          case 4:
            product="SD"
            dbacode=6050
            break;
          //STL
          case 5:
            product="Short Term Loan"
            dbacode=6060
            break;
          //LTL
          case 6:
            product="Long Term Loan"
            dbacode=6070
            break;
          //CPAY
          case 7:
            product="CPAY"
            dbacode=6060
            break;
          //HAL
          case 8:
            product="Home Appliance Loan"
            dbacode=6090
            break;
          //CL Car loan
          case 9:
            product="Car Loan"
            dbacode=6080
            break;
          //TSL
          case 10:
            product="Target Loan"
            dbacode=7070
            break;
          //EL1
          case 11:
            product="EL1"
            dbacode=6085
            break;
          //EL2  
          case 12:
            product="EL2"
            dbacode=6085
            break;
          //EL3
          case 13:
            product="EL3"
            dbacode=6085
            break;
          //EL4
          case 14:
            product="EL4"
            dbacode=6085
            break;
        }
        if(!exception.includes(i)){
          if(memschedule[i]!=0){
            report.push({
              employee_name:name,
              employee_number:empno,
              dba_code:dbacode,
              deduct_amount:memschedule[i],
              AP_voucher:'Y',
              product:product              
            })
          }
        }
        
      }
    }
    return callback({
      error:false,
      value:report
    })
     
    })

    // get mfb deduction    
    
    // console.log(response.body);
    
  });
}


async function getMFBDeduction(month,year,callback){
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://member.chevroncemcs.com/api/method/member_extra.mms_extra.api.api.get_mfb_deduction',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': process.env.MEMBER_AUTH,
      'Cookie': 'full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image='
    },
    body: JSON.stringify({        
        "month": month,
        "year": year
    })

  };  
  request(options, function(error, response) {
    if (error) throw new Error(error);
    report=[]
    // console.log(response.body);
    var deduction=JSON.parse(response.body).message    
    return callback(deduction)
  });
}
module.exports = router;
