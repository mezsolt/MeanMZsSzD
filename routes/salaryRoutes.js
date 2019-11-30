var express = require('express');
var router = express.Router();
var DataSchema = require('./DataSchema');
var EmailHashSchema = require('./EmailHashSchema');
var IPSchema = require('./IPSchema');
var mongoose = require('mongoose');
var md5 = require('md5');
var nodeMailer = require('nodemailer');
var fs = require('fs');
var request = require('request');
const ChartStats = require('./ChartStats')



router.get('/country',function(req,res){

    var citiesByCountriesData = fs.readFileSync('./public/resources/citiesByCountriesJson');
    var citiesByCountriesDataRaw = JSON.parse(citiesByCountriesData);

    var countries = [];

    var keys = Object.keys(citiesByCountriesDataRaw);
    for(var i =0 ;i < keys.length; i++) {
        countries[i] = keys[i];
    }

    console.log('Country list send.');
    res.send(countries);
});

router.post('/city',function(req,res){

    var citiesByCountriesData = fs.readFileSync('./public/resources/citiesByCountriesJson');
    var citiesByCountriesDataRaw = JSON.parse(citiesByCountriesData);

    var cities = [];

    var keys = Object.keys(citiesByCountriesDataRaw);
    for(var i =0 ;i < keys.length; i++) {
        if(keys[i]==req.body.country) {
            cities = citiesByCountriesDataRaw[keys[i]];
        }
    }
    console.log('City list send.');
    res.send(cities);
});

router.get('/occupation',function(req,res){

    var occupationsjson = fs.readFileSync('./public/resources/occupationsOnly');
    var occupationsDataRaw = JSON.parse(occupationsjson);

    var occupations = [];

    for(var i =0 ;i < occupationsDataRaw.length; i++) {
        occupations[i] = occupationsDataRaw[i].name;
    }
    console.log('Occupation list send.');
    res.send(occupations);
});

router.post('/role',function(req,res){

    var occupationsjson = fs.readFileSync('./public/resources/jobsXlsJson.json');
    var occupationsDataRaw = JSON.parse(occupationsjson);

    var roles = [];

    for(var i =0 ;i < occupationsDataRaw.length; i++) {
        if(occupationsDataRaw[i].Occupation==req.body.occupation) {
            roles.push(occupationsDataRaw[i].Job);
        }
    }

    console.log('Role list send.');
    res.send(roles);
});

router.post('/data',async function (req, res, next) {

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;

    var spam =  await ChartStats.ipSpamCheck(ip);
    if(spam == false) {

        var data = req.body;

        var occupationsjson = fs.readFileSync('./public/resources/jobsXlsJson.json');
        var occupationsDataRaw = JSON.parse(occupationsjson);

        var code = '';
        var majorGroup = '';

        for (var i = 0; i < occupationsDataRaw.length; i++) {
            if (occupationsDataRaw[i].Job == data.role) {
                code = occupationsDataRaw[i].Code;
                majorGroup = occupationsDataRaw[i].MajorGroup;
            }
        }

        data.code = code;
        data.majorGroup = majorGroup;

        EmailHashSchema.findOne({_id: data.emailId}, async function (err, doc) {

            var emailHasntChangedIn30Days = false;
            if (((Date.now() - doc.date) / 1000) < (60 * 60 * 24 * 30)) {
                emailHasntChangedIn30Days = true;
            }
            if (doc != undefined) {
                if (doc.formFilled == false) {

                    var html;
                    html = await ChartStats.statsFuncStart(data);
                    ChartStats.emailDataSend(html, data.emailId, data.emailToSend,data);

                    DataSchema.create({
                        _id: new mongoose.Types.ObjectId(),
                        sex: data.sex,
                        age: data.age,
                        country: data.country,
                        city: data.city,
                        educationalAttainment: data.educationalAttainment,
                        experience: data.experience,
                        occupation: data.occupation,
                        role: data.role,
                        code: data.code,
                        majorGroup: data.majorGroup,
                        salary: data.salary,
                        date: Date.now(),
                        emailId: data.emailId
                    }, function (err, doc) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log(err);
                        console.log(doc);
                    });

                    var res = await EmailHashSchema.update({_id: data.emailId}, {formFilled: true,date: Date.now()});

                    console.log('New data has been added to db.')
                } else {
                    if(emailHasntChangedIn30Days == true) {
                    DataSchema.findOne({emailId: data.emailId}, async function (err, doc) {
                        //if (((Date.now - doc.date) / 1000) < (60 * 60 * 24 * 30)) {
                           // console.log('Last time data was changed is less than 1 month.')
                        //change it back
                                var html;
                                html = await ChartStats.statsFuncStart(data);
                                ChartStats.emailDataSend(html, data.emailId, data.emailToSend,data);
                                console.log('UPDATE!!');

                                DataSchema.update({
                                    _id: doc._id
                                }, {
                                    sex: data.sex,
                                    age: data.age,
                                    country: data.country,
                                    city: data.city,
                                    educationalAttainment: data.educationalAttainment,
                                    experience: data.experience,
                                    occupation: data.occupation,
                                    role: data.role,
                                    code: data.code,
                                    majorGroup: data.majorGroup,
                                    salary: data.salary,
                                    date: Date.now(),
                                    emailId: data.emailId
                                }, function (err, doc) {
                                    if (err) {
                                        return console.log(err);
                                    }
                                    console.log(err);
                                    console.log(doc);
                                });

                                var res = await EmailHashSchema.update({_id: data.emailId}, {date: Date.now()});

                                console.log('Data has been updated.');

                    });
                } else {
                        console.log('email hasnt changed in 30 days false')
                    }
                }
            }
        });
        }
});

