var EmailHashSchema = require('./EmailHashSchema');
var DataSchema = require('./DataSchema');
var IPSchema = require('./IPSchema');
var mongoose = require('mongoose');
const fs = require('fs');
var tsv = require('tsv');
var nodeMailer = require('nodemailer');
const {convert} = require('convert-svg-to-jpeg');
const svgToImg = require("svg-to-img");

const d3nPie = require('d3node-piechart');
const d3nBar = require('d3node-barchart');
const d3 = require('d3-node')().d3;

const worldMapSalary = require('./worldSalary');
const barChart = require('./barChart');
const pieChart = require('./pieChart');

async function statsFuncStart(data){
    var html = await statsFunc(data);

    console.log('Html created.')
    return html;
}

async function numberOfEntriesInDBforStat(data) {
    var dataSchema = [];
    var searchedData = [];
    var jobType = '';
    var dataNumberToMakeTheStatistics = 0;
    var promise = new Promise(function(resolve, reject) {
        DataSchema.find({}).exec(function (err, doc) {
            dataSchema = doc;
            searchedData = searchedDataMethod(dataSchema,data);
            jobType = searchedData[0].type;
            searchedData.shift();

            var ownDataPlace = -1;
            for( var i = 0; i < searchedData.length; i++){
                if(searchedData[i].emailId === data.emailId) {
                    ownDataPlace = i;
                }
            }
            if(ownDataPlace != -1) {
                searchedData.splice(ownDataPlace, 1);
            }

            dataNumberToMakeTheStatistics = searchedData.length;
            if (err) {
                reject(err);
            } else {
                resolve('data');
            }
        });
    })

    await promise;

    console.log('Number of entries made. ' + dataNumberToMakeTheStatistics);
    return dataNumberToMakeTheStatistics;
}

