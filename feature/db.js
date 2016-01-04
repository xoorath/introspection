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
			email: String
		});
		this.user_model = model;
		return model;
	},
	GetActivityModel:function(){
		var model = this.activity_model || mongoose.model('Activity', {
			AuthorId: String,
			AuthorTime: String,
			ActivityTime: String,
			ActivityDuration: String,
			ActivityPoints: String,
			ActivityTitle: String,
			ActivitySubtitle: String,
			ActivityText: String,
		});
		this.activity_model = model;
		return model;
	}
};

module.exports = db;