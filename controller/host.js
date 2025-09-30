// const { use } = require("react");
const express = require("express");
const Feedback = require("../models/feedback");
const Hired = require("../models/Hired");
const Worker = require("../models/Worker");
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
  const home = new Worker(fullName,gender,profession,experience,skills);
  home.save().then(()=>{
    console.log("form saved successfully");
  });

  res.render('home');
};

exports.postHiring=(req,res,next)=>{
  const {id} = req.body;
    console.log(id); // Debugging line
    const user = req.session.user;
    User.fetchAll().then(accounts =>{
      const matchedAccount = accounts.find(account => account.email === user.email);  
      if(!matchedAccount){
        return res.render('Login', { error: 'User not found' });
      }else{
        if(!matchedAccount.hiredWorkers.includes(id)){
          matchedAccount.hiredWorkers.push(id); // Add jobId to jobsApplied array
        }
        const updateUser = new User(
          matchedAccount.fullname,
          matchedAccount.email,
          matchedAccount.phone,
          matchedAccount.password,
          matchedAccount.userType
        );
        updateUser.hiredWorkers = matchedAccount.hiredWorkers;  
        updateUser._id = matchedAccount._id;
        updateUser.updateHirerAccount().then(() => {
          console.log("User account updated with hired worker."); 
          res.redirect('/dashboard'); // Redirect or respond as needed
        }).catch(err => {
          console.error("Error updating user account:", err);
          res.status(500).send("Internal Server Error");
        });

      }
    })
};

exports.postJob = (req, res, next) => {
  const { JobTitle, Company, Location, JobType, SalaryRange, JobDescription, DeadLine } = req.body;
  console.log("Job posted");

  const job = new Job(JobTitle, Company, Location, JobType, SalaryRange, JobDescription, DeadLine);
  const user = req.session.user;
  job.save()
    .then(savedJob => {
      console.log("Job saved successfully with ID:", savedJob._id);
      if (user && user.postedJobs) {
        user.postedJobs.push(savedJob._id.toString());
      }
      User.fetchAll().then(accounts => {
        const matchedAccount = accounts.find(account => account.email === user.email);
        if (matchedAccount) {
          const updateUser = new User(
            matchedAccount.fullname,
            matchedAccount.email,
            matchedAccount.phone,
            matchedAccount.password,
            matchedAccount.userType
          );
          updateUser.postedJobs = matchedAccount.postedJobs.concat([savedJob._id.toString()]);  
          updateUser.hiredWorkers = matchedAccount.hiredWorkers;
          updateUser._id = matchedAccount._id;
          updateUser.updateHirerAccount().then(() => {
            console.log("User account updated with posted job."); 
          }).catch(err => {
            console.error("Error updating user account:", err);
          }
          );
        }
      });
      res.render('host-home', { jobId: savedJob._id }); // Optional: pass it to the view
    })
    .catch(err => {
      console.error("Error saving job:", err);
      res.status(500).send("Internal Server Error");
    });
};

exports.getHired = (req, res, next) => {
    const user = req.session.user;

      const hiredWorkers = user.hiredWorkers || [];

      return Worker.fetchAll().then(registeredAc => {
        const workerDetails = registeredAc.filter(worker =>
          hiredWorkers.includes(worker._id.toString())
        );

        res.render('Hired', {
          matchedAccounts: workerDetails // Use filtered details here
        });
      });
   
};

