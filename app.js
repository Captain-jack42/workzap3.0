const express = require('express');
const path = require('path');
const body_parser = require('body-parser');
const {Userrouter} = require('./Router/User-Router');
const {Hostrouter} = require('./Router/Host-Router');
const rootdir = require('./utils/pathUtil');
const errorcontroller = require("./controller/error");
const { mongoConnect } = require('./utils/databaseutil');
const app = express();
app.set('view engine', 'ejs');
app.set('views','views');

app.use(express.urlencoded());

app.use(Userrouter);
app.use(Hostrouter);
app.use(express.static(path.join(rootdir,'public')));
app.use(errorcontroller.Error404);

const port = 3000;
mongoConnect(()=>{
  app.listen(port,()=>{
    console.log(`server Started At: http://localhost:${port}/home`);
  });
})
