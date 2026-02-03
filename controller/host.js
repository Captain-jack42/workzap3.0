// const { use } = require("react");
const express = require("express");
const Feedback = require("../models/feedback");
const Hired = require("../models/Hired");
const Worker = require("../models/Worker");
const Job = require("../models/PostJob");
const User = require("../models/User");
const Application = require("../models/Application");
const bcrypt = require('bcryptjs');

exports.getHostHome = (req, res, next) => {
  res.render('host-home');
};



exports.getSignup = (req, res, next) => {
  res.render('signup');
};

exports.postForm = (req, res, next) => {
  // console.log(req.session.user.id);
  console.log(req.body);
  const { fullName, gender, profession, experience, skills, email } = req.body;
  const home = new Worker(fullName, gender, profession, experience, skills, email);
  home.save().then(() => {
    console.log("form saved successfully");
  });

  res.render('home', { showPopup: false });
};

exports.postHiring = (req, res, next) => {
  console.log(req.body);
  const { id } = req.body;
  console.log("Hiring worker ID:", id);

  const user = req.session.user;

  User.fetchAll().then(accounts => {
    const matchedAccount = accounts.find(account => account.email === user.email);

    if (!matchedAccount) {
      return res.render('Login', { error: 'User not found' });
    }

    // Ensure hiredWorkers is an array
    const hiredWorkers = Array.isArray(matchedAccount.hiredWorkers)
      ? [...matchedAccount.hiredWorkers]
      : [];

    // Prevent duplicate entries
    if (!hiredWorkers.includes(id)) {
      hiredWorkers.push(id);
    }

    // Create updated user instance
    const updateUser = new User(
      matchedAccount.fullname,
      matchedAccount.email,
      matchedAccount.phone,
      matchedAccount.password,
      matchedAccount.userType
    );

    // Preserve all relevant fields
    updateUser.chattedAccount = matchedAccount.chattedAccount || [];
    updateUser.conversations = matchedAccount.conversations || [];
    updateUser.hiredWorkers = hiredWorkers;
    updateUser.postedJobs = matchedAccount.postedJobs || [];
    updateUser._id = matchedAccount._id;

    updateUser.updateHirerAccount()
      .then(() => {
        console.log("User account updated with hired worker.");
        res.redirect('/dashboard');
      })
      .catch(err => {
        console.error("Error updating user account:", err);
        res.status(500).send("Internal Server Error");
      });
  }).catch(err => {
    console.error("Error fetching accounts:", err);
    res.status(500).send("Internal Server Error");
  });
};