async function statsFunc(data){
    var dataSchema = [];
    var searchedData = [];
    var jobType = '';
    var dataNumberToMakeTheStatistics = 0;
    var promise = new Promise(function(resolve, reject) {
        DataSchema.find({}).exec(function (err, doc) {
            dataSchema = doc;
            searchedData = searchedDataMethod(dataSchema,data);
            jobType = searchedData[0].type;
            searchedData.shift();

            var ownDataPlace = -1;
            for( var i = 0; i < searchedData.length; i++){
               if(searchedData[i].emailId === data.emailId) {
                   ownDataPlace = i;
               }
            }
            if(ownDataPlace != -1) {
                searchedData.splice(ownDataPlace, 1);
            }

            dataNumberToMakeTheStatistics = searchedData.length;

            if (err) {
                reject(err);
            } else {
                resolve('data');
            }
        });
    })

    await promise;

    var pie1 = await pieGender(searchedData);
    var pie2= await pieEducation(searchedData);
    var pie3 = await pieExperience(searchedData);
    var bar1 = await barAge(searchedData,data);
    var bar2 = await barCity(searchedData,data);
    var bar3 = await barEducation(searchedData,data);
    var bar4 = await barRole(dataSchema,data);
    var avgSalaryData = await averageSalary(searchedData);
    var world = await worldchartstat(avgSalaryData);

    var jobTypeMessage = '';

    if(jobType == 'role') {
        jobTypeMessage = 'The statistics are created around your role.';
    }
    if(jobType == 'code') {
        jobTypeMessage = 'There were not enough roles to make viable statistics, so the statistics were expanded by jobs similar to yours.';
    }
    if(jobType == 'occupation') {
        jobTypeMessage = 'There were not enough roles to make viable statistics, so the statistics were expanded by jobs form your occupation group.';
    }
    if(jobType == 'majorGroup') {
        jobTypeMessage = 'There were not enough roles to make viable statistics, so the statistics were expanded by bigger occupation groups similar to yours.';
    }

    var htmlCode =
        '<head>' +
        '<meta charset="UTF-8">'+
        '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css">'+
        '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>'+
        '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js"></script>'+
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.0/umd/popper.min.js"></script>'+
        '<style>'+
        '.hidden { display: none; }'+
        '.unhidden { display: block; }'+
        '.dataP {}'+
        '.vertical-menu {'+
        'margin-left: auto;'+
        'margin-right: auto;'+
        'width: 20%;'+
        'text-align: center;'+
        '}'+
        '.list-group {'+
        'margin-left: auto;'+
        'margin-right: auto;'+
        'width: 20%;'+
        'text-align: center;'+
        '}'+
        '.vertical-menu a {'+
        'background-color: #eee;'+
        'color: black;'+
        'display: block;'+
        'padding: 12px;'+
        'text-decoration: none;'+
        '}'+

        '.vertical-menu a:hover {'+
        'background-color: #ccc;'+
        '}'+

        '.vertical-menu a.active {'+
        'background-color: #4CAF50;'+
        'color: white;'+
        '</style>'+
        '<script type=' + "text/javascript" + '>'+
        'function unhide(divID) {'+
        'document.getElementById("chart1").className="hidden";' +
        'document.getElementById("chart2").className="hidden";' +
        'document.getElementById("chart3").className="hidden";' +
        'document.getElementById("chart4").className="hidden";' +
        'document.getElementById("chart5").className="hidden";' +
        'document.getElementById("chart6").className="hidden";' +
        'document.getElementById("chart7").className="hidden";' +
        'document.getElementById("chart8").className="hidden";' +
        'var item = document.getElementById(divID);'+
        'if (item) {'+
        'item.className=(item.className=='+"'hidden'"+')?'+"'unhidden'"+':'+"'hidden'"+';' +
        '}' +
        '}'+
        '</script>'+
        '</head>'+
        '<body style="background: linear-gradient(45deg, rgba(236,249,246,0.28), rgba(56,59,57,0.97) 100%);">'+
        '<br>'+
        '<div style="text-align: center; margin:auto; width: 75%;" class="jumbotron text-center">'+
        '<h1 class="jumbotron-heading">Average Salary Statistics</h1>'+
        '<hr class="my-4">'+
        '</div>'+
        '<br>'+
        '<div style="text-align: center; margin:auto; width: 60%;" class="card bg-info text-white">'+
        '<div class="card-body text-center">ID: '+data.emailId+'<br>'+jobTypeMessage+'<br>'+'The amount of entries with your job in the database that made up the statistics: '+ dataNumberToMakeTheStatistics +'.</div>'+
        '</div>'+
        '<br>'+
        '<table style="text-align: center; margin:auto; width: 50%;" class="table table-striped table-dark">'+
        '<tbody>'+
        '<tr>'+
        '<th scope="row">The data it was created with:</th>'+
        '<td>-</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Sex</th>'+
        '<td>'+data.sex+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Age</th>'+
        '<td>'+data.age+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Country</th>'+
        '<td>'+data.country+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">City</th>'+
        '<td>'+data.city+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Educational attainment</th>'+
        '<td>'+data.educationalAttainment+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Experience</th>'+
        '<td>'+data.experience+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Occupation</th>'+
        '<td>'+data.occupation+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Role</th>'+
        '<td>'+data.role+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Major group</th>'+
        '<td>'+data.majorGroup+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Salary</th>'+
        '<td>'+data.salary+'</td>'+
        '</tr>'+
        '<tr>'+
        '<th scope="row">Date</th>'+
        '<td>'+new Date()+'</td>'+
        '</tr>'+
        '</tbody>'+
        '</table>'+
        '<br><br>'+
        '<div class="list-group">'+
        '<a href='+"#"+' class="list-group-item list-group-item-action bg-info text-white">Statistics Menu</a>'+
        '<a href='+"javascript:unhide('chart1');"+' class="list-group-item list-group-item-action">Salary statistic by gender</a>'+
        '<a href='+"javascript:unhide('chart2');"+' class="list-group-item list-group-item-action">Salary statistic by education</a>' +
        '<a href='+"javascript:unhide('chart3');"+' class="list-group-item list-group-item-action">Salary statistic by experience</a>' +
        '<a href='+"javascript:unhide('chart4');"+' class="list-group-item list-group-item-action">Salary statistic by age in your country</a>' +
        '<a href='+"javascript:unhide('chart5');"+' class="list-group-item list-group-item-action">Salary statistic by city in your country</a>' +
        '<a href='+"javascript:unhide('chart6');"+' class="list-group-item list-group-item-action">Salary statistic by education in your city</a>' +
        '<a href='+"javascript:unhide('chart7');"+' class="list-group-item list-group-item-action">Salary statistic by role in your occupation group</a>' +
        '<a href='+"javascript:unhide('chart8');"+' class="list-group-item list-group-item-action">Salary statistic by your role around the world</a>' +
        '</div>'+
        '<br><br>'+
        '<div id="chart1" class="unhidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by gender:</h2>'+'</div>'+
        '<br><br><div style="margin-left: auto; margin-right: auto; width: 55%;"><img style="display: block; margin-left: auto; margin-right: auto; width: 50%;" src="data:image/png;base64,'+pie1+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>It shows how much is the average salary for women and men in your role.</h4>'+'</div><br>'+
        '</div>'+
        '<div id="chart2" class="hidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by education:</h2>'+'</div>'+
        '<br><br><div style="margin-left: auto; margin-right: auto; width: 55%;"><img style="display: block; margin-left: auto; margin-right: auto; width: 50%;" src="data:image/png;base64,'+pie2+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>Above chart shows the different educational attainments with average salaries in your role around the world.</h4>'+'</div><br>'+
        '</div>'+
        '<div id="chart3" class="hidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by experience:</h2>'+'</div>'+
        '<br><br><div style="margin-left: auto; margin-right: auto; width: 55%;"><img style="display: block; margin-left: auto; margin-right: auto; width: 50%;" src="data:image/png;base64,'+pie3+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>This pie chart shows how much is  the average salary with different experience on your field.</h4>'+'</div><br>'+
        '</div>'+
        '<div id="chart4" class="hidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by age in your country:</h2>'+'</div>'+
        '<br><br><div style="margin-left: auto; margin-right: auto; width: 55%;"><img style="width: 100%" src="data:image/png;base64,'+bar1+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>This chart shows you what is the average salary for different age groups in your country for your role.</h4>'+'</div><br>'+
        '</div>'+
        '<div id="chart5" class="hidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by city in your country:</h2>'+'</div>'+
        '<br><br><div style="margin:auto; width: 55%;"><img style="width: 100%" src="data:image/png;base64,'+bar2+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>Above bar chart shows the top 5 cities for your role with average salaries in your country, including your own.</h4>'+'</div><br>'+
        '</div>'+
        '<div id="chart6" class="hidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by education in your city:</h2>'+'</div>'+
        '<br><br><div style="margin-left: auto; margin-right: auto; width: 55%;"><img style="width: 100%" src="data:image/png;base64,'+bar3+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>It shows how much is the average salary for different educational attainments in your city for your role.</h4>'+'</div><br>'+
        '</div>'+
        '<div id="chart7" class="hidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by role in your occupation group:</h2>'+'</div>'+
        '<br><br><div style="margin-left: auto; margin-right: auto; width: 55%;"><img style="width: 100%" src="data:image/png;base64,'+bar4+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>This bar chart shows you the top 5 roles with average salaries in your occupation group, including your own.</h4>'+'</div><br>'+
        '</div>'+
        '<div id="chart8" class="hidden">'+
        '<div class="bg-dark text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h2>Salary statistic by your role around the world:</h2>'+'</div>'+
        '<br><br><div style="margin-left: auto; margin-right: auto; width: 55%;"><img style="width: 100%" src="data:image/png;base64,'+world+'"/></div><br>'+
        '<div class="bg-secondary text-white" style="text-align: center; margin:auto; width: 50%; padding: 10px;">'+'<h4>The world chart shows you where is the best and worst salaries are for your role. Deeper color means better salary.</h4>'+'</div><br>'+
        '</div>'+
        '<br>'+
        '<br>'+
        '<div style="text-align: center; margin:auto; width: 60%;" class="card bg-info text-white">'+
        '<div class="card-body text-center">You can get new statistics later without completing the form by using your email address, that you used before.<br><br>These statistics were created by the avgsalary.com webpage, with questions please contact the supportSalaryAvg@mail.com address.<br><br>Thank you for using the service!</div>'+
        '</div>'+
        '<br>'+
        '</body>';

    console.log('Html created for send.');

    return htmlCode;

}

