var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CEMCS' });
});

router.get('/getMemberExposure',(req,res)=>{
    const {nEmpNo,nMonth,sYear}=req.body;
    val=Math.round(Math.random() * 100000,2).toString()
    // res.send(val)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>`
    xml += `<user>`
    // for (let i = 0; i < 99; i++) {
      xml += `
      <value> 
          <exposure>${val}</exposure>          
      </value>`
    // }
    xml += `</user>`
    res.header('Content-Type', 'application/xml')
    res.status(200).send(xml)
})

module.exports = router;
