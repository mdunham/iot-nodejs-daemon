/**
 * Main init script for the Cleveland-LCR Daemon.
 * 
 * useage: ./bin/cl-lcr-cli [start|stop|daemon] [start|stop]
 * useage: ./bin/cl-lcr-cli [register|unregister]
 *     
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const lcr = require('./lib/lcr.js');
const ble = require('./lib/ble.js');
const os = require('os');
const device = new lcr.device('ttyUSB0', 250, 255);
const server = new ble(device);
	
device.init();