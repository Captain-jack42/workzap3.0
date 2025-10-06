const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

module.exports = class Job{
  constructor(JobTitle,Company,Location,JobType,JobDescription,SalaryRange,DeadLine,_id){
    this.JobTitle = JobTitle;
    this.Company = Company;
    this.Location = Location;
    this.JobType = JobType;
    this.JobDescription = JobDescription;
    this.SalaryRange = SalaryRange;
    this.DeadLine = DeadLine;
    if(_id){
      this._id = _id;
    }
  }

  save() {
  const db = getDB();
  const updatejob = {
    JobTitle: this.JobTitle,
    Company: this.Company,
    Location: this.Location,
    JobType: this.JobType,
    JobDescription: this.JobDescription,
    SalaryRange: this.SalaryRange,
    DeadLine: this.DeadLine
  };

  if (this._id) {
    return db.collection('postedjob')
      .updateOne({ _id: new ObjectId(String(this._id)) }, { $set: updatejob })
      .then(() => this); // Return the updated job object
  } else {
    return db.collection('postedjob')
      .insertOne(this)
      .then(result => {
        this._id = result.insertedId; // Attach the generated ID to the object
        return this; // Return the full job object with _id
      });
  }
}

  static fetchAll(callback){
    const db = getDB();
    return db.collection('postedjob').find().toArray();
     }
}