/**
 * Main init script for the Cleveland-LCR Daemon.
 * 
 * useage: ./bin/cl-lcr-cli [start|stop|daemon] [start|stop]
 * useage: ./bin/cl-lcr-cli [register|unregister]
 *     
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const sqlite3 = require('sqlite3');
const lcr = require('./lib/lcr.js');
const ble = require('./lib/ble.js');

let db = new sqlite3.Database('./db/lcr-cl.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the SQLite database.');
});

let device = new lcr('ttyUSB0', 250, 255);
let server = new ble(device);

// TODO: Add sqlite database for collecting data to send over the internet
// TODO: GeoTracking & Security
var field = 0;
setInterval(() => {
	field++;
	lcr.getField(field, (status, response) => {
		if (status) console.log('Get Field Success!!!!!', response);
		else console.log('Get Field Said FALSE!!');
	});
}, 500);