router.post('/email', async function (req, res) {

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;

    var spam =  await ChartStats.ipSpamCheck(ip);
    if(spam == false) {

            EmailHashSchema.find({}).exec(function(err, doc) {
                var emailData;
                var emailAlreadyExistsInDB = false;
                var emailAlreadyExistsId = '';
                var emailAlreadyExistsHasBeenUsedIn30Days = false;
                emailData = doc;

                var keys = Object.keys(emailData);
                for(var i = 0; i<emailData.length; i++) {
                    if(md5(req.body.email) === emailData[keys[i]].emailHash) {
                        emailAlreadyExistsInDB = true;
                        emailAlreadyExistsId = emailData[keys[i]]._id;
                        if (((Date.now() - emailData[keys[i]].date) / 1000) < (60 * 60 * 24 * 30)) {
                            emailAlreadyExistsHasBeenUsedIn30Days = true;
                        }
                    }
                }

                if(emailAlreadyExistsInDB == false) {
                    var idToSend = '';
                        EmailHashSchema.create({
                            _id : new mongoose.Types.ObjectId(),
                            emailHash : md5(req.body.email),
                            date: new Date(),
                            formFilled: false
                        },  function(err, doc) {
                            idToSend = doc._id;

                            let transporter = nodeMailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: 'mezsolt90test@gmail.com',
                                    pass: 'mezsolt90'
                                }
                            });

                            transporter.verify(function (error, success) {
                                if (error) {
                                    console.log('server email error');
                                } else {
                                    console.log('server ready');
                                }
                            });



                            let mailOptions = {
                                from: 'mezsolt90test@gmail.com', // sender address
                                to: req.body.email, // list of receivers
                                subject: 'Average Salary Statistics', // Subject line
                                text: 'nemzsolti vagyok a szomszedbol', // plain text body
                                html: '<b>Average salary statistics, click on the link and complete the form to receive your statistic!</b><br><a href="http://localhost:3000/form?userId='+idToSend+'&emailToSend='+req.body.email+'">Link to Form</a>' // html body
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return console.log(error);
                                }
                                console.log('Message %s sent: %s', info.messageId, info.response);
                            });

                            console.log('New email data added to database.')
                            console.log('EmailSent for first time user.')
                        });
                } else {
                    let transporter = nodeMailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'mezsolt90test@gmail.com',
                            pass: 'mezsolt90'
                        }
                    });

                    transporter.verify(function (error, success) {
                        if (error) {
                            console.log('email server error');
                        } else {
                            console.log('server ready');
                        }
                    });

                    var messageInAlreadyExistsEmail = '';
                    var makeEmailDateUpdate = false;

                    if(emailAlreadyExistsHasBeenUsedIn30Days == false) {
                        messageInAlreadyExistsEmail = 'You cannot make changes before 30 days passed since the last time you have been given data.'
                    } else {
                        messageInAlreadyExistsEmail = '<b>Average salary statistics, click on the link and complete the form to update your job details and receive your statistic!</b><br><a href="http://localhost:3000/form?userId='+emailAlreadyExistsId+'&emailToSend='+req.body.email+'">Link to Form</a>'; // html body
                        makeEmailDateUpdate = true;
                    }

                    let mailOptions = {
                        from: 'mezsolt90test@gmail.com', // sender address
                        to: req.body.email, // list of receivers
                        subject: 'Average Salary Statistics', // Subject line
                        text: 'nemzsolti vagyok a szomszedbol', // plain text body
                        html: messageInAlreadyExistsEmail // html body
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if(makeEmailDateUpdate == true) {
                        EmailHashSchema.update({
                            _id: emailAlreadyExistsId
                        }, {
                            date: Date.now(),
                        }, function (err, doc) {
                            if (err) {
                                return console.log(err);
                            }
                            console.log(err);
                            console.log(doc);
                        });
                        }
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message %s sent: %s', info.messageId, info.response);
                    });

                    console.log('Email sent with link to update or cannot make changes yet message.')
                }
            });
    }
});