exports.getWorker=(req,res,next)=>{
  const registeredAc = Worker.fetchAll().then(registeredAc=>{
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
  if(userType === 'worker'){
  bcrypt.hash(password, 12).then(hashedPassword => {
    const acc = new User(fullname, email, phone, hashedPassword,userType);
    acc.save();
    res.render('Login');
  });
}else{
  bcrypt.hash(password, 12).then(hashedPassword => {
    const acc = new User(fullname, email, phone, hashedPassword,userType);
    acc.saveHirer();
    res.render('Login');
  });
}
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
        if(matchingAccount.userType === 'worker'){
        req.session.user = {
              id: matchingAccount._id.toString(),
              name: matchingAccount.fullname,
              email: matchingAccount.email,
              userType: matchingAccount.userType,
              jobsApplied: matchingAccount.jobsApplied,
              bookmarkedJobs: matchingAccount.bookmarkedJobs
        };
      }else{
        req.session.user = {
          id: matchingAccount._id.toString(),
          name: matchingAccount.fullname,
          email: matchingAccount.email,
          userType: matchingAccount.userType,
          hiredWorkers: matchingAccount.hiredWorkers,
          postedJobs: matchingAccount.postedJobs
    };
      }
        // console.log("Session User:", req.session.user); // Debugging line
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

exports.getDashboard = (req, res, next) => {
  const user = req.session.user;

  Job.fetchAll()
    .then(allJobs => {
      const postedJobs = allJobs.filter(job =>
        (user.postedJobs ?? []).map(id => id.toString()).includes(job._id.toString())
      );

      const hiredWorkers = user.hiredWorkers || [];
      console.log("Hired Workers:", hiredWorkers); // Debugging line

      return Worker.fetchAll().then(registeredAc => {
        const workerDetails = registeredAc.filter(worker =>
          hiredWorkers.includes(worker._id.toString())
        );
        console.log("Worker Details:", workerDetails); // Debugging line

        res.render('dashboard', {
          user: user,
          postedJobs: postedJobs,
          hiredWorkers: workerDetails // Use filtered details here
        });
      });
    })
    .catch(err => {
      console.error("Error fetching dashboard data:", err);
      res.status(500).send("Internal Server Error");
    });
};

exports.getPayroll =(req,res,next)=>{
  res.render('Payroll');
}

exports.getReport =(req,res,next)=>{
  res.render('Report');
}

// controllers/userController.js

exports.getProfile = (req, res, next) => {
  // 1. Protect the route: redirect to login if not authenticated
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect('/login');
  }
  // 2. Fetch user data from session
  const user = req.session.user;
  Job.fetchAll().then(allJobs => {
    const appliedJobs = allJobs.filter(job => user.jobsApplied.includes(job._id.toString()));
    const bookmarkedJobs = allJobs.filter(job => user.bookmarkedJobs.includes(job._id.toString()));
    res.render('profile', { user: user, appliedJobs: appliedJobs, bookmarkedJobs: bookmarkedJobs });
  }).catch(err => {
    console.error("Error fetching jobs:", err);
    res.status(500).send("Internal Server Error");
  });

};

exports.postApplyJob = (req, res, next) => {
  const { jobId } = req.body;
  console.log("Job ID to apply:", jobId); // Debugging line
  User.fetchAll().then(accounts =>{
    const matchedAccount = accounts.find(account => account.email === req.session.user.email);
   
    if(!matchedAccount){
      // console.log("No matching account found.");
      return res.render('Login', { error: 'User not found' });
    }else{
      if(!matchedAccount.jobsApplied.includes(jobId)){
        matchedAccount.jobsApplied.push(jobId); // Add jobId to jobsApplied array
        if(matchedAccount.bookmarkedJobs.includes(jobId)){
          matchedAccount.bookmarkedJobs = matchedAccount.bookmarkedJobs.filter(id => id !== jobId);
        }
      }

      const updateUser = new User(
        matchedAccount.fullname,
        matchedAccount.email,
        matchedAccount.phone,
        matchedAccount.password,
        matchedAccount.userType
      );
      updateUser.jobsApplied = matchedAccount.jobsApplied;  
      updateUser.bookmarkedJobs = matchedAccount.bookmarkedJobs;
      updateUser._id = matchedAccount._id; // Ensure _id is set for update operation
      updateUser.updateaccount().then(() => {
        // console.log("User account updated with applied job."); 
        //display a popup or message indicating successful application

        res.redirect('/joblisting'); // Redirect or respond as needed
      }).catch(err => {
        console.error("Error updating user account:", err);
        res.status(500).send("Internal Server Error");
      });

    }
  })
};

exports.postSaveJob = (req, res, next) => {
  const { jobId } = req.body;

  // console.log("Job ID to bookmark:", jobId); // Debugging line
  User.fetchAll().then(accounts => {
    const matchingAccount = accounts.find(account => account.email === req.session.user.email);
    if (!matchingAccount) {
      return res.render('Login', { error: 'User not found' });
    }else{
    if(!matchingAccount.bookmarkedJobs.includes(jobId)){
      matchingAccount.bookmarkedJobs.push(jobId); // Add jobId to bookmarkedJobs array

    }
    // console.log("After Update - Bookmarked Jobs:", matchingAccount.bookmarkedJobs); // Debugging line
    const updatedUser = new User(
      matchingAccount.fullname,
      matchingAccount.email,
      matchingAccount.phone,
      matchingAccount.password,
      matchingAccount.userType
    );
    updatedUser.bookmarkedJobs = matchingAccount.bookmarkedJobs;  
    updatedUser.jobsApplied = matchingAccount.jobsApplied;
    updatedUser._id = matchingAccount._id; // Ensure _id is set for update operation
    updatedUser.updateaccount().then(() => {
      // console.log("User account updated with bookmarked job."); 
      res.redirect('/joblisting'); // Redirect or respond as needed
    }).catch(err => {
      console.error("Error updating user account:", err);
      res.status(500).send("Internal Server Error");
    });
  
    }
  })
};
