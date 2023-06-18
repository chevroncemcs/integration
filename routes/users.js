require('dotenv').config();
const express= require('express');
const bodyParser=require('body-parser');
var request = require('request');
const https=require('https');
const escapeStringRegexp = import('escape-string-regexp');
const session = require('express-session');
const passport= require('passport');
const passportLocalMongoose= require('passport-local-mongoose')
var _ = require('lodash');

const app=express();

const mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(session({
secret: 'keyboard cat',
resave: false,
saveUninitialized: false,
//cookie: { secure: true }
}))

mongoose.connect("mongodb://localhost:27017/journal")
//mongoose.connect("mongodb+srv://admin-charles:test123@cluster0.nnugh.mongodb.net/journal?retryWrites=true&w=majority");


port=3000


app.get('/',(req,res)=>{
data={

}
  res.sendFile(__dirname+'/index.html');
 //res.render('index', {data:data});  
})


app.listen(port,()=>{
  console.log(`Server is running! Port: port`)
})