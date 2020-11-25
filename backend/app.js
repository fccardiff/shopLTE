// app.js
const Config = require('../data/config.json');

if (!Config.shopify.enabled || !Config.database.enabled) {
	console.error("You must have both Shopify and MongoDB enabled to run data polling.");
} else {
	// begin server
}