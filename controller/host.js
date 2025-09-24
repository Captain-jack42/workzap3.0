// const { use } = require("react");
const Feedback = require("../models/feedback");
const Hired = require("../models/Hired");
const Home = require("../models/Home");
const Job = require("../models/PostJob");
const User = require("../models/User");
const bcrypt = require('bcryptjs')

exports.getHostHome =(req,res,next)=>{
  res.render('host-home');
};



exports.getSignup = (req,res,next)=>{
  res.render('signup');
};

exports.postForm=(req,res,next)=>{
  const {fullName,gender,profession,experience,skills} = req.body;
  const home = new Home(fullName,gender,profession,experience,skills);
  home.save().then(()=>{
    console.log("form saved successfully");
  });

  res.render('home');
};

exports.postHiring=(req,res,next)=>{
  console.log(req.body);
  const {id} =req.body;
  const acc = new Hired(id);
  acc.save().then(()=>{
    console.log("hired saved successfully");
  });
  res.render('host-home');

};

exports.postJob=(req,res,next)=>{
  const {JobTitle,Company,Location,JobType,SalaryRange,JobDescription,DeadLine} = req.body;
  console.log("job posted");
  const job = new Job(JobTitle,Company,Location,JobType,SalaryRange,JobDescription,DeadLine);
  job.save().then(()=>{
    console.log("job saved successfully");
  });
  res.render('home');
};

exports.getHired = (req, res, next) => {
    Hired.fetchAll().then(hiredAccounts => {
        Home.fetchAll().then(registeredAc => {
            // Extract the IDs of hired accounts
            const hiredIds = hiredAccounts.map(account => account.id);
            
            // Filter registered accounts based on hired IDs
            const matchedAccounts = registeredAc.filter(account => hiredIds.includes(account.id));
            
            // Render the Hired view with matched accounts
            res.render('Hired', { matchedAccounts: matchedAccounts });
        });
    });
};

exports.getWorker=(req,res,next)=>{
  const registeredAc = Home.fetchAll().then(registeredAc=>{
    res.render('worker',{registeredAc:registeredAc});
  });
}

exports.getPostedJob=(req,res,next)=>{
  const PostedJob = Job.fetchAll().then(PostedJob=>{
    res.render('joblisting',{PostedJob:PostedJob});
  });
}

exports.postSignup = (req, res, next) => {
  const { fullname, email, phone, password , userType } = req.body;
  bcrypt.hash(password, 12).then(hashedPassword => {
    const acc = new User(fullname, email, phone, hashedPassword,userType);
    acc.save();
    res.render('Login');
  });
};

exports.postLogin = (req, res, next) => {
  User.fetchAll().then(accounts => {
    const matchingAccount = accounts.find(account => account.email === req.body.email);
    if (!matchingAccount) {
      return res.render('Login', { error: 'Invalid email or password' });
    }
    bcrypt.compare(req.body.password, matchingAccount.password).then(doMatch => {
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.userType = matchingAccount.userType;
        return req.session.save(() => {
          res.redirect('/home');
        });
      } else {
        res.render('Login', { error: 'Invalid email or password' });
      }
    });
  });
};

exports.getFeedbackForm = (req,res,next)=>{
  res.render('Feedback');
}

exports.postFeedback = (req,res,next)=>{
  const {name,email,feed} = req.body;
  const feedback = new Feedback(name,email,feed);
  feedback.save();

  res.render('Feedback');
}

exports.getDashboard =(req,res,next)=>{
  Hired.fetchAll().then(hiredAccounts => {
        Home.fetchAll().then(registeredAc => {
            // Extract the IDs of hired accounts
            const hiredIds = hiredAccounts.map(account => account.id);
            
            // Filter registered accounts based on hired IDs
            const matchedAccounts = registeredAc.filter(account => hiredIds.includes(account.id));
            
            // Render the Hired view with matched accounts
            res.render('Dashboard', { matchedAccounts: matchedAccounts });
        });
    });
}

exports.getPayroll =(req,res,next)=>{
  res.render('Payroll');
}

exports.getReport =(req,res,next)=>{
  res.render('Report');
}