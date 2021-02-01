const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts')
//var favicon = require('serve-favicon');
const path = require('path');
const PORT = process.env.PORT || 5000;

app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .use(expressLayouts)
    .set('layout', './layouts/default')
    .set('view engine', 'ejs');
    //.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(function(req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.tests === '1';
    next();
});

app.get('/games/asteroids', function(req, res) {
    res.render('pages/games/asteroids', {
        title: 'Pew Pew'
    });
});

app.get('/games/mastermind', function(req, res) {
    res.render('pages/games/mastermind', {
        title: 'Mastermind'
    })
})

app.get('/games', function(req, res) {
    res.render('pages/games', {title: 'Gaemz'});
})

app.get('/', function(req, res) {
    res.render('pages/index', {
        title: 'Hoam',
        pageTestScript: '/qa/tests-index.js'
    });
});

app.get('/contact/help', function(req, res) {
    res.render('pages/contact/help', {
        title: 'HALP'
    });
});

app.get('/contact', function(req, res) {
    res.render('pages/contact', {title: 'Contact'});
});

// custom 404 page
app.use(function(req, res) {
    res.status(404);
    res.render('pages/404', {title: '404 - Page Not Found'});
});
// custom 500 page
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('pages/500', {title: '500 - Service Error'});
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
