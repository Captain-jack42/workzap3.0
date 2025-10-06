// const { use } = require("react");
const express = require("express");
const Feedback = require("../models/feedback");
const Hired = require("../models/Hired");
const Worker = require("../models/Worker");
const Job = require("../models/PostJob");
const User = require("../models/User");
const Application = require("../models/Application");
const bcrypt = require('bcryptjs');
// const e = require("express");

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

  res.render('home', { showPopup: false });
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
          matchedAccount.userType,
          matchedAccount.chattedAccount,
          matchedAccount.conversations
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
  const { JobTitle, Company, Location, JobType,JobDescription, SalaryRange, DeadLine } = req.body;
  console.log("Job posted");

  const job = new Job(JobTitle, Company, Location, JobType,JobDescription, SalaryRange, DeadLine);
  const user = req.session.user;
  job.save()
    .then(savedJob => {
      // console.log("Job saved successfully with ID:", savedJob._id);
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
            matchedAccount.userType,
            matchedAccount.chattedAccount,
            matchedAccount.conversations
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
  const existingUserPromise = User.fetchAll().then(accounts => {
    return accounts.find(account => account.email === email);
  });

  existingUserPromise.then(existingUser => {
    if (existingUser) {
      return res.render('signup', { error: 'Email already in use' });
    }else{
  if(userType === 'worker'){
  bcrypt.hash(password, 12).then(hashedPassword => {
    const acc = new User(fullname, email, phone, hashedPassword,userType);
    acc.save()
      .then(() => {
        res.render('Login');
      })
      .catch(err => {
        console.error("Error creating user during signup:", err);
        res.status(500).send("Internal Server Error");
      });
  });
}else{
  bcrypt.hash(password, 12).then(hashedPassword => {
    const acc = new User(fullname, email, phone, hashedPassword,userType);
    acc.saveHirer()
      .then(() => {
        res.render('Login');
      })
      .catch(err => {
        console.error("Error creating hirer during signup:", err);
        res.status(500).send("Internal Server Error");
      });
  });
}
    }
  } 
  ).catch(err => {
    console.error("Error during signup:", err);
    res.status(500).send("Internal Server Error");
  } 
  );
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
        req.session.username = matchingAccount.fullname;
        req.session.email = matchingAccount.email;
        if(matchingAccount.userType === 'worker'){
        req.session.user = {
              id: matchingAccount._id.toString(),
              name: matchingAccount.fullname,
              email: matchingAccount.email,
              userType: matchingAccount.userType,
              chattedAccount: matchingAccount.chattedAccount,
              conversations: matchingAccount.conversations,
              jobsApplied: matchingAccount.jobsApplied,
              bookmarkedJobs: matchingAccount.bookmarkedJobs
        };
      }else{
        req.session.user = {
          id: matchingAccount._id.toString(),
          name: matchingAccount.fullname,
          email: matchingAccount.email,
          userType: matchingAccount.userType,
          chattedAccount: matchingAccount.chattedAccount,
          conversations: matchingAccount.conversations,
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
      // console.log("Hired Workers:", hiredWorkers); // Debugging line

      return Worker.fetchAll().then(registeredAc => {
        const workerDetails = registeredAc.filter(worker =>
          hiredWorkers.includes(worker._id.toString())
        );
        // console.log("Worker Details:", workerDetails); // Debugging line

        res.render('dashboard', {
          user: user,
          PostedJob: postedJobs,
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
  // console.log("Job ID to apply:", jobId); // Debugging line
  res.render('applying-form',{
    jobId: jobId
  });
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
      matchingAccount.userType,
      matchingAccount.chattedAccount,
      matchingAccount.conversations
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

exports.postSubmitApplication = (req, res, next) => {
  User.fetchAll().then(accounts => {
    const matchedAccount = accounts.find(account => account.email === req.session.user.email);
    if (!matchedAccount) {
      return res.render('Login', { error: 'User not found' });
    }

    const updatedUser = new User(
      matchedAccount.fullname,
      matchedAccount.email,
      matchedAccount.phone,
      matchedAccount.password,
      matchedAccount.userType
    );
    // ensure arrays
    updatedUser.jobsApplied = Array.isArray(matchedAccount.jobsApplied) ? matchedAccount.jobsApplied.slice() : [];
    updatedUser.bookmarkedJobs = Array.isArray(matchedAccount.bookmarkedJobs) ? matchedAccount.bookmarkedJobs.slice() : [];
    updatedUser._id = matchedAccount._id;
    // push job id if not present
    if (!updatedUser.jobsApplied.includes(req.body.JobId)) {
      updatedUser.jobsApplied.push(req.body.JobId);
    }

    const updater = matchedAccount.userType === 'worker' ? updatedUser.updateaccount() : updatedUser.updateHirerAccount();
    updater.then(() => {
      const { JobId, name, phone, email, resume, cover } = req.body;
      const application = new Application(JobId, name, phone, email, resume, cover);
      return application.save();
    }).then(() => {
      res.render('home', { showPopup: true });
    }).catch(err => {
      console.error('Error submitting application:', err);
      res.status(500).send('Internal Server Error');
    });
  });
};


exports.postApplicants = (req, res, next) => {
  const { jobId } = req.body;
  Application.fetchAll().then(applications => {
    const jobApplications = applications.filter(app => app.JobId === jobId);
    res.render('Applicants', { applications: jobApplications });
  }).catch(err => {
    res.status(500).send("Internal Server Error");
  }); 
}

exports.postHireApplicant = (req, res, next) => {
  const user = req.session.user;
  const hiredWorkers = user.hiredWorkers || [];

  const { email } = req.body;
  Worker.fetchAll().then(workers => {
    const workerToHire = workers.find(worker => worker.email === email);  
    if (workerToHire) {
      if (!hiredWorkers.includes(workerToHire._id.toString())) {
        hiredWorkers.push(workerToHire._id.toString()); // Add worker ID to hiredWorkers array
      }
      User.fetchAll().then(accounts => {
        const matchedAccount = accounts.find(account => account.email === user.email);
        if (matchedAccount) {
          const updateUser = new User(
            matchedAccount.fullname,
            matchedAccount.email,
            matchedAccount.phone,
            matchedAccount.password,
            matchedAccount.userType,
            matchedAccount.chattedAccount,
            matchedAccount.conversations
          );
          updateUser.hiredWorkers = hiredWorkers;  
          updateUser.postedJobs = matchedAccount.postedJobs;
          updateUser._id = matchedAccount._id;
          updateUser.updateHirerAccount().then(() => {
            console.log("User account updated with hired worker."); 
            res.redirect('/dashboard'); // Redirect or respond as needed
          }).catch(err => {
            console.error("Error updating user account:", err);
            res.status(500).send("Internal Server Error");
          }
          );
        }
      });
    } else {
      res.status(404).send("Worker not found");
    }
  }).catch(err => {
    console.error("Error fetching workers:", err);
    res.status(500).send("Internal Server Error");
  });
}

exports.postStartChat = (req, res, next) => {
  const { email } = req.body;
  const sessionUser = req.session.user;
  if (!sessionUser) { return res.redirect('/Login'); }

  User.fetchAll()
    .then(accounts => {
      const meAcc = accounts.find(a => a.email === sessionUser.email);
      const targetAcc = accounts.find(a => a.email === email);
      if (!meAcc || !targetAcc) {
        return res.status(404).send('User not found');
      }

      const meUser = new User(meAcc.fullname, meAcc.email, meAcc.phone, meAcc.password, meAcc.userType);
      meUser._id = meAcc._id;
      meUser.chattedAccount = Array.isArray(meAcc.chattedAccount) ? meAcc.chattedAccount.map(String) : [];
      meUser.conversations = Array.isArray(meAcc.conversations) ? meAcc.conversations : [];
      if (!meUser.chattedAccount.includes(targetAcc.email)) {
        meUser.chattedAccount.push(targetAcc.email);
      }
      while (meUser.conversations.length < meUser.chattedAccount.length) {
        meUser.conversations.push([]);
      }
      meUser.jobsApplied = Array.isArray(meAcc.jobsApplied) ? meAcc.jobsApplied : [];
      meUser.bookmarkedJobs = Array.isArray(meAcc.bookmarkedJobs) ? meAcc.bookmarkedJobs : [];

      const meUpdate = meAcc.userType === 'worker' ? meUser.updateaccount() : meUser.updateHirerAccount();
      return meUpdate.then(() => {
        const tgtUser = new User(targetAcc.fullname, targetAcc.email, targetAcc.phone, targetAcc.password, targetAcc.userType);
        tgtUser._id = targetAcc._id;
        tgtUser.chattedAccount = Array.isArray(targetAcc.chattedAccount) ? targetAcc.chattedAccount.map(String) : [];
        tgtUser.conversations = Array.isArray(targetAcc.conversations) ? targetAcc.conversations : [];
        if (!tgtUser.chattedAccount.includes(meAcc.email)) {
          tgtUser.chattedAccount.push(meAcc.email);
        }
        while (tgtUser.conversations.length < tgtUser.chattedAccount.length) {
          tgtUser.conversations.push([]);
        }
        tgtUser.jobsApplied = Array.isArray(targetAcc.jobsApplied) ? targetAcc.jobsApplied : [];
        tgtUser.bookmarkedJobs = Array.isArray(targetAcc.bookmarkedJobs) ? targetAcc.bookmarkedJobs : [];

        const tgtUpdate = targetAcc.userType === 'worker' ? tgtUser.updateaccount() : tgtUser.updateHirerAccount();
        return tgtUpdate.then(() => res.redirect('/Chat'));
      });
    })
    .catch(err => {
      console.error('postStartChat error:', err);
      res.status(500).send('Internal Server Error');
    });
}

