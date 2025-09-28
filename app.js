const express = require('express');
const path = require('path');
const body_parser = require('body-parser');
const {Userrouter} = require('./Router/User-Router');
const {Hostrouter} = require('./Router/Host-Router');
const rootdir = require('./utils/pathUtil');
const session = require('express-session');
const mongodbsession = require('connect-mongodb-session')(session);
const errorcontroller = require("./controller/error");
const { mongoConnect } = require('./utils/databaseutil');
// const session = require('express-session');
const app = express();
app.set('view engine', 'ejs');
app.set('views','views');

const store = new mongodbsession({
  uri: `mongodb+srv://rajansingh8593:rajan123@captanjack.rr7lw.mongodb.net/?retryWrites=true&w=majority&appName=Captanjack`,
  collection: 'sessions'
});

app.use(session({
  secret: 'your_secret_key', // Change this to a secure key
  resave: false,
  saveUninitialized: true,
  store : store,
}));

app.use(express.urlencoded());
app.use((req,res,next)=>{
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.userType = req.session.userType;
  res.user = req.session.user;// Add this line to make user data available in views
  next();
})
app.use(Userrouter);
app.use(Hostrouter);

app.use(express.static(path.join(rootdir,'public')));
app.use(errorcontroller.Error404);

const port = 3001;
mongoConnect(()=>{
  app.listen(port,()=>{
    console.log(`server Started At: http://localhost:${port}/home`);
  });
})
