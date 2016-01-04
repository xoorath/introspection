var secret = require('../secret');
var mongoose = require('mongoose');
var db = {};

var dbOnConnect = function(ref) {
	console.log('connected to database.');
}

var dbOnError = function(err) {
	if(err) {
		console.log('db error: ', err);
	}
}

db = {
	Setup:function(setup_args) {
		console.log('db.Setup');
		mongoose.connection.on('open', dbOnConnect);
		mongoose.connection.on('error', dbOnError);
		mongoose.connect(secret.mongo.url, dbOnError);

	},
	GetUserModel:function(){
		var model = this.user_model || mongoose.model('User', {
			username: String,
			displayname: String,
			password: String,
			twitterId: String,
			facebookId: String,
			googleId: String,
			facebookToken: String,
			email: [String],
			gender: String,
			address: [String],
			firstName: String,
			lastName: String,
			admin: Boolean
		});
		this.user_model = model;
		return model;
	}
};

module.exports = db;