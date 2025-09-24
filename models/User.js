// const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

module.exports = class User{
  constructor(fullname,email,phone,password,userType){
    this.fullname = fullname;
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.userType = userType;
  }
  
  save(){
    const db = getDB();
    const updateaccount = {
      fulname : this.fullname,
      email: this.email,
      phone:this.phone,
      password:this.password,
      userType :this.userType
    };
    
      return db.collection('account').insertOne(this);
    
  
  }

static fetchAll(callback){
  const db = getDB();
    return db.collection('account').find().toArray();
}

  }