router.post('/newstat', async function (req, res) {

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;

    var spam =  await ChartStats.ipSpamCheck(ip);
    if(spam == false) {
        EmailHashSchema.findOne({emailHash:md5(req.body.email)},async function(err,doc){
            if(doc != undefined) {
                if (doc.formFilled == true) {
                    DataSchema.findOne({emailId: doc._id}, async function (err, docData) {
                        if (docData != undefined) {
                                var html;
                                html = await ChartStats.statsFuncStart(docData, docData.code, docData.majorGroup);
                                ChartStats.emailDataSend(html, docData.emailId ,req.body.email,docData);
                        }
                    });
                }
            } else {
                console.log('New stat email with Doesnt exists message.')
                ChartStats.emailDataSend('', '',req.body.email,'Doesnt exists.');
            }
        });
    }

    console.log('New stat been sent.');
});

router.get('/iptester', async function (req, res) {

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;

    var spam =  await ChartStats.ipSpamCheck(ip);
    if(spam == false) {
        console.log('spam: false: ' + spam);
    }
    if(spam == true) {
        console.log('spam: true: ' + spam);
    }

    console.log('IpTester.')
});

router.get('/dbtestdata',async function(req,res){

    var country = 'Japan';
    var city = 'Tokyo';

    dbDataTestInsert(country,city);

    var country = 'Japan';
    var city = 'Kyoto';

    dbDataTestInsert(country,city);

    var country = 'Hungary';
    var city = 'Ozd';

    dbDataTestInsert(country,city);

    var country = 'Hungary';
    var city = 'Miskolc';

    dbDataTestInsert(country,city);

    var country = 'Albania';
    var city = 'Petran';

    dbDataTestInsert(country,city);

    var country = 'Albania';
    var city = 'Pogradec';

    dbDataTestInsert(country,city);

    var country = 'United States';
    var city = 'New York';

    dbDataTestInsert(country,city);

    var country = 'United States';
    var city = 'Detroyt';

    dbDataTestInsert(country,city);

    var country = 'Germany';
    var city = 'Frankfurt';

    dbDataTestInsert(country,city);

    var country = 'Germany';
    var city = 'Berlin';

    dbDataTestInsert(country,city);

    var country = 'Russia';
    var city = 'Moscow';

    dbDataTestInsert(country,city);

    var country = 'Russia';
    var city = 'Abakan';

    dbDataTestInsert(country,city);

    var country = 'Mexico';
    var city = 'Abasolo';

    dbDataTestInsert(country,city);

    var country = 'Mexico';
    var city = 'Acambaro';

    dbDataTestInsert(country,city);

    var country = 'Algeria';
    var city = 'Acambaro';

    dbDataTestInsert(country,city);

    var country = 'Algeria';
    var city = 'Algiers';

    dbDataTestInsert(country,city);

    var country = 'Australia';
    var city = 'Abbotsford';

    dbDataTestInsert(country,city);

    var country = 'Australia';
    var city = 'Aberdeen';

    dbDataTestInsert(country,city);

    console.log('Dummy test data added.')
});

