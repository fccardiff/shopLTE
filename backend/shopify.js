// shopify.js
// Shopify API connections and polling.
var moment = require('moment');
module.exports = function(shopify, apiKey, shopURL, password, tag, collection) {
	// Polled orders will be stored in RAM.
	var CURRENT_ORDERS = [];
	var CURRENT_IDS = [];
	var TOTAL_REVENUE = 0;
	var TOTAL_SESSIONS = 0;
	var TOTAL_ORDERS = 0;
	var TOTAL_UNITS = 0;
	var TOTAL_BOUNCES = 0;
	module.makeAdminRequest = function(url, method, done) {
		// Override shopify-api-node for custom requests
		request({
			method: method.toUpperCase() || 'GET',
			url: 'https://' + encodeURIComponent(apiKey) + ':' + encodeURIComponent(password) + '@' + shopURL + url,
			headers: {
				'Content-Type': 'application/json',
				'Host': shopURL
			}
		}, function(err, response, body) {
			if (err) {
				console.error(err);
				done(err);
			} else {
				if (body) {
					body = JSON.parse(body);
					done(body);
				} else {
					console.error('No data retrieved!');
					done([]);
				}
			}
		})
	}

	module.getTotals = function(done) {
		// return total dollar cost of all orders, total units, sessions, bounces, conv rate
		done({revenue: TOTAL_REVENUE, units: TOTAL_UNITS, orders: TOTAL_ORDERS, sessions: TOTAL_SESSIONS, bounces: TOTAL_BOUNCES});
	}

	module.pollOrders = function() {
		// poll for new shopify orders
		shopify.orders.list({created_at_min: moment().startOf('day').toISOString()}).then(function(orders) {
			for (var order in orders) {
				if (CURRENT_IDS.indexOf(orders[order]['id']) < 0) {
					CURRENT_IDS.push(orders[order]['id']);
					CURRENT_ORDERS.push(orders[order]);
					module.storeOrder(orders[order]);
					TOTAL_ORDERS += 1;
					for (var i = 0; i < orders[order]['line_items'].length; i++) {
						TOTAL_UNITS += orders[order]['line_items'][i]['quantity'];
						TOTAL_REVENUE += orders[order]['line_items'][i]['price'];
					}
				}
			}
			console.log('[Orders poll for ' + shopURL + ' complete.]');
		});
	}

	module.pollTraffic = function() {
		// poll for updated store traffic
		shopify.graphql('SHOW total_sessions FROM visits SINCE -1d').then(function(err, customers) {
			if (err) console.error(err);
			console.log(JSON.stringify(customers))
			console.log('[Traffic poll for ' + shopURL + ' complete.]');
			// add to sessions, bounces
		});
	}

	module.storeOrder = function(order) {
		// store order to mongodb instance
		if (tag) {
			order['tag'] = tag;
		}
		collection.insert(order);
	}

	setInterval(function() {
		console.log('[Polling orders for store ' + shopURL + '...]');
		module.pollOrders();
		console.log('[Polling traffic for store ' + shopURL + '...]');
		module.pollTraffic();
	}, 1000 * 30);

	return module;
}