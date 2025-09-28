const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

module.exports = class Home{
  constructor(fullName,gender,profession,experience,skills,_id){
    
    this.fullName = fullName;
    this.gender = gender;
    this.profession = profession;
    this.experience = experience;
    this.skills = skills;
    if(_id){
      this._id = _id;
    }
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
      if(this._id){
        return db.collection('workzap_data').updateOne({_id:new ObjectId(String(this._id))},{$set:updatework});
      }else{
        return db.collection('workzap_data').insertOne(this);
      }
    }
  
  

static fetchAll(){
  const db = getDB();
  return db.collection('workzap_data').find().toArray();
  }
  


}
