// const { ObjectId } = require('mongodb');
const { getDB } = require('../utils/databaseutil');

module.exports = class Hired{
  constructor(_id){
    if(_id){
      this._id = _id;
    }
  }
  
  save(){
    const db = getDB();
    return db.collection('hired').findOne({_id: this._id}).then(existingId=>{
      if((!existingId)){
        return db.collection('hired').insertOne(this);
      }else{
        console.log("already exist");
      }
      return  Promise.resolve();
    })
      
  }

static fetchAll(callback){
  const db = getDB();
    return db.collection('hired').find().toArray();
     }

  }