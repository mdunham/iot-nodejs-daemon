/**
 * LCR API Module
 * 
 * This module contains methods for generating the HEX required to send a message to an LC Meter
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const debuging   = true;
const comms      = require('./comm-port.js');
const ascii      = require('./utils.js');
const request    = require('./lc-request.js');

module.exports = function(device = 'ttyUSB0', node = 250, port = 255) {
	let 
		self = this,
		lcRequest = new request(new comms(device), node, port);

	/**
	 * Issue the Check Status Command a.k.a. GetProductID
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.checkStatus = function(callback) {
		return lcRequest.write([0], (status, data) => {
			let 
				returnCode  = data.substr(0,2),
				productID   = data.substr(2,2),
				productName = hexToString(data.substr(4));

			console.log('LCR Status Check - ' + status + ' Data: ' + data);
			callback(true, productID, productName);
		});
	};
	
	
	
	return this;
}
		
