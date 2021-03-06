var debug = require('debug')('passport-mongo:server');
var http = require('http');

var useLogin = true;
var useSignup = true;
var useTwitter = false;
var useFacebook = false;
var useGoogle = false;
var features = {};

var port = normalizePort(process.env.PORT || '3000');

features.db = require('./feature/db.js').Setup({
});

features.route = require('./feature/route.js').Setup({});

features.authenticate = require('./feature/authenticate.js').Setup({
	app:         features.route.GetApp(),
	route:       features.route,
	useLogin:    useLogin,
	useSignup:   useSignup,
	useTwitter:  useTwitter,
	useFacebook: useFacebook,
	useGoogle:   useGoogle
});

features.route.SetupStaticRoutes();

features.style = require('./feature/style').Setup({
	route:      features.route,
	debug:      (port === 3000)
});

features.route
	.SetupPassportRoutes()
	.SetupErrorRoutes()
	.SetupDynamicRoutes();

features.wiki = require('./feature/wiki').Setup({
	db: features.db,
	route: features.route,
	authenticate: features.authenticate
});

features.route.GetApp().set('port', port);
var server = http.createServer(features.route.GetApp());

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		return val;
	}

	if (port >= 0) {
		return port;
	}

	return false;
}

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	debug('Listening on ' + bind);
}
