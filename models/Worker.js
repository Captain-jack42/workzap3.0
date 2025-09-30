const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

let applicantId = 0;
module.exports = class Worker{
  constructor(fullName,gender,profession,experience,skills,_id){
    
    this.fullName = fullName;
    this.gender = gender;
    this.profession = profession;
    this.experience = experience;
    this.skills = skills;
  }
  
  save(){
    const db = getDB();
    const updatework = {
    fullName : this.fullName,
    gender : this.gender,
    profession : this.profession,
    experience : this.experience,
    skills : this.skills
    };
    return db.collection('Worker_data').insertOne(updatework)
    }
  
  

static fetchAll(){
  const db = getDB();
  return db.collection('Worker_data').find().toArray();
  }
  


}
