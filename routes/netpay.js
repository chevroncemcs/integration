var express = require('express');
var router = express.Router();

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
      voucher:"cemcs"
    })
  }
  res.send({
    error:false,
    data:data
  })
})

router.post('/checkMemberEligibility',(req,res)=>{
  const {empno,currentExposure,monthlyRepayment,repayStartMonth,year,voucher}=req.body
  console.log(empno,currentExposure,monthlyRepayment,repayStartMonth,year,voucher)
  boolea=[0,1]
  res.send({
    error:false,
    value:boolea[Math.floor(Math.random()*boolea.length)]
  })
})

module.exports = router;
