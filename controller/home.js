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
    if(!req.session.isLoggedIn){
      res.render('Login');
    }
  User.fetchAll()
    .then(accounts => {
      const matchedAccount = accounts.find(account => account.email === req.session.email);

      if (!matchedAccount) {
        console.error('No matching account found for session email:', req.session.email);
        return res.render('Chat', {
          chattedAccount: [],
          chatObject: { recipientEmail: "", message: "" },
          selectedAccount: ""
        });
      }

      const list = Array.isArray(matchedAccount.chattedAccount) ? matchedAccount.chattedAccount : [];
      const firstConversation = Array.isArray(matchedAccount.conversations) && matchedAccount.conversations.length > 0
        ? matchedAccount.conversations[0]
        : { recipientEmail: "", message: "" };
      const firstSelected = list.length > 0 ? list[0] : "";

      res.render('Chat', {
        chattedAccount: list,
        chatObject: firstConversation,
        selectedAccount: firstSelected
      });
    })
    .catch(err => {
      console.error('getChat error:', err);
      res.render('Chat', {
        chattedAccount: [],
        chatObject: { recipientEmail: "", message: "" },
        selectedAccount: ""
      });
    });
};

exports.postChat = (req, res, next) => {
  const { index, email } = req.body;

  User.fetchAll()
    .then(accounts => {
      const matchedAccount = accounts.find(account => account.email === req.session.email);

      if (!matchedAccount) {
        console.error('No matching account found for session email:', req.session.email);
        return res.render('Chat', {
          chattedAccount: [],
          chatObject: { recipientEmail: "", message: "" },
          selectedAccount: ""
        });
      }

      const list = Array.isArray(matchedAccount.chattedAccount) ? matchedAccount.chattedAccount : [];
      const conversationList = Array.isArray(matchedAccount.conversations) ? matchedAccount.conversations : [];
      const chatObject = conversationList[index] || { recipientEmail: "", message: "" };

      res.render('Chat', {
        chattedAccount: list,
        chatObject,
        selectedAccount: email
      });
    })
    .catch(err => {
      console.error('postChat error:', err);
      res.render('Chat', {
        chattedAccount: [],
        chatObject: { recipientEmail: "", message: "" },
        selectedAccount: ""
      });
    });

  console.log('Incoming POST /chat:', req.body);
};


  

