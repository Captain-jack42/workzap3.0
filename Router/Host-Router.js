
const path = require('path');
const express = require('express');
const Hostrouter = express.Router();
const rootdir = require('../utils/pathUtil');
const Hostcontroller = require('../controller/host');
  Hostrouter.get("/host",Hostcontroller.getHostHome);
  
  Hostrouter.get("/signup",Hostcontroller.getSignup);
  
  Hostrouter.post("/Login",Hostcontroller.postLogin);
  
  Hostrouter.post("/signup",Hostcontroller.postSignup);
  
    Hostrouter.post("/form-submit",Hostcontroller.postForm); 

    Hostrouter.post("/post-job",Hostcontroller.postJob); 

    Hostrouter.get("/worker",Hostcontroller.getWorker);

    Hostrouter.get("/joblisting",Hostcontroller.getPostedJob);

    Hostrouter.get("/hiring",Hostcontroller.postHiring);

    Hostrouter.post("/hiring",Hostcontroller.postHiring);

    Hostrouter.get("/hired",Hostcontroller.getHired);

    Hostrouter.get("/feedback" , Hostcontroller.getFeedbackForm);

    Hostrouter.post("/submit-feedback" , Hostcontroller.postFeedback);

    Hostrouter.get("/dashboard" , Hostcontroller.getDashboard);

    Hostrouter.get("/payroll", Hostcontroller.getPayroll);

    Hostrouter.get("/report" , Hostcontroller.getReport);

exports.Hostrouter = Hostrouter;