function dbDataTestInsert(country, city) {

    var salary = Math.round(Math.random() * 1500) + 300;

    salary = Math.round(Math.random() * 1500) + 300;

    var data = {_id:"5c853649d2aa31312877c697",
        sex:"male",
        age:"26-35",
        country:country,
        city:city,
        educationalAttainment:"middleSchool",
        experience:"0-1",
        occupation:"Administrative and commercial managers",
        role:"Compliance Manager",
        code:"121",
        majorGroup:"Managers",
        salary:salary,
        date:"2019-03-10T16:07:37.439Z",
        emailId:"das987dasdasö9",
        __v:0
    }

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'male',
        age: '18-25',
        country: country,
        city: city,
        educationalAttainment: 'universityMsc',
        experience: '5-10 years',
        occupation: data.occupation,
        role: data.role,
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'female',
        age: '18-25',
        country: country,
        city: city,
        educationalAttainment: 'universityMsc',
        experience: '5-10 years',
        occupation: data.occupation,
        role: data.role,
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'female',
        age: '18-25',
        country: country,
        city: city,
        educationalAttainment: 'universityMsc',
        experience: '2-4 years',
        occupation: data.occupation,
        role: data.role,
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'female',
        age: '18-25',
        country: country,
        city: city,
        educationalAttainment: 'elementarySchool',
        experience: '2-4 years',
        occupation: data.occupation,
        role: "Labor Relations Specialist",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'male',
        age: '26-35',
        country: country,
        city: city,
        educationalAttainment: 'highSchool',
        experience: '2-4 years',
        occupation: data.occupation,
        role: "Range Manager",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'female',
        age: '46-55',
        country: country,
        city: city,
        educationalAttainment: 'universityBsc',
        experience: '5-10 years',
        occupation: data.occupation,
        role: "Range Manager",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'male',
        age: '46-55',
        country: country,
        city: city,
        educationalAttainment: 'universityBsc',
        experience: '5-10 years',
        occupation: data.occupation,
        role: "Range Manager",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'female',
        age: '56-65',
        country: country,
        city: city,
        educationalAttainment: 'universityPhd',
        experience: '10+ years',
        occupation: data.occupation,
        role: "Range Manager",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'male',
        age: '56-65',
        country: country,
        city: city,
        educationalAttainment: 'universityPhd',
        experience: '10+ years',
        occupation: data.occupation,
        role: data.role,
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : data.sex,
        age: '36-45',
        country: country,
        city: city,
        educationalAttainment: data.educationalAttainment,
        experience: data.experience,
        occupation: data.occupation,
        role: "Range Manager",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : data.sex,
        age: '46-55',
        country: country,
        city: city,
        educationalAttainment: data.educationalAttainment,
        experience: data.experience,
        occupation: data.occupation,
        role: "Labor Relations Specialist",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'female',
        age: '18-25',
        country: country,
        city: city,
        educationalAttainment: 'universityMsc',
        experience: '2-4 years',
        occupation: data.occupation,
        role: "Labor Relations Specialist",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });

    salary = Math.round(Math.random() * 1500) + 300;

    DataSchema.create({
        _id : new mongoose.Types.ObjectId(),
        sex : 'female',
        age: '18-25',
        country: country,
        city: city,
        educationalAttainment: "college",
        experience: data.experience,
        occupation: data.occupation,
        role: "Labor Relations Specialist",
        code: data.code,
        majorGroup: data.majorGroup,
        salary: salary,
        date: Date.now(),
        emailId: data.emailId
    });
}

module.exports = router;