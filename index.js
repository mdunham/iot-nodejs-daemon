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
	// Local SQLite Database
	db = new sqlite3.Database('./db/lcr-cl.db', (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the SQLite database.');
	}),
			
	fieldParams = {},
		
	// LCR Device API
	device = new lcr.device('ttyUSB0', 250, 255),
	
	// Mobile App Bluetooth Peripherial Service
	server = new ble(device),
		
	// Tell the LCR to connect loopable
	runConnect = (count) => {
		device.connect((status) => {
			if ( ! status) {
				console.log('######## COMM ERROR ########');
				console.log('# UNABLE TO CONNECT TO LCR #');
				console.log('######  ATTEMPTS ' + count + '  ######');
				setTimeout(runConnect.bind(null, ++count), 2500);
			} else {
				console.log('###### LCR CONNECTED ######');
				for (var block = 0; block < 200; block++) {
					for (var param = 0; param < 3; param++) {
						if (param === 0) fieldParams[block] = {};
						setTimeout(function(){
							device.getFieldParams(param, block, (status, paramData) => {
								
								//if (status) fieldParams[block][param] = paramData
							});
							if (block === 199 && param == 2) {
								device.setField(37, 1, (status, deviceByte) => {
									device.removeTransaction((rc) => console.log('inir lcr', status, rc, deviceByte));
								});
							}
						}, 150 * (block + param));
					}
				}
				
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