function searchedDataMethod(dataSchema,data) {

    var searchedData = [{type:'role'}];

    var roleCount = 0;
    var codeCount = 0;
    var occupationCount = 0;
    var majorGroupCount = 0;

    var keys = Object.keys(dataSchema);
    for (var i = 0; i < keys.length; i++) {
        if (dataSchema[keys[i]].role == data.role) {
            roleCount = roleCount + 1;
            searchedData.push(dataSchema[i]);
        }
    }

    if(roleCount < 2) {
        searchedData = [{type:'code'}];
        for (var i = 0; i < keys.length; i++) {
            if (dataSchema[keys[i]].code == data.code) {
                codeCount = codeCount + 1;
                searchedData.push(dataSchema[i]);
            }
        }
    }

    if(codeCount < 2 && roleCount < 2) {
        searchedData = [{type:'occupation'}];
        for (var i = 0; i < keys.length; i++) {
            if (dataSchema[keys[i]].occupation == data.occupation) {
                occupationCount = occupationCount + 1;
                searchedData.push(dataSchema[i]);
            }
        }

    }

    if(codeCount < 2 && roleCount < 2 && occupationCount < 2) {
        searchedData = [{type:'majorGroup'}];
        for (var i = 0; i < keys.length; i++) {
            if (dataSchema[keys[i]].majorGroup == data.majorGroup) {
                majorGroupCount = majorGroupCount + 1;
                searchedData.push(dataSchema[i]);
            }
        }
    }

    console.log('SearchedData created.')
    return searchedData;
}

