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

if (!Config.shopify.enabled || !Config.database.enabled) {
	console.error("You must have both Shopify and MongoDB enabled to run data polling.");
} else {
	if (Config.network.httpsEnabled) {
		https.createServer({key: Config.network.key, cert: Config.network.cert}, app).listen(Config.network.port);
	} else {
		http.createServer(app).listen(Config.network.port);
	}
	if (Config.shopify.shops) {
		for (var i = 0; i < Config.shopify.shops.length; i++) {
			var indShop = new Shopify({
				shopName: Config.shopify.otherShops[i]['shopName'],
				apiKey: Config.shopify.otherShops[i]['apiKey'],
				password: Config.shopify.otherShops[i]['password']
			});
			var ShopifyHandler = require('./shopify.js')(indShop);
			ShopifyHandlers.push(ShopifyHandler);
		}
	}
	const MongoHandlers = require('./mongo.js');

}