var express = require('express');
var router = express.Router();
var url=`https://netpay-dev-cvx.azurewebsites.net/`
var request = require('request');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CEMCS' });
});

router.post('/getMemberExposure',(req,res)=>{
    const {empNo,month,year}=req.body;
    console.log(empNo,month,year)
    val=Math.round(Math.random() * 100000,2)
    res.send({
      error:false,
      value:val
    })
    // let xml = `<?xml version="1.0" encoding="UTF-8"?>`
    // // xml += `<user>`
    // // for (let i = 0; i < 99; i++) {
    //   // xml += `
    //   // <double> 
    //   //     <exposure>${val}</exposure>          
    //   // </value>`
    //   xml += `<double xmlns="http://www.cemcsltd.com/webservice">${val}</double>`
    // // }    
    // res.header('Content-Type', 'application/xml')
    // res.status(200).send(xml)
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
  var options = {
    'method': 'GET',
    'url': url+`deduction?employeeNo=${empno}&currentMonthlyDeductions=${currentExposure}&additionalMonthyDeduction=${monthlyRepayment}&startMonth=${repayStartMonth}&year=${year}&key=Y`,
    'headers': {
      'Content-Type': 'application/json',
    },
  };
  // console.log(options.url)
  request(options, function (error, response) {
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
        message:result.resultDescription
      })
    }
    
  });
  
  // boolea=[1,0]
  // res.send({
  //   error:false,
  //   value:boolea[Math.floor(Math.random()*boolea.length)]
  // })
})

router.post('/canEmployeeCollectTargetLoan',(req,res)=>{
  if(req.header("APIKEY")!=process.env.APIKEY){
    res.send({
      error:true,
      message:"You are not authorized to access this resource!"
    })
  }
  const {empno,targetLoanType,currentDeductionForSpecifiedMonth,targetAmount,key}=req.body
  // console.log(empno,targetLoanType,currentDeductionForSpecifiedMonth,targetAmount,key)

  var options = {
    'method': 'GET',
    'url': url+`loan?employeeNo=${empno}&targetLoanType=${targetLoanType}&currentDeductionForSpecifiedMonth=${currentDeductionForSpecifiedMonth}&targetAmount=${targetAmount}&key=Y`,
    'headers': {
      'Content-Type': 'application/json',
    },
  };
  
  request(options, function (error, response) {
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
        message:result.resultDescription
      })
    }
  });

  // boolea=[1,0]
  // if(targetAmount>10000000){
  //   res.send({
  //     error:false,
  //     value:0
  //   })
  // }
  // else{
  //   res.send({
  //     error:false,
  //     value:1
  //   })
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

module.exports = router;