function barDataSortingMethod(result,dataArray,data){
    var finalResult = [];

    if(result.length > 4) {
        result.sort(function(a, b){
            return b.value - a.value;
        });


        for (var i = 0; i <= 4; i++) {
            finalResult.push({key: result[i].key, value: result[i].value});
        }

        var userDataExistinResult = false;

        for (var i = 0; i < finalResult.length; i++) {
            if(finalResult[i].key.startsWith(data)) {
                userDataExistinResult = true;
            }
        }

        if(userDataExistinResult == false) {
            for (var i = 0; i < dataArray.length; i++) {
                if (dataArray[i].key == data) {
                    finalResult.push({
                        key: dataArray[i].key + ', ' + Math.floor(dataArray[i].avg) + ' (€)',
                        value: dataArray[i].avg
                    });
                }
            }
        }

        finalResult.sort(function(a, b){
            return b.value - a.value;
        });
    } else {
        finalResult = result;
    }

    console.log('Data result sorted.');
    return finalResult;
}

async function pieGender(searchedData) {

    var chart;
    var femaleSalarySum = 0;
    var maleSalarySum = 0;
    var femaleCount = 0;
    var maleCount = 0;
    var femaleAvgSalary = 0;
    var maleAvgSalary = 0;


    var keys = Object.keys(searchedData);
    for (var i = 0; i < keys.length; i++) {
        if (searchedData[keys[i]].sex == "female") {
            femaleCount = femaleCount + 1;
            femaleSalarySum = femaleSalarySum + searchedData[keys[i]].salary;
        }
        if (searchedData[keys[i]].sex == "male") {
            maleCount = maleCount + 1;
            maleSalarySum = maleSalarySum + searchedData[keys[i]].salary;
        }
    }
    if (femaleCount > 0) {
        femaleAvgSalary = femaleSalarySum / femaleCount;
    }
    if (maleCount > 0) {
        maleAvgSalary = maleSalarySum / maleCount;
    }

    var dataGender = [{label: 'Male: ' + Math.floor(maleAvgSalary) + ' (€)', value: maleAvgSalary},
        {label: 'Female: ' + Math.floor(femaleAvgSalary) + ' (€)', value: femaleAvgSalary}];

    chart = pieChart({
        data: dataGender,
        container:
            `<div id="container">
                    <h2>Pie Chart Gender</h2>
                     <div id="chart"></div>
                      <p>a</p>
                    </div>`,
        //style: _svgStyles,
        colorRange: ["#7edfe7", "#5dc2c4", "#39b6fb", "#33a2fb", "#268cfb", "#1675fb", "#0a5bfb"],
    });

    var piesvg = chart.svgString();

    const png = await svgToImg.from(piesvg).toPng({ encoding: "base64" });

    console.log('PieGender created.');
    return png;
}



async function pieExperience(searchedData) {

    var chart;
    const _svgStyles = `
    .arc text {
    font-size: 15px;
    text-anchor: start;
    }
    .arc path {
    stroke: #000000;
    }
    
  `;

    var zeroOneYearsCount = 0;
    var twoFourYearsCount = 0;
    var fiveTenYearsCount = 0;
    var tenPlusYearsCount = 0;

    var zeroOneYearsSum = 0;
    var twoFourYearsSum = 0;
    var fiveTenYearsSum = 0;
    var tenPlusYearsSum = 0;

    var zeroOneYearsAvgSalary = 0;
    var twoFourYearsAvgSalary = 0;
    var fiveTenYearsAvgSalary = 0;
    var tenPlusYearsAvgSalary = 0;

    var keys = Object.keys(searchedData);
    for (var i = 0; i < keys.length; i++) {
        if(searchedData[keys[i]].experience == '0-1'){
            zeroOneYearsCount = zeroOneYearsCount + 1;
            zeroOneYearsSum = zeroOneYearsSum + searchedData[keys[i]].salary;
            zeroOneYearsAvgSalary = zeroOneYearsSum / zeroOneYearsCount;
        }
        if(searchedData[keys[i]].experience == '2-4 years'){
            twoFourYearsCount = twoFourYearsCount + 1;
            twoFourYearsSum = twoFourYearsSum + searchedData[keys[i]].salary;
            twoFourYearsAvgSalary = twoFourYearsSum / twoFourYearsCount;
        }
        if(searchedData[keys[i]].experience == '5-10 years'){
            fiveTenYearsCount = fiveTenYearsCount + 1;
            fiveTenYearsSum = fiveTenYearsSum + searchedData[keys[i]].salary;
            fiveTenYearsAvgSalary = fiveTenYearsSum / fiveTenYearsCount;
        }
        if(searchedData[keys[i]].experience == '10+ years'){
            tenPlusYearsCount = tenPlusYearsCount + 1;
            tenPlusYearsSum = tenPlusYearsSum + searchedData[keys[i]].salary;
            tenPlusYearsAvgSalary = tenPlusYearsSum / tenPlusYearsCount;
        }
    }

    var dataExperience = [];

    if(zeroOneYearsAvgSalary != 0) {
        dataExperience.push({label: '0-1 year: ' + Math.floor(zeroOneYearsAvgSalary) + ' (€)', value: zeroOneYearsAvgSalary});
    }

    if(twoFourYearsAvgSalary != 0) {
        dataExperience.push({label: '2-4 years: ' + Math.floor(twoFourYearsAvgSalary) + ' (€)', value: twoFourYearsAvgSalary});
    }

    if(fiveTenYearsAvgSalary != 0) {
        dataExperience.push({label: '5-10 years: ' + Math.floor(fiveTenYearsAvgSalary) + ' (€)', value: fiveTenYearsAvgSalary});
    }

    if(tenPlusYearsAvgSalary != 0) {
        dataExperience.push({label: '10+ years: ' + Math.floor(tenPlusYearsAvgSalary) + ' (€)', value: tenPlusYearsAvgSalary});
    }


    chart = pieChart({
        data: dataExperience,
        container:
            `<div id="container">
                    <h2>Pie Chart Experience</h2>
                     <div id="chart"></div>
                      <p>a</p>
                    </div>`,
        //style: _svgStyles,
        colorRange: ["#7edfe7", "#5dc2c4", "#39b6fb", "#33a2fb", "#268cfb", "#1675fb", "#0a5bfb"]
    });

    var piesvg = chart.svgString();

    const png = await svgToImg.from(piesvg).toPng({ encoding: "base64" });

    console.log('PieExperience created.');
    return png;
}

