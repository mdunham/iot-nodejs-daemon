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

device.checkStatus((status, productID, productName) => {
	if (status) {
		console.log('----- STATUS CHECK PASS -----');
		console.log('ProductID: ' + productID + ' - Product Name: ' + productName);
	} else {
		console.log('----- STATUS CHECK FAIL -----');
	}
});

var field = 0;

setTimeout(() => {
	device.getMachineStatus((status, response) => {
		if (status) console.log('Get Machine Status Success!!!!!', response);
		else console.log('Get Machine Status Said FALSE!!');
		
		device.getVersion((status, response) => {
				if (status) console.log('Get Version Success!', response);
				else console.log('GetVersion Said FALSE!!');
			
		
		device.getField(0x11, (status, response) => {
			if (status) console.log('Get Field Success!!!!!', response);
			else console.log('Get Field Said FALSE!!');
			
			device.getField(11, (status, response) => {
				if (status) console.log('Get Field Success!!!!!', response);
				else console.log('Get Field Said FALSE!!');
				
				device.command(0x01, (status, response) => {
					if (status) console.log('Issue command success!!!!!', response);
					else console.log('Issue command FAil!!');
				});
				
			});
		});
	});});
}, 2500);
setTimeout(function(){
device.command(0x01, (status, response) => {
	if (status) console.log('Issue command success!!!!!', response);
	else console.log('Issue command FAil!!');
});}, 1000);