const User = require("../models/User");



exports.getHome=(req,res,next)=>{
  res.render('home', { showPopup: false });
};

exports.getLogin=(req,res,next)=>{
    res.render('Login');
    
  };

 exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/Login');
  });
};

  exports.getForm=(req,res,next)=>{
    res.render('form');
  };

  exports.getJoblisting=(req,res,next)=>{
    res.render('joblisting');
  };

  exports.getPostjob=(req,res,next)=>{
    res.render('postjob');
  };

  exports.gethelp = (req,res,next) =>{
    res.render('Help-support');
  }
  exports.getAbout =(req,res,next) =>{
    res.render('About-us');
  }
  exports.getContact =(req,res,next)=>{
    res.render('Contact');
  }

  exports.getChat = (req, res, next) => {
    // const { email } = sessionUser;
    User.fetchAll()
      .then(accounts => {
        const matchedAccount = accounts.find(account => account.email === req.session.email);
        const list = Array.isArray(matchedAccount && matchedAccount.chattedAccount) ? matchedAccount.chattedAccount : [];
        console.log(list);
        res.render('Chat', { chattedAccount: list , chatObject : matchedAccount.conversations});
      })
      .catch(err => {
        console.error('getChat error:', err);
        res.render('Chat', { chattedAccount: [] , chatObject : [recipientEmail = "" , message = ""]});
      });
  }

  
  // exports.getSettings =(req,res,next)=>{
  //   res.render('Settings');
  // }
  