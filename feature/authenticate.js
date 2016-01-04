var secret = require('../secret');

var passport = require('passport');
var passportLocal = require('passport-local').Strategy;
var passportTwitter = require('passport-twitter').Strategy;
var passportFacebook = require('passport-facebook').Strategy;
var passportGoogle = require('passport-google-oauth').OAuth2Strategy;

var bCrypt = require('bcrypt-nodejs');

var db = require('./db');

var GetIsValidPassword = function(user, password){
	return bCrypt.compareSync(password, user.password);
}

var CreateHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

var SaveUser = function(newUser, done) {
	newUser.save(function(err) {
		if (err) {
			console.log('Error in Saving user: '+err);
			throw err;
		}
		console.log('User Registration succesful');
		return done(null, newUser);
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Twitter
var FindOrCreateTwitterUser = function(setupArgs, token, tokenSecret, profile, done) {
	var userModel = setupArgs.userModel;

	if(!userModel)
		return console.log("cannot setup twitter authentication. user model does not exist.");

	var AppendUserDetails = function(user, profile) {
		var changed = false;
		 if(user.displayname == null) {
		 	user.displayname = profile.displayName; changed = true;
		 }
		 if(user.twitterId == null) {
		 	user.twitterId = profile.id; changed = true;
		 }
		 return changed;
	};

	userModel.findOne({
		'twitterId':profile.id
	}, 
	function(err, user) {
		if(err != undefined) {
			return done(err, user);
		}
		if(user != null) {
			if(AppendUserDetails(user, profile)) {
				return SaveUser(user, done);
			} 
			else {
				return done(null, user);
			}
		}
		var newUser = new userModel();
		AppendUserDetails(newUser, profile);
		return SaveUser(newUser, done);
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Facebook
var FindOrCreateFacebookUser = function(setupArgs, token, tokenSecret, profile, done) {
	var userModel = setupArgs.userModel;

	if(!userModel)
		return console.log("cannot setup facebook authentication. user model does not exist.");

	var AppendUserDetails = function(user, profile, token) {
		var changed = false;
		if(user.displayname == null) {
			user.displayname = profile.displayName; changed = true;
		}
		if(user.facebookId == null) {
			user.facebookId = profile.id; changed = true;
		}
		if(user.facebookToken != token) {
			user.facebookToken = token; changed = true;
		}
		if(user.email == null && profile.emails != null) {
			user.email = []; changed = true;
			if(profile.emails != null) {
				for(var i = 0; i < profile.emails.length; ++i) {
					user.email.push(profile.emails[i].value);
				}
			}
		}
		return changed;
	};

	process.nextTick(function() {
		userModel.findOne({
			'facebookId':profile.id
		}, 
		function(err, user) {
			if(err != undefined) {
				return done(err, user);
			}
			if(user != null) {
				if(AppendUserDetails(user, profile, token))
				{
					return SaveUser(user, done);
				}
				else
				{
					return done(null, user);
				}
			}

			var newUser = new userModel();
			AppendUserDetails(newUser, profile, token);
			return SaveUser(newUser, done);
		});
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Google
var FindOrCreateGoogleUser = function(setupArgs, token, tokenSecret, profile, done) {
	var userModel = setupArgs.userModel;

	if(!userModel)
		return console.log("cannot setup google authentication. user model does not exist.");

	var AppendUserDetails = function(user, profile) {
		var changed = false;
		 if(user.displayname == null) {
		 	user.displayname = profile.displayName; changed = true;
		 }
		 if(user.googleId == null) {
		 	user.googleId = profile.id; changed = true;
		 }
		 if(user.firstName == null && profile.name.givenName != null) {
		 	user.firstName = profile.name.givenName; changed = true;
		 }
		 if(user.lastName == null && profile.name.familyName != null) {
		 	user.lastName = profile.name.familyName; changed = true;
		 }
		 return changed;
	};

	process.nextTick(function(){
		userModel.findOne({
			'googleId':profile.id
		}, 
		function(err, user) {
			if(err != undefined)
				return done(err, user);

			if(user != null)
			{
				if(AppendUserDetails(user, profile))
				{
					return SaveUser(user, done);
				}
				else
				{
					return done(null, user);
				}
			}

			var newUser = new userModel();
			AppendUserDetails(newUser, profile);
			return SaveUser(newUser, done);
		});
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Login
var FindLoginUser = function (setupArgs, req, username, password, done) {
	var userModel = setupArgs.userModel;

	if(!userModel)
		return console.log("cannot setup login authentication. user model does not exist.");

	userModel.findOne({ 
		'username' :  username 
	},
	function(err, user) {
		if (err)
			return done(err);
		
		if (!user) 
			return done(null, false, req.flash('message', 'User Not found.'));

		if (!GetIsValidPassword(user, password))
			return done(null, false, req.flash('message', 'Invalid Password'));

		return done(null, user);
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Signup
var FindOrCreateSignupUser = function(setupArgs, req, username, password, done) {
	var userModel = setupArgs.userModel;

	if(!userModel)
		return console.log("cannot setup signup authentication. user model does not exist.");

	process.nextTick( function() {
		userModel.findOne(
		{ 
			'username' :  username 
		}, 
		function(err, user) {
			if (err)
				return done(err);

			var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
			if(!re.test(password))
				return done(null, false, req.flash('message','Password length must be longer than 6, and contain one number, one uppercase and one lowercase letter.'));
			else if (user)
				return done(null, false, req.flash('message','Username is taken'));
			else {
				var newUser = new userModel();

				newUser.username = username;
				newUser.displayname = username;
				newUser.password = CreateHash(password);
				newUser.email = req.param('email');

				return SaveUser(newUser, done);
			}
		});
	});
};

module.exports = {
	Setup:function(setupArgs) {
		console.log('authenticate.Setup');

		var app = setupArgs.app;
		var route = setupArgs.route;
		var useLogin = setupArgs.useLogin;
		var useSignup = setupArgs.useSignup;
		var useTwitter = setupArgs.useTwitter;
		var useFacebook = setupArgs.useFacebook;
		var useGoogle = setupArgs.useGoogle;

		var userModel = db.GetUserModel();
		// Configuring Passport
		
		app.use(passport.initialize());
		app.use(passport.session());

		passport.serializeUser(function(user, done) {
			done(null, user._id);
		});

		passport.deserializeUser(function(id, done) {
			userModel.findById(id, function(err, user) {
				done(err, user);
			});
		});

		if(useLogin) {
			var setupArgs = { userModel:userModel };

			passport.use('login', new passportLocal({
				passReqToCallback : true
			},
			function(req, username, password, done) {
				return FindLoginUser(setupArgs, req, username, password, done);
			}));
		}

		if(useSignup) {
			var setupArgs = { userModel:userModel };

			passport.use('signup', new passportLocal({
				passReqToCallback : true
			}, 
			function(req, username, password, done) {
				return FindOrCreateSignupUser(setupArgs, req, username, password, done);
			}));
		}

		if(useTwitter) {
			var setupArgs = { userModel:userModel };

			passport.use(new passportTwitter({
				consumerKey:    secret.twitter.consumerKey,
				consumerSecret: secret.twitter.consumerSecret,
				callbackURL:    secret.twitter.callback
			},
			function(token, tokenSecret, profile, done) {
				return FindOrCreateTwitterUser(setupArgs, token, tokenSecret, profile, done);
			}));

			if(userModel)
				route.RouteTwitter();
		}

		if(useFacebook) {
			var setupArgs = { userModel:userModel };

			passport.use(new passportFacebook({
				clientID:     secret.facebook.appId,
				clientSecret: secret.facebook.appSecret,
				callbackURL:  secret.facebook.callback
			},
			function(token, tokenSecret, profile, done) {
				return FindOrCreateFacebookUser(setupArgs, token, tokenSecret, profile, done);
			}));

			if(userModel)
				route.RouteFacebook();
		}

		if(useGoogle) {
			var setupArgs = { userModel:userModel };

			passport.use(new passportGoogle({
				clientID:    secret.google.cliendId,
				clientSecret: secret.google.clientSecret,
				callbackURL:    secret.google.callback
			},
			function(token, tokenSecret, profile, done) {
				return FindOrCreateGoogleUser(setupArgs, token, tokenSecret, profile, done);
			}));

			if(userModel)
				route.RouteGoogle();
		}
	}
};