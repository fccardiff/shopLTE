// app.js
var express = require('express');
var async = require('async');
var request = require('request');
var fs = require('fs');
var http = require('http');
var https = require('https');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
var moment = require('moment');
const Config = require('../data/config.json');
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.set('view engine', 'mustache');
app.engine('html', Handlebars.__express);
app.engine('mustache', Handlebars.__express);
app.set('views', '../frontend');

var CURR_UNITS = 0;
var CURR_ORDERS = 0;
var CURR_TOTAL = 0;
var AVG_CONV = 0;
var TOTAL_SESSIONS = 0;
var TOTAL_BOUNCED = 0;

if (!Config.shopify.enabled || !Config.database.enabled) {
	console.error("You must have both Shopify and MongoDB enabled to run data polling.");
} else {
	if (Config.network.httpsEnabled) {
		// HTTPS is enabled, get key and cert for https server
		https.createServer({key: Config.network.key, cert: Config.network.cert}, app).listen(Config.network.port);
	} else {
		// Fallback to HTTP
		http.createServer(app).listen(Config.network.port);
	}
	MongoClient.connect(Config.database.mongoURL, function(err, db) {
		if (err) console.error(err);
		db = db.db(Config.database.databaseName);
		const ORDERS = db.collection(Config.database.databaseCollection);
		const Routes = require('./routes.js')(app);
		if (Config.shopify.shops) {
			// Iterate through shops to poll each on a scheduler
			for (var i = 0; i < Config.shopify.shops.length; i++) {
				var indShop = new Shopify({
					shopName: Config.shopify.shops[i]['shopName'],
					apiKey: Config.shopify.shops[i]['apiKey'],
					password: Config.shopify.shops[i]['password']
				});
				var ShopifyHandler = require('./shopify.js')(indShop, Config.shopify.shops[i]['apiKey'], Config.shopify.shops[i]['shopName'] + '.myshopify.com', Config.shopify.shops[i]['password'], Config.shopify.shops[i]['tag'], ORDERS);
				ShopifyHandlers.push(ShopifyHandler);
			}
		}
		setInterval(function() {
			// Poll all shops' totals to update dashboard
			var total = 0;
			var units = 0;
			var sessions = 0;
			var bounces = 0;
			for (var i = 0; i < ShopifyHandlers.length; i++) {
				var totalData = ShopifyHandlers[i].getTotal();
				total += totalData['revenue'];
				units += totalData['units'];
				orders += totalData['orders'];
				sessions += totalData['sessions'];
				bounces += totalData['bounces'];
			}
			CURR_TOTAL = total;
			CURR_ORDERS = units;
			TOTAL_SESSIONS = sessions;
			TOTAL_BOUNCED = bounces;
			AVG_CONV = (units / TOTAL_SESSIONS);
			AVG_CONV = AVG_CONV.toFixed(2);
			AVG_CONV = parseFloat(AVG_CONV);
		}, 1000 * 60);

		function formatBigNumbers(val) {
			if (!isNaN(parseFloat(val))) {
				val = parseFloat(val);
				if ((val / 1000000) > 1) {
					val = (val / 1000000);
					val = val.toFixed(2);
					val = val + 'M';
				} else if ((val / 1000) > 1) {
					val = (val / 1000);
					val = val.toFixed(2);
					val = val + 'K';
				}
			}
		}

		function formatBigTotal(val) {
			val = '$' + formatBigNumbers(val);
		}

		app.get('/', function(req, res) {
			res.render('index.html', {units: formatBigNumbers(CURR_UNITS), orders: formatBigNumbers(CURR_ORDERS), total: formatBigTotal(CURR_TOTAL), sessions: formatBigNumbers(TOTAL_SESSIONS), bounces: formatBigNumbers(TOTAL_BOUNCED), conversion: AVG_CONV});
		});

		app.get('/totals', function(req, res) {
			// Send data to client for polling
			res.send({units: formatBigNumbers(CURR_UNITS), orders: formatBigNumbers(CURR_ORDERS), total: formatBigTotal(CURR_TOTAL), sessions: formatBigNumbers(TOTAL_SESSIONS), bounces: formatBigNumbers(TOTAL_BOUNCED), conversion: AVG_CONV});
		});
	});
}