exports.postJob = (req, res, next) => {
  const { JobTitle, Company, Location, JobType, JobDescription, SalaryRange, DeadLine } = req.body;
  console.log("Job posted");

  const job = new Job(JobTitle, Company, Location, JobType, JobDescription, SalaryRange, DeadLine);
  const user = req.session.user;

  job.save()
    .then(savedJob => {
      const jobIdStr = savedJob._id.toString();

      // Update session user object
      if (user && Array.isArray(user.postedJobs)) {
        user.postedJobs.push(jobIdStr);
      }

      // Update actual user in database
      User.fetchAll().then(accounts => {
        const matchedAccount = accounts.find(account => account.email === user.email);

        if (matchedAccount) {
          // ✅ Push job ID into matchedAccount before saving
          if (!Array.isArray(matchedAccount.postedJobs)) {
            matchedAccount.postedJobs = [];
          }
          matchedAccount.postedJobs.push(jobIdStr);

          const updateUser = new User(
            matchedAccount.fullname,
            matchedAccount.email,
            matchedAccount.phone,
            matchedAccount.password,
            matchedAccount.userType
          );

          // Preserve other fields
          updateUser.chattedAccount = matchedAccount.chattedAccount;
          updateUser.conversations = matchedAccount.conversations;
          updateUser.postedJobs = matchedAccount.postedJobs;
          updateUser.hiredWorkers = matchedAccount.hiredWorkers;
          updateUser._id = matchedAccount._id;

          updateUser.updateHirerAccount()
            .then(() => {
              console.log("User account updated with posted job.");
              res.render('host-home', { jobId: savedJob._id }); // Optional: pass jobId to view
            })
            .catch(err => {
              console.error("Error updating user account:", err);
              res.status(500).send("Failed to update user account.");
            });
        } else {
          console.error("User not found in database.");
          res.status(404).send("User not found.");
        }
      });
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

exports.getWorker = (req, res, next) => {
  const registeredAc = Worker.fetchAll().then(registeredAc => {
    res.render('worker', { registeredAc: registeredAc });
  });
}

exports.getPostedJob = (req, res, next) => {
  const PostedJob = Job.fetchAll().then(PostedJob => {
    res.render('joblisting', { PostedJob: PostedJob });
  });
}

exports.postSignup = (req, res, next) => {
  const { fullname, email, phone, password, userType } = req.body;
  const existingUserPromise = User.fetchAll().then(accounts => {
    return accounts.find(account => account.email === email);
  });

  existingUserPromise.then(existingUser => {
    if (existingUser) {
      return res.render('signup', { error: 'Email already in use' });
    } else {
      if (userType === 'worker') {
        bcrypt.hash(password, 12).then(hashedPassword => {
          const acc = new User(fullname, email, phone, hashedPassword, userType);
          acc.save()
            .then(() => {
              res.render('Login');
            })
            .catch(err => {
              console.error("Error creating user during signup:", err);
              res.status(500).send("Internal Server Error");
            });
        });
      } else {
        bcrypt.hash(password, 12).then(hashedPassword => {
          const acc = new User(fullname, email, phone, hashedPassword, userType);
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
        if (matchingAccount.userType === 'worker') {
          req.session.user = {
            id: matchingAccount._id.toString(),
            name: matchingAccount.fullname,
            email: matchingAccount.email,
            userType: matchingAccount.userType
          };
        } else {
          req.session.user = {
            id: matchingAccount._id.toString(),
            name: matchingAccount.fullname,
            email: matchingAccount.email,
            userType: matchingAccount.userType
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

exports.getFeedbackForm = (req, res, next) => {
  res.render('Feedback');
}

exports.postFeedback = (req, res, next) => {
  const { name, email, feed } = req.body;
  const feedback = new Feedback(name, email, feed);
  feedback.save();

  res.render('Feedback');
}

exports.getDashboard = (req, res, next) => {
  const sessionUser = req.session.user;

  if (!sessionUser || !sessionUser.email) {
    console.error("Session missing or malformed:", req.session);
    return res.status(401).send("Unauthorized: No user session found");
  }

  User.fetchAll()
    .then(accounts => {
      const matchedAccount = accounts.find(acc => acc.email === sessionUser.email);
      if (!matchedAccount) {
        console.error("User not found for email:", sessionUser.email);
        return res.status(404).send("User not found");
      }

      req.session.user = matchedAccount;

      Job.fetchAll()
        .then(allJobs => {
          const postedJobIds = Array.isArray(matchedAccount.postedJobs)
            ? matchedAccount.postedJobs.map(id => id.toString())
            : [];

          const postedJobs = allJobs.filter(job =>
            postedJobIds.includes(job._id?.toString())
          );

          Worker.fetchAll().then(allWorkers => {
            const hiredWorkerIds = Array.isArray(matchedAccount.hiredWorkers) ? matchedAccount.hiredWorkers.map(id => id.toString()) : [];

            const hiredWorkers = allWorkers.filter(worker =>
              hiredWorkerIds.includes(worker._id?.toString())
            );

            try {
              res.render('Dashboard', {
                user: matchedAccount,
                PostedJob: postedJobs,
                hiredWorkers: hiredWorkers
              });
            } catch (renderErr) {
              console.error("Render error:", renderErr);
              res.status(500).send("Failed to render dashboard");
            }
          })
            .catch(err => {
              console.error("Error fetching workers:", err);
              res.status(500).send("Failed to load workers");
            });
        })
        .catch(err => {
          console.error("Error fetching jobs:", err);
          res.status(500).send("Failed to load jobs");
        });
    })
    .catch(err => {
      console.error("Error fetching user:", err);
      res.status(500).send("Failed to load user");
    });
};


exports.getPayroll = (req, res, next) => {
  res.render('Payroll');
}

exports.getReport = (req, res, next) => {
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
  res.render('applying-form', {
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
    } else {
      if (!matchingAccount.bookmarkedJobs.includes(jobId)) {
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
      updatedUser.chattedAccount = matchingAccount.chattedAccount;
      updatedUser.conversations = matchingAccount.conversations;
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
    updatedUser.chattedAccount = matchedAccount.chattedAccount;
    updatedUser.conversations = matchedAccount.conversations;
    updatedUser.jobsApplied = Array.isArray(matchedAccount.jobsApplied) ? matchedAccount.jobsApplied.slice() : [];
    updatedUser.bookmarkedJobs = Array.isArray(matchedAccount.bookmarkedJobs) ? matchedAccount.bookmarkedJobs.slice() : [];
    updatedUser._id = matchedAccount._id;

    const { JobId, name, phone, email, resume, cover } = req.body;

    // Check if job already applied
    Application.fetchAll().then(applications => {
      const alreadyApplied = applications.some(app =>
        app.email === req.session.user.email && app.JobId === JobId
      );

      if (alreadyApplied) {
        return res.render('home', { showPopup: false, message: 'You have already applied for this job.' });
      }

      // Push job ID to user's applied list if not already present
      if (JobId && !updatedUser.jobsApplied.includes(JobId)) {
        updatedUser.jobsApplied.push(JobId);
      }

      const updater = matchedAccount.userType === 'worker'
        ? updatedUser.updateaccount()
        : updatedUser.updateHirerAccount();

      return updater.then(() => {
        const application = new Application(JobId, name, phone, email, resume, cover);
        return application.save();
      }).then(() => {
        res.render('home', { showPopup: true });
      }).catch(err => {
        console.error('Error submitting application:', err);
        res.status(500).send('Internal Server Error');
      });
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
  const { email } = req.body;

  Worker.fetchAll()
    .then(workers => {
      const workerToHire = workers.find(worker => worker.email === email);
      if (!workerToHire) {
        return res.status(404).send("Worker not found");
      }

      User.fetchAll().then(accounts => {
        const matchedAccount = accounts.find(account => account.email === user.email);
        if (!matchedAccount) {
          return res.status(404).send("User not found");
        }

        // Ensure hiredWorkers is an array
        const hiredWorkers = Array.isArray(matchedAccount.hiredWorkers)
          ? [...matchedAccount.hiredWorkers]
          : [];

        // Prevent duplicate entries
        const workerIdStr = workerToHire._id.toString();
        if (!hiredWorkers.includes(workerIdStr)) {
          hiredWorkers.push(workerIdStr);
        }

        // Create updated user instance
        const updateUser = new User(
          matchedAccount.fullname,
          matchedAccount.email,
          matchedAccount.phone,
          matchedAccount.password,
          matchedAccount.userType
        );

        // Preserve all relevant fields
        updateUser.chattedAccount = matchedAccount.chattedAccount || [];
        updateUser.conversations = matchedAccount.conversations || [];
        updateUser.hiredWorkers = hiredWorkers;
        updateUser.postedJobs = matchedAccount.postedJobs || [];
        updateUser._id = matchedAccount._id;

        // Perform update
        updateUser.updateHirerAccount()
          .then(() => {
            console.log("User account updated with hired worker.");
            res.redirect('/dashboard');
          })
          .catch(err => {
            console.error("Error updating user account:", err);
            res.status(500).send("Internal Server Error");
          });
      });
    })
    .catch(err => {
      console.error("Error fetching workers:", err);
      res.status(500).send("Internal Server Error");
    });
};


exports.postStartChat = (req, res, next) => {
  const { email } = req.body;
  const userEmail = req.session.email;

  User.fetchAll().then(accounts => {
    const matchedAccount = accounts.find(account => account.email === email);
    const updateChattedAccount = matchedAccount.chattedAccount;
    if (!updateChattedAccount.includes(userEmail)) {
      updateChattedAccount.push(userEmail);
      matchedAccount.conversations.push([]);
    }
    const updatedUser = new User(
      matchedAccount.fullname,
      matchedAccount.email,
      matchedAccount.phone,
      matchedAccount.password,
      matchedAccount.userType
    );
    updatedUser.chattedAccount = updateChattedAccount;
    updatedUser.conversations = matchedAccount.conversations;
    updatedUser._id = matchedAccount._id;
    updatedUser.updateaccount().then(() => {
      console.log("User account updated with sent message.");
    });
  })

  User.fetchAll().then(accounts => {
    const matchedAccount = accounts.find(account => account.email === userEmail);
    const updateChattedAccount = matchedAccount.chattedAccount;
    // const size = 0;
    if (!updateChattedAccount.includes(email)) {
      updateChattedAccount.push(email);
      matchedAccount.conversations.push([]);

    }
    const size = matchedAccount.conversations.length - 1;
    const updatedUser = new User(
      matchedAccount.fullname,
      matchedAccount.email,
      matchedAccount.phone,
      matchedAccount.password,
      matchedAccount.userType
    );
    updatedUser.chattedAccount = updateChattedAccount;
    updatedUser.conversations = matchedAccount.conversations;
    updatedUser._id = matchedAccount._id;
    updatedUser.updateaccount().then(() => {
      console.log("User account updated with sent message.");

      res.render('Chat', {
        chattedAccount: updateChattedAccount,
        chatObject: matchedAccount.conversations[size],
        selectedAccount: email
      });
    });
  })

}

exports.postSendMsg = (req, res, next) => {
  console.log(req.body);
  const { recipientEmail, message } = req.body;
  const userEmail = req.session.email;

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, error: 'Message cannot be empty' });
  }

  // Helper promise to update recipient
  const updateRecipient = User.fetchAll().then(accounts => {
    const matchedAccount = accounts.find(account => account.email === recipientEmail);
    if (!matchedAccount) throw new Error('Recipient not found');

    const index = matchedAccount.chattedAccount.indexOf(userEmail);
    const messageObj = { email: userEmail, message: message, timestamp: new Date() };
    const reciverConversations = matchedAccount.conversations || [];

    if (index === -1) {
      // If clean state where they haven't chatted, we might need more logic here 
      // but assuming startChat was called, this should exist.
      // For robustness, could push if check fails, but stick to existing logic for now.
      // Fallback logic to be safe:
      matchedAccount.chattedAccount.push(userEmail);
      reciverConversations.push([messageObj]);
    } else {
      reciverConversations[index].push(messageObj);
    }

    // Re-construct User to save
    const updatedUser = new User(
      matchedAccount.fullname,
      matchedAccount.email,
      matchedAccount.phone,
      matchedAccount.password,
      matchedAccount.userType
    );
    updatedUser.chattedAccount = matchedAccount.chattedAccount;
    updatedUser.conversations = reciverConversations;
    updatedUser.postedJobs = matchedAccount.postedJobs;
    updatedUser.hiredWorkers = matchedAccount.hiredWorkers;
    updatedUser.bookmarkedJobs = matchedAccount.bookmarkedJobs;
    updatedUser.jobsApplied = matchedAccount.jobsApplied;

    updatedUser._id = matchedAccount._id;
    return updatedUser.updateaccount(); // Using generic updateaccount assumes it handles both types? careful. 
    // Host.js usually implies Hirer? But userType checks are safer. 
    // The original code used updateaccount(), so we stick to it.
  });

  // Helper promise to update sender
  const updateSender = User.fetchAll().then(accounts => {
    const matchedAccount = accounts.find(account => account.email === userEmail);
    if (!matchedAccount) throw new Error('Sender not found');

    const index = matchedAccount.chattedAccount.indexOf(recipientEmail);
    const messageObj = { email: userEmail, message: message, timestamp: new Date() };
    const conversations = matchedAccount.conversations || [];

    if (index === -1) {
      matchedAccount.chattedAccount.push(recipientEmail);
      conversations.push([messageObj]);
    } else {
      conversations[index].push(messageObj);
    }

    const updatedUser = new User(
      matchedAccount.fullname,
      matchedAccount.email,
      matchedAccount.phone,
      matchedAccount.password,
      matchedAccount.userType
    );
    updatedUser.chattedAccount = matchedAccount.chattedAccount;
    updatedUser.conversations = conversations;
    updatedUser.postedJobs = matchedAccount.postedJobs;
    updatedUser.hiredWorkers = matchedAccount.hiredWorkers;
    updatedUser.bookmarkedJobs = matchedAccount.bookmarkedJobs;
    updatedUser.jobsApplied = matchedAccount.jobsApplied;
    updatedUser._id = matchedAccount._id;

    return updatedUser.updateaccount();
  });

  Promise.all([updateRecipient, updateSender])
    .then(() => {
      console.log("Message saved to DB for both users.");
      res.status(200).json({ success: true });
    })
    .catch(err => {
      console.error("Error saving message:", err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    });
}