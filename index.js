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

let 
	db = new sqlite3.Database('./db/lcr-cl.db', (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the SQLite database.');
	}),
	device = new lcr.device('ttyUSB0', 250, 255),
	server = new ble(device),
	runConnect = (count) => {
		device.connect((status) => {
			if ( ! status) {
				console.log('######## COMM ERROR ########');
				console.log('# UNABLE TO CONNECT TO LCR #');
				console.log('######  ATTEMPTS ' + count + '  ######');
				setTimeout(runConnect.bind(null, ++count), 2500);
			} else {
				console.log('###### LCR CONNECTED ######');
			}
		});
	};

// Check for the LCR meter connection
if (device.isConnected()) {
	console.log('------ LCR Already Connected ------');
} else {
	// Keep trying to connect until it's found
	runConnect(1);
}

