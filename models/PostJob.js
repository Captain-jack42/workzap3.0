const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

module.exports = class Job{
  constructor(JobTitle,JobDescription,Company,Location,JobType,SalaryRange,DeadLine,_id){
    this.JobTitle = JobTitle;
    this.JobDescription = JobDescription;
    this.Company = Company;
    this.Location = Location;
    this.JobType = JobType;
    this.SalaryRange = SalaryRange;
    this.DeadLine = DeadLine;
    if(_id){
      this._id = _id;
    }
  }

  save(){
    const db = getDB();
    const updatejob = {
    JobTitle : this.JobTitle,
    JobDescription : this.JobDescription,
    Company : this.Company,
    Location : this.Location,
    JobType : this.JobType,
    SalaryRange : this.SalaryRange,
    DeadLine : this.DeadLine
    };
    if(this._id){
      return db.collection('postedjob').updateOne({_id:new ObjectId(String(this._id))},{$set:updatejob});
    }else{
      return db.collection('postedjob').insertOne(this);
    }
    
  }

  static fetchAll(callback){
    const db = getDB();
    return db.collection('postedjob').find().toArray();
     }
}