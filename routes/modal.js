
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send([
    {
        image: "ecommerce.jpg",
        button: true,
        text: "CEMCS SHOP",
        link: "https://shop.chevroncemcs.com"
    }
])
});



module.exports = router;