async function pieEducation(searchedData) {

    var chart;

    const _svgStyles = `
    .arc path {
    stroke: #000000;
    }
    body {
    background-color : white;
    }
    text {
    font-size: 15px;
    }
  `;

    var elementarySchoolCount = 0;
    var middleSchoolCount = 0;
    var highSchoolCount = 0;
    var collegeCount = 0;
    var universityBscCount = 0;
    var universityMscCount = 0;
    var universityPhdCount = 0;

    var elementarySchoolSum = 0;
    var middleSchoolSum = 0;
    var highSchoolSum = 0;
    var collegeSum = 0;
    var universityBscSum = 0;
    var universityMscSum = 0;
    var universityPhdSum = 0;

    var elementarySchoolAvgSalary = 0;
    var middleSchoolAvgSalary = 0;
    var highSchoolAvgSalary = 0;
    var collegeAvgSalary = 0;
    var universityBscAvgSalary = 0;
    var universityMscAvgSalary = 0;
    var universityPhdAvgSalary = 0;


    var keys = Object.keys(searchedData);
    for (var i = 0; i < keys.length; i++) {
        if(searchedData[keys[i]].educationalAttainment == 'elementarySchool'){
            elementarySchoolCount = elementarySchoolCount + 1;
            elementarySchoolSum = elementarySchoolSum + searchedData[keys[i]].salary;
            elementarySchoolAvgSalary = elementarySchoolSum / elementarySchoolCount;
        }
        if(searchedData[keys[i]].educationalAttainment == 'middleSchool'){
            middleSchoolCount = middleSchoolCount + 1;
            middleSchoolSum = middleSchoolSum + searchedData[keys[i]].salary;
            middleSchoolAvgSalary = middleSchoolSum / middleSchoolCount;
        }
        if(searchedData[keys[i]].educationalAttainment == 'highSchool'){
            highSchoolCount = highSchoolCount + 1;
            highSchoolSum = highSchoolSum + searchedData[keys[i]].salary;
            highSchoolAvgSalary = highSchoolSum / highSchoolCount;
        }
        if(searchedData[keys[i]].educationalAttainment == 'college'){
            collegeCount = collegeCount + 1;
            collegeSum = collegeSum + searchedData[keys[i]].salary;
            collegeAvgSalary = collegeSum / collegeCount;
        }
        if(searchedData[keys[i]].educationalAttainment == 'universityBsc'){
            universityBscCount = universityBscCount + 1;
            universityBscSum = universityBscSum + searchedData[keys[i]].salary;
            universityBscAvgSalary = universityBscSum / universityBscCount;
        }
        if(searchedData[keys[i]].educationalAttainment == 'universityMsc'){
            universityMscCount = universityMscCount + 1;
            universityMscSum = universityMscSum + searchedData[keys[i]].salary;
            universityMscAvgSalary = universityMscSum / universityMscCount;
        }
        if(searchedData[keys[i]].educationalAttainment == 'universityPhd'){
            universityPhdCount = universityPhdCount + 1;
            universityPhdSum = universityPhdSum + searchedData[keys[i]].salary;
            universityPhdAvgSalary = universityPhdSum / universityPhdCount;
        }
    }

    var dataEducation = [];

    if(elementarySchoolAvgSalary != 0) {
        dataEducation.push({label: 'elementarySchool: ' + Math.floor(elementarySchoolAvgSalary) + ' (€)', value: elementarySchoolAvgSalary});
    }

    if(middleSchoolAvgSalary != 0) {
        dataEducation.push({label: 'middleSchool: ' + Math.floor(middleSchoolAvgSalary) + ' (€)', value: middleSchoolAvgSalary});
    }

    if(highSchoolAvgSalary != 0) {
        dataEducation.push({label: 'highSchool: ' + Math.floor(highSchoolAvgSalary) + ' (€)', value: highSchoolAvgSalary});
    }

    if(collegeAvgSalary != 0) {
        dataEducation.push({label: 'college: ' + Math.floor(collegeAvgSalary) + ' (€)', value: collegeAvgSalary});
    }

    if(universityBscAvgSalary != 0) {
        dataEducation.push({label: 'universityBsc: ' + Math.floor(universityBscAvgSalary) + ' (€)', value: universityBscAvgSalary});
    }

    if(universityMscAvgSalary != 0) {
        dataEducation.push({label: 'universityMsc: ' + Math.floor(universityMscAvgSalary) + ' (€)', value: universityMscAvgSalary});
    }

    if(universityPhdAvgSalary != 0) {
        dataEducation.push({label: 'universityPhd: ' + Math.floor(universityPhdAvgSalary) + ' (€)', value: universityPhdAvgSalary});
    }


    chart = pieChart({
        data: dataEducation,
        container:
            `<div id="container">
                    <h2>Pie Chart Education</h2>
                     <div id="chart"></div>
                      <p>a</p>
                    </div>`,
        //style: _svgStyles,
        colorRange: ["#7edfe7", "#5dc2c4", "#39b6fb", "#33a2fb", "#268cfb", "#1675fb", "#0a5bfb"]
    });

    var piesvg = chart.svgString();

    const png = await svgToImg.from(piesvg).toPng({ encoding: "base64" });

    console.log('PieEducation created.');
    return png;
}

