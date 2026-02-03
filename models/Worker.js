const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

module.exports = class Worker{
  constructor(fullName,gender,profession,experience,skills,email){
    
    this.fullName = fullName;
    this.gender = gender;
    this.profession = profession;
    this.experience = experience;
    this.skills = skills;
    this.email = email;
  }
  
  save(){
    const db = getDB();
    const updatework = {
    fullName : this.fullName,
    gender : this.gender,
    profession : this.profession,
    experience : this.experience,
    skills : this.skills,
    email : this.email
    };
    return db.collection('Worker_data').insertOne(updatework)
    }
  
  

static fetchAll(){
  const db = getDB();
  return db.collection('Worker_data').find().toArray();
  }
  


}
