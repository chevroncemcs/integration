
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send( [
    {
        image: "WEB GRAPHICS PILOT ORDER 2.jpg",
        button: true,
        text: "Shop Now",
        link: "https://shop.chevroncemcs.com"
    },
    {
        image: "WEB GRAPHICS NEW VISA.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "ADVERT RATE NEW.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "insurance.png",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    // {
    // image:"comm.png",
    // button:false,
    // text:"",
    // link:""
    // },            
    {
        image: "WEB GRAPHICS NEW LOANS 2.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "WEB GRAPHICS Executive Loan NEW 2.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "WEB GRAPHICS NEW DEPOSITS.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },

    {
        image: "WEB GRAPHICS NEW TELEPHONES 2.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "exhibitor/themeadows.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "exhibitor/regal.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    // {
    // image:"whatsapp flier1.0.jpg",
    // button:false,
    // text:"Get Started",
    // link:"https://wa.me/message/HBHRYPAMHF23P1"
    // },          


])
});



module.exports = router;