async function barRole(dataSchema,data) {

    var chart;

    var dataRolesSum = [];

    var searchedData = dataSchema;
    var keys = Object.keys(searchedData);

    for (var i = 0; i < keys.length; i++) {
        if (searchedData[keys[i]].occupation == data.occupation) {
            if (dataRolesSum.length == 0) {
                dataRolesSum.push({
                    key: searchedData[keys[i]].role,
                    salary: searchedData[keys[i]].salary,
                    count: 1,
                    avg: searchedData[keys[i]].salary
                });
            } else {
                var exist = false;
                var count = -1;
                for (var k = 0; k < dataRolesSum.length; k++) {
                    if (dataRolesSum[k].key == searchedData[keys[i]].role) {
                        exist = true;
                        count = k;
                    }

                }
                if (exist == false) {
                    dataRolesSum.push({
                        key: searchedData[keys[i]].role,
                        salary: searchedData[keys[i]].salary,
                        count: 1,
                        avg: searchedData[keys[i]].salary
                    });
                }
                if (exist == true) {
                    dataRolesSum[count].salary = dataRolesSum[count].salary + searchedData[keys[i]].salary;
                    dataRolesSum[count].count = dataRolesSum[count].count + 1;
                    dataRolesSum[count].avg = dataRolesSum[count].salary / dataRolesSum[count].count;
                }
            }
        }
    }

    var result = [];
    for (var i = 0; i < dataRolesSum.length; i++) {
        result.push({key: dataRolesSum[i].key + ', ' + Math.floor(dataRolesSum[i].avg) + ' (€)', value: dataRolesSum[i].avg});
    }

    var finalResult = barDataSortingMethod(result,dataRolesSum,data.role);

    var chart;

    chart = barChart({
        data:finalResult
    });

    var barSvg = chart.svgString();

    const png = await svgToImg.from(barSvg).toPng({ encoding: "base64" });

    console.log('BarRole created.');
    return png;

}

