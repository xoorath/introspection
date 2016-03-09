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
var db = require("./db.js");
var wiki = require('./wiki.js');
var pagedown = require("pagedown");
var md = new pagedown.Converter();

var gitrev = require('git-rev');
var moment = require('moment');
var git = {};
git.sha = {};
var wikimodel = db.GetWikiModel();

gitrev.short(function(sha) { git.sha.short = sha; });
gitrev.long(function(sha) { git.sha.long = sha; });
gitrev.branch(function(branch) { git.branch = branch; });
gitrev.tag(function(tag) { git.tag = tag; });
gitrev.logobj(function(log) { git.history = log; }, 3);

var isAuthenticated = function (req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash("message", {style:"alert-danger", msg:"you need to be logged in to do that"});
    res.redirect('/');
  }
  if(req.user == null || req.user.valid != true) {
    req.flash("message", {style:"alert-danger", msg:"invalid account"});
    res.redirect('/');
  }
  return next();
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
  if(req.flash) {
    var flash = req.flash('message');
    if(flash)
      obj.message = flash;
  }
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

    router.get('/digital', function(req, res) {
      console.log('router: /digital');
      res.render('digital', renderParam(req, {}));
    });

    router.get('/mechanical', function(req, res) {
      console.log('router: /mechanical');
      res.render('mechanical', renderParam(req, {}));
    });

    router.get('/bizzare', function(req, res) {
      console.log('router: /bizzare');
      res.render('bizzare', renderParam(req, {}));
    });

    function EditWiki(req, res, next, wikipath, wiki) {
      res.render('editwiki', renderParam(req, {wikipath:wikipath, wiki:wiki}));
    }

    function GetWiki(req, res, next) {
      console.log('router: /wiki');
      var root = '/' + (req.params.entry || '');
      var sub = req.params[0] || '';
      var wikipath = root;
      console.log(root, sub);
      if(sub !== null) {
        wikipath += sub;
      }

  
      wikimodel.findOne({
        'path':wikipath
      }, 
      function(err, wiki) {
        if(!err && !wiki) {
          if(req.isAuthenticated()) {
            EditWiki(req, res, next, wikipath, null);
            return;
          } else {
            var err = new Error('Page not found: ' + root + sub);
            err.status = 404;
            next(err);
            return;
          }
        }

        if(req.isAuthenticated()){
          EditWiki(req, res, next, wikipath, wiki);
        }
        if(err != null) {
          res.status(err.status || 500);
          res.render('error', renderParam(req, {
            message: err.message,
            error: err
          }));
        }
        else if(wiki != null) {
          res.render('wiki', renderParam(req, {wikipath:wikipath, wiki:wiki, md:md}));
        }
        else {
          var err = new Error('Page not found');
          err.status = 404;
          next(err);
        }
      });
    }

    router.get('/wiki', GetWiki);
    router.get('/wiki/:entry*', GetWiki);

    //router.get('/signup', isNotAuthenticated, function(req, res) {
      //console.log('router: /signup');
      //res.render('register', renderParam(req, {}));
    //});

    router.get('/login', isNotAuthenticated, function(req, res) {
      console.log('router: /login');
      res.render('login', renderParam(req, {}));
    });

    router.get('/signout', function(req, res) {
      console.log('router: /signout');
      req.logout();
      res.redirect('/');
    });

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
      successRedirect: '/wiki',
      failureRedirect: '/login',
      failureFlash : true
    }));

    //router.post('/signup', passport.authenticate('signup', {
      //successRedirect: '/wiki',
      //failureRedirect: '/signup',
      //failureFlash : true
    //}));

    router.post('/editwiki', function(req, res, next) {
      console.log('trying to edit wiki');
      if (req.isAuthenticated())
        return next();
      console.log('edit wiki failed');
      req.flash("message", {style:"alert-danger", msg:"you need to be signed in to do that"});
      res.redirect('/');
    }, function (req, res) {
      console.log('editwiki');

      var TryGetRequireParam = function(req, res, name, required) {
        var param = req.param(name, null);
        if(param == null || (required && param == "")) {
          req.flash("message", {style:"alert-danger", msg:"no " + name + " param passed"});
          res.redirect("/");
          return null;
        }
        return param;
      }

      var TryGetOptionalParam = function(req, res, name) {
        var param = req.param(name, null);
        if(param == null)
          param = '';
        return param;
      }
      
      var wikipath = TryGetRequireParam(req, res, 'wikipath', true);
      if(!wikipath)
        return console.error('no wiki path');

      var title = TryGetRequireParam(req, res, 'title', true);
      if(!title)
        return console.error('no wiki title');

      var subtitle = TryGetOptionalParam(req, res, 'subtitle');
      
      var content = TryGetRequireParam(req, res, 'content', true);
      if(!content)
        return console.error('no wiki content');

      var imgmain = TryGetOptionalParam(req, res, 'imgmain');
      var darkband = TryGetOptionalParam(req, res, 'darkband');

      console.log('imgmain: ', imgmain);
      console.log('darkband: ', darkband);

      var date = new Date().toJSON().slice(0,10);
      var author = req.user.displayname;

      wiki.Update(wikipath, {
        author:author,
        title:title,
        subtitle:subtitle,
        content:content,
        imgmain: imgmain,
        darkband:darkband,
        style:'default',
        date: date,
        success:function() {
          req.flash("message", {style:"alert-success", msg:("Wiki updated.")});
          res.redirect('/wiki'+wikipath);
        },
        failure:function(err) {
          req.flash("message", {style:"alert-danger", msg:("updating this wiki page failed. err:"+err)});
          res.redirect('/wiki'+wikipath);
        }
      });
    });

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
        res.render('error', renderParam(req, {
          message: err.message,
          error: err
        }));
      });
    }
    return this;
  },

  GetApp:function() {
    return this.app;
  }
};
