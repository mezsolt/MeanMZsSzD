var express = require('express');
var router = express.Router();
var EmailHashSchema = require('./EmailHashSchema');
var DataSchema = require('./DataSchema');
var IPSchema = require('./IPSchema');
var mongoose = require('mongoose');

router.get('/form',function(req,res) {

    res.sendFile('/index.html',{root: './public'});
});

function intervalFunc() {

    DataSchema.find({}).exec(function (err, doc) {
        var data = doc;
        for( var i = 0; i < data.length; i++){
            //if(((Date.now - data[i].date) / 1000) > (60*60*24*30*365)) {
            //console.log((Date.now() - data[i].date) / 1000);
                if(((Date.now() - data[i].date) / 1000) > 30) {
                    console.log(data[i].sex);
                DataSchema.deleteOne({ _id: data[i]._id }, function (err) {
                    if (err) return handleError(err);
                    // deleted at most one tank document
                });
            }
        }
    });

    console.log('Database cleared from old data.');
}

//setInterval(intervalFunc, 5000);

router.post('/ip', function(req,res){
    console.log('ipData: ' + req.body.ip + ' ' + Date.now());
    IPSchema.create({
        _id : new mongoose.Types.ObjectId(),
        ip : req.body.ip,
        date: Date.now()
    }, function (err,doc) {
        if(err){
            return console.log(err);
        }
        console.log(err);
        console.log(doc);
        res.status(415).send(err +' '+doc);
    });
    console.log('New IP data created.');
});

router.get('/getdata', function (req, res) {
    DataSchema.find({}).exec(function(err, doc) {
        res.status(200).send(doc);
    });

    console.log('DataSchema db given.');
});

router.get('/getemailhash', function (req, res) {
    EmailHashSchema.find({}).exec(function(err, doc) {
        res.status(200).send(doc);
    });

    console.log('EmailHashSchema given.');
});

router.get('/getip', function (req, res) {
    IPSchema.find({}).exec(function(err, doc) {
        res.status(200).send(doc);
    });
    console.log('IP data given.')
});

router.get('/deletedbip',function(req,res) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
    console.log(ip);
    //IPSchema.delete({ ip: '78.153.99.40' });
    //deletemany
    IPSchema.deleteOne({ ip: '78.153.99.40' }, function (err) {
        if (err) return handleError(err);
        // deleted at most one tank document
    });
    console.log('Selected IP data deleted.')
});

router.get('/deletedbdata',function(req,res) {

    DataSchema.deleteMany({}, function (err) {
        if (err) return handleError(err);
        // deleted at most one tank document
    });
    console.log('DataSchema db deleted.')
});

router.get('/deletedbemail',function(req,res) {

    EmailHashSchema.deleteMany({}, function (err) {
        if (err) return handleError(err);
        // deleted at most one tank document
    });

    console.log('EmailSchema db deleted.')
});

router.get('/deletedb',function(req,res) {

    DataSchema.deleteMany({}, function (err) {
        if (err) return handleError(err);
        // deleted at most one tank document
    });

    IPSchema.deleteMany({}, function (err) {
        if (err) return handleError(err);
        // deleted at most one tank document
    });

    EmailHashSchema.deleteMany({}, function (err) {
        if (err) return handleError(err);
        // deleted at most one tank document
    });

    console.log('All dbs deleted.')
});

router.get('/excel',function(req,res){
    node_xj({
        input: "./public/resources/MunkakKesz.xls",  // input xls
        output: "jobsXlsJson.json", // output json
    }, function(err, result) {
        if(err) {
            console.error(err);
        } else {
            console.log(result);
        }
    });
});

router.get('/json',function(req,res){
    var json = fs.readFileSync('./public/resources/jobsXlsJson.json');
    var rawjson = JSON.parse(json);

    var result = [];

    for(var i =0 ;i < rawjson.length; i++) {
        result[i] = rawjson[i].Job;
    }
    res.send(result);
});

module.exports = router;