async function barCity(searchedData,data) {

    var keys = Object.keys(searchedData);

    var dataCitiesSum = [];
    for (var i = 0; i < keys.length; i++) {
        if (searchedData[keys[i]].country == data.country) {
            if (dataCitiesSum.length == 0) {
                dataCitiesSum.push({
                    key: searchedData[keys[i]].city,
                    salary: searchedData[keys[i]].salary,
                    count: 1,
                    avg: searchedData[keys[i]].salary
                });
            } else {
                var exist = false;
                var count = -1;
                for (var k = 0; k < dataCitiesSum.length; k++) {
                    if (dataCitiesSum[k].key == searchedData[keys[i]].city) {
                        exist = true;
                        count = k;
                    }

                }
                if (exist == false) {
                    dataCitiesSum.push({
                        key: searchedData[keys[i]].city,
                        salary: searchedData[keys[i]].salary,
                        count: 1,
                        avg: searchedData[keys[i]].salary
                    });
                }
                if (exist == true) {
                    dataCitiesSum[count].salary = dataCitiesSum[count].salary + searchedData[keys[i]].salary;
                    dataCitiesSum[count].count = dataCitiesSum[count].count + 1;
                    dataCitiesSum[count].avg = dataCitiesSum[count].salary / dataCitiesSum[count].count;
                }
            }
        }
    }

    var result = [];
    for (var i = 0; i < dataCitiesSum.length; i++) {
        result.push({key: dataCitiesSum[i].key + ', ' + Math.floor(dataCitiesSum[i].avg) + ' (€)', value: dataCitiesSum[i].avg});
    }

    var finalResult = barDataSortingMethod(result,dataCitiesSum,data.city);


    var chart;

    chart = barChart({
        data:finalResult
    });

    var barSvg = chart.svgString();

    const png = await svgToImg.from(barSvg).toPng({ encoding: "base64" });

    console.log('BarCity created.');
    return png;
}

async function barEducation(searchedData,data) {

    var dataEducationsSum = [];

    var keys = Object.keys(searchedData);

    for (var i = 0; i < keys.length; i++) {
        if (searchedData[keys[i]].city == data.city) {
            if (dataEducationsSum.length == 0) {
                dataEducationsSum.push({
                    key: searchedData[keys[i]].educationalAttainment,
                    salary: searchedData[keys[i]].salary,
                    count: 1,
                    avg: searchedData[keys[i]].salary
                });
            } else {
                var exist = false;
                var count = -1;
                for (var k = 0; k < dataEducationsSum.length; k++) {
                    if (dataEducationsSum[k].key == searchedData[keys[i]].educationalAttainment) {
                        exist = true;
                        count = k;
                    }

                }
                if (exist == false) {
                    dataEducationsSum.push({
                        key: searchedData[keys[i]].educationalAttainment,
                        salary: searchedData[keys[i]].salary,
                        count: 1,
                        avg: searchedData[keys[i]].salary
                    });
                }
                if (exist == true) {
                    dataEducationsSum[count].salary = dataEducationsSum[count].salary + searchedData[keys[i]].salary;
                    dataEducationsSum[count].count = dataEducationsSum[count].count + 1;
                    dataEducationsSum[count].avg = dataEducationsSum[count].salary / dataEducationsSum[count].count;
                }
            }
        }
    }


    var result = [];
    for (var i = 0; i < dataEducationsSum.length; i++) {
        result.push({key: dataEducationsSum[i].key + ', ' + Math.floor(dataEducationsSum[i].avg) + ' (€)', value: dataEducationsSum[i].avg});
    }



    var finalResult = barDataSortingMethod(result,dataEducationsSum,data.educationalAttainment);


    var chart;

    chart = barChart({
        data:finalResult
    });
    var barSvg = chart.svgString();

    const png = await svgToImg.from(barSvg).toPng({ encoding: "base64" });

    console.log('BarEducation created.');
    return png;
}

async function barAge(searchedData,data) {

    var dataAgesSum = [];

    var keys = Object.keys(searchedData);
    for (var i = 0; i < keys.length; i++) {
        if (searchedData[keys[i]].country == data.country) {
            if (dataAgesSum.length == 0) {
                dataAgesSum.push({
                    key: searchedData[keys[i]].age,
                    salary: searchedData[keys[i]].salary,
                    count: 1,
                    avg: searchedData[keys[i]].salary
                });
            } else {
                var exist = false;
                var count = -1;
                for (var k = 0; k < dataAgesSum.length; k++) {
                    if (dataAgesSum[k].key == searchedData[keys[i]].age) {
                        exist = true;
                        count = k;
                    }

                }
                if (exist == false) {
                    dataAgesSum.push({
                        key: searchedData[keys[i]].age,
                        salary: searchedData[keys[i]].salary,
                        count: 1,
                        avg: searchedData[keys[i]].salary
                    });
                }
                if (exist == true) {
                    dataAgesSum[count].salary = dataAgesSum[count].salary + searchedData[keys[i]].salary;
                    dataAgesSum[count].count = dataAgesSum[count].count + 1;
                    dataAgesSum[count].avg = dataAgesSum[count].salary / dataAgesSum[count].count;
                }
            }
        }
    }

    var result = [];
    for (var i = 0; i < dataAgesSum.length; i++) {
        result.push({key: dataAgesSum[i].key + ', ' + Math.floor(dataAgesSum[i].avg) + ' (€)', value: dataAgesSum[i].avg});
    }

    var finalResult = barDataSortingMethod(result,dataAgesSum,data.age);


    var chart;

    chart = barChart({
        data:finalResult
    });
    var barSvg = chart.svgString();

    const png = await svgToImg.from(barSvg).toPng({ encoding: "base64" });

    console.log('BarAge created.');
    return png;
}

