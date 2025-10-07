exports.Error404 = (req,res,nxt)=>{
  res.status(404).render('404page');  
};