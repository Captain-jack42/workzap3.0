

exports.getHome=(req,res,next)=>{
  res.render('home');
};

exports.getLogin=(req,res,next)=>{
    res.render('Login');
    
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