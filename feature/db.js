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
			valid: Boolean,
			username: String,
			displayname: String,
			password: String,
			email: String
		});
		this.user_model = model;
		return model;
	},
	GetWikiModel:function(){
		var model = this.wiki_model || mongoose.model('Wiki', {
			path: String,
			title: String,
			subtitle: String,
			content: String,
			style: String,
			imgmain: String,
			darkband: String,
			author: String,
			date: String
		});
		this.wiki_model = model;
		return model;
	}
};

module.exports = db;