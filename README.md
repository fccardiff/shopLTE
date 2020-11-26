# ShopLTE

A fork of ColorLib's AdminLTE, with an eCommerce focus. Integrates with MongoDB and Shopify (with multi-store support) to frequently poll your orders, and update them onto a live dashboard.

This project is especially helpful for those with multiple, tinier niche sites, where orders and profits can be difficult to track.

# Installation

To install, you'll need 3 things:
- A Shopify store with admin credentials (a guide to setting that up is here: https://shopify.dev/tutorials/authenticate-a-private-app-with-shopify-admin)
- A MongoDB instance
- A web server to run the backend polling

## Secondary Store Setup

If you would like to poll other shops, awesome! The setup for that is fairly simple as well.

In the config.json file, find the array "shops" in the "shopify" section. Then, simply append the following for every shop you'd like to poll (with API keys for each):
```
{
	"shopName": "YOUR_STORE_NAME",
	"apiKey": "YOUR_SHOPIFY_KEY",
	"password": "YOUR_SHOPIFY_PASSWORD",
	"tag": "Store1"
}
```
Note: The "tag" field is optional. With it, you can store tags based on which store generated the order - helpful for multi-store setups and database queries.

# Additional Features

## Notifiers

You can enable notifiers by editing the config.

### Sound

A sound can be played whenever your orders update. Similar to a sales notification in a mobile app, you can select which sound you'd like. Personally I use a cash register sound.

To enable this, simply set soundEnabled to true in the notifiers section, and set soundURL to a publicly accessible media URL.

# Notes

This project is a hobby project and as such I'm not taking feature requests for the open source platform.

If, however, you're interested in custom additions, feel free to contact me at finn [at] fccardiff.com.