async function averageSalary(searchedData) {
    var avgData = [];

    var keys = Object.keys(searchedData);

    for(var i =0;i<searchedData.length;i++) {
        var exists = false;
        for(var k=0;k<avgData.length;k++) {
            if (avgData[k].country == searchedData[keys[i]].country) {
                avgData[k].count = avgData[k].count + 1;
                avgData[k].salarySum = avgData[k].salarySum + searchedData[keys[i]].salary;
                avgData[k].avgSalary = avgData[k].salarySum / avgData[k].count;
                exists = true;
            }
        }
        if(exists == false) {
            avgData.push({
                country: searchedData[i].country,
                salarySum: searchedData[keys[i]].salary,
                count: 1,
                avgSalary: searchedData[keys[i]].salary
            });
        }
    }

    console.log('AverageSalary calculated for worldChart.');
    return avgData;
}

async function worldchartstat(data) {

    var idAndCountryname = fs.readFileSync('./public/resources/countryidnamesalary.json');

    var idAndCountrynameRaw = JSON.parse(idAndCountryname);
    var result;

    for (var k = 0; k < data.length; k++) {
        for (var i = 0; i < idAndCountrynameRaw.length; i++) {
            if (idAndCountrynameRaw[i].name == data[k].country) {
                idAndCountrynameRaw[i].salary = data[k].avgSalary;
            }
        }
    }

    const optionsList = [
        {projectionKey: 'Mercator', width: 960}
    ]

    var salaryCountry = d3.tsvParse(tsv.stringify(idAndCountrynameRaw));
    result = worldMapSalary(salaryCountry, optionsList[0]);


    var worldSvg = result.svgString();

    const png = await svgToImg.from(worldSvg).toPng({ encoding: "base64" });

    console.log('WorldChart created.');
    return png;
}

async function emailDataSend(html,emailId,emailToSend,data) {

    var numberOfEntriesInDB = 0;

    if(data != 'Doesnt exists.') {
        numberOfEntriesInDB = await numberOfEntriesInDBforStat(data);
    }


    var mailOptions = {
        from: 'mezsolt90test@gmail.com', // sender address
        to: emailToSend, // list of receivers
        subject: 'nemzsolti vagyok', // Subject line
        text: 'We send you the statistics in the attachment. Thank you for using the service! ID: ' + emailId + '.', // plain text body
        attachments: [{
            filename: 'statistic-'+emailId+'.html',
            content: html
        }],
    };

    if(numberOfEntriesInDB < 10) {

        mailOptions = {
            from: 'mezsolt90test@gmail.com', // sender address
            to: emailToSend, // list of receivers
            subject: 'nemzsolti vagyok', // Subject line
            text: 'Sorry but there is not enough data in the database with your job to make a viable statistics, please try again later!', // plain text body
        };
    }

    if(data == 'Doesnt exists.') {
        mailOptions = {
            from: 'mezsolt90test@gmail.com', // sender address
            to: emailToSend, // list of receivers
            subject: 'nemzsolti vagyok', // Subject line
            text: 'You cannot use this function if you havent used your email address to give your job details before, use the first email form on the website to give your job details and receive your statistic!', // plain text body
        };
    }

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

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });

    console.log('EmailDataSend.');
}

async function ipSpamCheck(ip) {
    var existAndSpam = false;

    var promise = new Promise(function(resolve, reject) {
        IPSchema.find({}).exec(function (err, doc) {
            var datum = new Date();
            var ipSchemaData = doc;

            var keys = Object.keys(ipSchemaData);

            for (var i = 0; i < ipSchemaData.length; i++) {
                if (ipSchemaData[keys[i]].ip === ip && ((datum - ipSchemaData[keys[i]].date) / 1000 < 2)) {
                    existAndSpam = true;
                    IPSchema.create({
                        _id : new mongoose.Types.ObjectId(),
                        ip : ip,
                        date: Date.now()
                    });
                    console.log('New ip added to database, spam.');
                }
            }
            if (existAndSpam == false) {
                IPSchema.create({
                    _id: new mongoose.Types.ObjectId(),
                    ip: ip,
                    date: Date.now()
                });
                console.log('New ip added to database, not a spam.');
            }
            if (err) {
                reject(err);
            } else {
                resolve('data');
            }
        });
    });

    await promise;

    console.log('IpSpamCheck.');
    return existAndSpam;
}

module.exports.statsFuncStart = statsFuncStart
module.exports.emailDataSend = emailDataSend
module.exports.ipSpamCheck = ipSpamCheck
module.exports.numberOfEntriesInDBforStat = numberOfEntriesInDBforStat


