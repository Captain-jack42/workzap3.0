const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');


module.exports = class Application{
  constructor(JobId ,fullName, phone, email, resume , cover){
    this.JobId = JobId; // Assuming JobId is a reference to the job being applied for
    this.fullName = fullName;
    this.phone = phone;
    this.email = email;
    this.resume = resume;
    this.cover = cover; // Assuming cover is a field for cover letter or additional information
  }

  save(){
    const db = getDB();
    const addApplication = {
      // workerId: new ObjectId(String(this.workerId)), 
      JobId: this.JobId, // Convert JobId to ObjectId if necessary
      fullName : this.fullName,
      phone: this.phone,
      email : this.email,
      resume: this.resume,
      cover: this.cover // Include cover letter or additional information
    };
      return db.collection('Applications').insertOne(this).then(result => {
        this._id = result.insertedId;
        return this; // Return the full application object with _id
      });

  }

  static fetchAll(callback){
    const db = getDB();
      return db.collection('Applications').find().toArray();
       }
} 