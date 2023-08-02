
var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.send( [
    {
        image: "imagesCharles/may/WEB GRAPHICS PILOT ORDER 2.jpg",
        button: true,
        text: "Shop Now",
        link: "https://shop.chevroncemcs.com"
    },
    {
        image: "imagesCharles/august/WEB GRAPHICS NEW VISA corrected.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "imagesCharles/may/ADVERT RATE NEW.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "imagesCharles/august/NEW INSURANCE corrected.jpg",
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
        image: "imagesCharles/may/WEB GRAPHICS NEW LOANS 2 corrected.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "imagesCharles/may/WEB GRAPHICS Executive Loan NEW 2.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "imagesCharles/august/WEB GRAPHICS NEW DEPOSITS 2 correct.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },

    {
        image: "imagesCharles/may/WEB GRAPHICS NEW TELEPHONES 2.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "imagesCharles/may/exhibitor/themeadows.jpg",
        button: false,
        text: "Test",
        link: "/imposter"
    },
    {
        image: "imagesCharles/may/exhibitor/regal.jpg",
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
