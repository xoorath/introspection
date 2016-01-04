var secret = require('../secret');

var express = require('express');
var router = express.Router();
var expressSession = require('express-session');
var path = require('path');
var favicon = require('static-favicon');
var flash = require('connect-flash');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var gitrev = require('git-rev');
var moment = require('moment');
var git = {};
git.sha = {};

gitrev.short(function(sha) { git.sha.short = sha; });
gitrev.long(function(sha) { git.sha.long = sha; });
gitrev.branch(function(branch) { git.branch = branch; });
gitrev.tag(function(tag) { git.tag = tag; });
gitrev.logobj(function(log) { git.history = log; }, 6);

var isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/');
};

var isNotAuthenticated = function(req, res, next) {
	if (!req.isAuthenticated())
		return next();
	res.redirect('/');
}

var renderParam = function(req, obj) {
	if(req.user)
		obj.user = req.user;
	if(req.path)
		obj.path = req.path;
	var flash = req.flash('message');
	if(flash)
		obj.message = flash;
	obj.git = {};
	obj.git.branch = git.branch;
	obj.git.sha = git.sha;
	obj.git.tag = git.tag;
	obj.git.history = git.history;
	for(var i = 0; i < obj.git.history.length; ++i) {
		obj.git.history[i].author.date.from_now = moment(obj.git.history[i].author.date.date_obj).fromNow();
		obj.git.history[i].committer.date.from_now = moment(obj.git.history[i].committer.date.date_obj).fromNow();
	}
	return obj;
};

module.exports = {
	Setup:function(setup_args) {
		console.log('route.Setup');
		var app = setup_args.app || express();

		// view engine setup
		app.set('views', path.join(__dirname, '../views'));
		app.set('view engine', 'jade');

		app.use(flash());
		app.use(favicon());
		app.use(logger('dev'));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(cookieParser());

		app.use(expressSession({secret: secret.expressSessionSecret || 'yoloswag'}));

		this.app = app;
		return this;
	},

	SetupDynamicRoutes:function() {
		console.log('route.SetupDynamicRoutes');

		var app = this.app;

		router.get('/', function(req, res) {
			console.log('router: /');
			res.render('index', renderParam(req, {}));
		});

		router.get('/signup', isNotAuthenticated, function(req, res) {
			console.log('router: /signup');
			res.render('register', renderParam(req, {}));
		});

		router.get('/login', isNotAuthenticated, function(req, res) {
			console.log('router: /login');
			res.render('login', renderParam(req, {}));
		});

		router.get('/signout', function(req, res) {
			console.log('router: /signout');
			req.logout();
			res.redirect('/');
		});

		// router.get('/home', isAuthenticated, function(req, res) {
		// 	console.log('router: /home');
		// 	res.render('home', renderParam(req, {}));
		// });


		this.app = app;
		return this;
	},

	SetupStaticRoutes:function() {
		console.log('route.SetupStaticRoutes');
		var app = this.app;
		app.use(express.static(path.join(__dirname, '../public/static')));
		return this;
	},

	SetupStyle:function(setup_args) {
		console.log('route.SetupStyle');
		var app = this.app;
		app.use(setup_args.middleware);
		app.use(express.static(setup_args.path));
		console.log('styler set up path: ' + setup_args.path);
		console.log('styler set up middleware?' + (setup_args.middleware != null ? 'y' : 'n'))
		return this;
	},

	SetupPassportRoutes:function() {
		console.log('route.SetupPassportRoutes');
		var passport = require('passport');
		var app = this.app;

		router.post('/login', passport.authenticate('login', {
			successRedirect: '/',
			failureRedirect: '/',
			failureFlash : true
		}));

		router.post('/signup', passport.authenticate('signup', {
			successRedirect: '/',
			failureRedirect: '/signup',
			failureFlash : true
		}));

		app.use('/', router);
		return this;
	},

	SetupErrorRoutes:function() {
		var app = this.app;
		app.use(function(req, res, next) {
			var err = new Error('Not Found');
			err.status = 404;
			next(err);
		});

		if (app.get('env') === 'development') {
			app.use(function(err, req, res, next) {
				res.status(err.status || 500);
				res.render('error', {
					message: err.message,
					error: err
				});
			});
		}
		return this;
	},

	GetApp:function() {
		return this.app;
	}
};
