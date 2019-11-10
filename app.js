var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
//var sassMiddleware = require('node-sass-middleware');
var salaryRouter = require('./routes/salaryRoutes');
var indexRouter = require('./routes/index');

var app = express();
//"css": "scss public/scss/testSCSS.scss -t compressed public/stylesheets/styleSCSS.css",

/*
* "css": "node-sass --watch public/scss -o public/css",
    "scss": "node-sass --watch public/scss -o public/css",
    "prestart": "npm run css && npm run javascripts",
* */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({limit: '50mb','extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json({limit: '50mb'}));                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
/*app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));*/
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/salary', salaryRouter);

module.exports = app;
