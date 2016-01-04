var path = require('path');
var stylus = require('stylus');
var nib = require('nib');

var compile = function(str, path) {
	return stylus(str)
		.set('filename', path)
		.set('compress', true)
		.use(nib())
		.import('nib');
};

module.exports = {
	Setup:function(setup_args) {
		console.log('style.Setup');
		var route = setup_args.route;
		var debug = setup_args.debug || false;

		route.SetupStyle({
			path: path.join(__dirname, '../public/stylus'),
			middleware: stylus.middleware({
				src: "stylus/",
				dest: "public/stylus/",
				compile: compile,
				debug: debug,
				force: false
			})
		})
	}
};
