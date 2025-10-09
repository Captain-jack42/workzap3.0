const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

module.exports = class User{
  constructor(fullname,email,phone,password,userType){
    this.fullname = fullname;
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.userType = userType;
    this.chattedAccount = [];
    this.conversations = [];
    if(userType === 'worker'){
      this.jobsApplied = [];
      this.bookmarkedJobs = [];
    }else{
      this.hiredWorkers = [];
      this.postedJobs = []; 
    }
  }
  
  save(){
    const db = getDB();
    const updateaccount = {
      fullname : this.fullname,
      email: this.email,
      phone:this.phone,
      password:this.password,
      userType :this.userType,
      chattedAccount : this.chattedAccount,
      conversations : this.conversations,
      jobsApplied : this.jobsApplied,
      bookmarkedJobs : this.bookmarkedJobs
    };
    
      return db.collection('account').insertOne(this);
  }

  saveHirer(){
    const db = getDB();
    const updateaccount = {
      fullname : this.fullname, 
      email: this.email,
      phone:this.phone,
      password:this.password, 
      userType :this.userType,
      chattedAccount : this.chattedAccount,
      conversations : this.conversations,
      hiredWorkers : this.hiredWorkers,
      postedJobs : this.postedJobs
    };
      return db.collection('account').insertOne(this);
  }

  updateaccount(){
    const db = getDB();
    const updateaccount = {
      fullname : this.fullname,
      email: this.email,
      phone:this.phone,
      password:this.password,
      userType :this.userType,
      chattedAccount : this.chattedAccount,
      conversations : this.conversations||[],
      jobsApplied : this.jobsApplied||[],
      bookmarkedJobs : this.bookmarkedJobs
    };
      return db.collection('account').updateOne({_id:new ObjectId(String(this._id))},{$set:updateaccount});
  }

  updateHirerAccount(){
    const db = getDB();
    const updateaccount = {
      fullname : this.fullname,
      email: this.email,
      phone:this.phone,
      password:this.password,
      userType :this.userType,
      chattedAccount : this.chattedAccount||[],
      conversations : this.conversations||[],
      hiredWorkers : this.hiredWorkers,
      postedJobs : this.postedJobs
    };
      return db.collection('account').updateOne({_id:new ObjectId(String(this._id))},{$set:updateaccount});
  }


static fetchAll(callback){
  const db = getDB();
    return db.collection('account').find().toArray();
}

  }
