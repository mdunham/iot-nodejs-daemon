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
const os = require('os');

var 
	// Local SQLite Database
	db = new sqlite3.Database('./db/lcr-cl.db', (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the SQLite database.');
	}),
	// Device Endianess
	endian = console.log('Endian Type: ' + (endian = os.endianness())) || endian,
		
	// LCR Device API
	device = new lcr.device('ttyUSB0', 250, 255),
	
	// Mobile App Bluetooth Peripherial Service
	server = new ble(device),
	
	rcIntH,
	fieldParams = {},
	
	// Tell the LCR to connect loopable
	runConnect = (count) => {
		device.connect((status) => {
			if ( ! status) {
				console.log('# NO LCR CONNECTED #');
				clearInterval(rcIntH);
				setTimeout(runConnect.bind(null, ++count), 2500);
			} else {
				console.log('# LCR CONNECTED #');
				clearInterval(rcIntH);
				rcIntH = setInterval(() => {
					// Check for the LCR meter connection
					if ( ! device.isConnected()) {
						console.log('# LCR LOST CONNECTION #');
						clearInterval(rcIntH);
						runConnect(1);
					}
				}, 5000);
				device.checkStatus(function(status, productID, productName){
					console.log(productName);
					device.setField(0x25, [0x02], (status, deviceByte) => {
						device.removeTransaction(() => { 
							device.setField(0x10, [0x00], function(status, deviceByte, data) {
								device.setField(0x5D, [0x00, 0x00, 0x00, 0x00], function(status, deviceByte, data) {});
								setTimeout(device.pulseStatus, 1000);
							});
						});
					});
				});
			}
		});
	};

// Check for the LCR meter connection
if ( ! device.isConnected()) {
	runConnect(1);
}

