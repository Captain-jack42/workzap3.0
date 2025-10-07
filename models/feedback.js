const { getDB } = require('../utils/databaseutil');

module.exports = class Feedback{
  constructor(name,email,feed){
    this.name = name;
    this.email = email;
    this.feed = feed;
  }
  
  save(){
    const db = getDB();
    const addfeedback = {
      name : this.name,
      email: this.email,
      feed : this.feed,
    };
      return db.collection('feedback').insertOne(this);
    
  }

  }