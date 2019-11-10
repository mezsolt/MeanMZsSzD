var mongoose = require('mongoose');

//var db = mongoose.createConnection('mongodb://mongo:27017/salaryData', {autoIndex : true}); docker
//var db = mongodb+srv://Mezsolt:<pw>@meanszdcluster-gecbq.mongodb.net/test?retryWrites=true&w=majority
//var db = mongoose.createConnection('mongodb+srv://Mezsolt:mezsolttestpw@meanszdcluster-gecbq.mongodb.net/salaryData',{autoIndex : true});
var db = mongoose.createConnection('mongodb://localhost:27017/salaryData', {autoIndex : true});
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
    console.log('MongoDB is Open DataSchema');
});


var Schema = mongoose.Schema;

var DataSchema = new Schema({
    _id : Schema.ObjectId,
    sex : String,
    age: String,
    country: String,
    city: String,
    educationalAttainment: String,
    experience: String,
    occupation: String,
    role: String,
    code: String,
    majorGroup: String,
    salary: Number,
    date: Date,
    emailId: String
});

module.exports = db.model('salaryDatas',DataSchema);