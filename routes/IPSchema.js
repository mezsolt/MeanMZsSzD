var mongoose = require('mongoose');

//var db = mongoose.createConnection('mongodb://mongo:27017/ipHash', {autoIndex : true});
//var db = mongoose.createConnection('mongodb+srv://Mezsolt:mezsolttestpw@meanszdcluster-gecbq.mongodb.net/ipHash',{autoIndex : true});
var db = mongoose.createConnection('mongodb://localhost:27017/ipHash', {autoIndex : true});
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
    console.log('MongoDB is Open IPSchema');
});


var Schema = mongoose.Schema;

var IPSchema = new Schema({
    _id : Schema.ObjectId,
    ip : String,
    date : Date
});

module.exports = db.model('ipHashes',IPSchema,'IPTESTTESTTEST');