/**
 * LCR API Module
 * 
 * This module contains methods for generating the HEX required to send a message to an LC Meter
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

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
		let _call = callback;

		return lcRequest.issue([0], (status, response) => {
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				productID   = data.substr(2,2),
				productName = ascii.hexToString(data.substr(4));

			console.log('LCR Status Check - ' + status + ' Data: ' + data);
			_call(true, productID, productName);
		});
	};
	
	/**
	 * Issue the Check Status Command a.k.a. GetProductID
	 * 
	 * @param {int} fieldNum 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getField = function(fieldNum, callback) {
		let _call = callback;

		return lcRequest.issue([0x20, 50], (status, response) => {
			if ( ! status) {
				console.log('Error getField: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceByte  = data.substr(2,2),
				fieldValue  = ascii.hexToString(data.substr(4));

			console.log('LCR Get Field - ' + fieldNum + ' Data: ' + data);
			_call(true, deviceByte, fieldValue);
		});
	};
	
	/**
	 * Issue a Command
	 * 
	 * @param {int} command 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.command = function(command, callback) {
		let _call = callback;

		return lcRequest.issue([0x24, command], (status, response) => {
			if ( ! status) {
				console.log('Error getField: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceByte  = data.substr(2,2);

			console.log('LCR Issued Command Response:', returnCode, deviceByte);
			_call(true, returnCode, deviceByte);
		});
	};
	
	/**
	 * Issue the Check Status Command a.k.a. GetProductID
	 * 
	 * @param {int} fieldNum 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getMachineStatus = function(callback) {
		let _call = callback;

		return lcRequest.issue([0x23], (status, response) => {
			if ( ! status) {
				console.log('Error getMachineStatus: ' + response.message);
				return false;
			}
			
			let 
				data          = response.data,
				returnCode    = data.substr(0,2),
				deviceStat    = data.substr(2,2),
				printerStat   = data.substr(4,2),
				deliveryStat  = data.substr(6,4),
				deliveryCode  = data.substr(10,4);

			console.log('LCR Machine Status - ', deviceStat, printerStat, deliveryStat, deliveryCode);
			_call(true, {
				returnCode: returnCode,
				deviceStat: deviceStat,
				printerStat: printerStat,
				deliveryStat: deliveryStat,
				deliveryCode: deliveryCode
			});
		});
	};
	
	/**
	 * Get the LCR Meter Board Version
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getVersion = function(callback) {
		let _call = callback;

		return lcRequest.issue([0x26], (status, response) => {
			if ( ! status) {
				console.log('Error getVersion: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceState = data.substr(2,2),
				version     = data.substr(4,2);

			console.log('LCR Version - ', returnCode, deviceState, version);
			_call(true, {
				returnCode: returnCode,
				deviceSta: deviceState,
				version: version
			});
		});
	};
	
	return self;
};
		
