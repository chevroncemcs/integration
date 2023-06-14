require('dotenv').config();
const express= require('express');
const bodyParser=require('body-parser');
var request = require('request');
const https=require('https');
const escapeStringRegexp = import('escape-string-regexp');
const session = require('express-session');
var _ = require('lodash');

const app=express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
// app.use(session({
// secret: 'keyboard cat',
// resave: false,
// saveUninitialized: false,
// //cookie: { secure: true }
// }))



port=3000


app.get('/',(req,res)=>{
data={

}
    //res.sendFile(__dirname+'/index.html');
 //res.render('index', {data:data}); (
 
 res.send("Build in progress")
})


app.listen(port,()=>{
    console.log(`Server is running! Port: port`)
})