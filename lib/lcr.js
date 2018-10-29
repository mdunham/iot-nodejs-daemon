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
const lcFlags    = require('./lc-flags.js');

module.exports.lcFlags = lcFlags;

module.exports.device = function(device = 'ttyUSB0', node = 250, port = 255) {
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

		return lcRequest.issue([lcFlags.lcrMethods.GET_PRODUCT_ID], (status, response) => {
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				productID   = data.substr(2,2),
				productName = ascii.hexToString(data.substr(4));

			console.log('LCR Status Check - ' + returnCode + ' Data: ' + data);
			_call(status, productID, productName);
		});
	};
	
	/**
	 * Check on the last request used after the meter retruns a busy status.
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.checkRequest = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.CHECK_LAST_REQUEST], (status, response) => {
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				dataOutput   = data.substr(2);

			console.log('LCR Check Request - ' + returnCode + ' - Data: ', dataOutput);
			_call(status, returnCode, dataOutput);
		});
	};
	
	/**
	 * Abort previous request
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.abortRequest = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.ABORT_REQUEST], (status, response) => {
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				dataOutput   = data.substr(2);

			console.log('LCR Abort Request - ' + returnCode + ' - Data: ', dataOutput);
			_call(status, returnCode, dataOutput);
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

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD, fieldNum], (status, response) => {
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
			_call(status, deviceByte, fieldValue);
		});
	};
	
	/**
	 * Set the baud for the serial comms with the LCR meter
	 * 
	 * @param {int} baud
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.setBaud = function(baud, callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.SET_BAUD, baud], (status, response) => {
			if ( ! status) {
				console.log('Error setBaud: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceByte  = data.substr(2,2);

			console.log('LCR Set Baud - ' + returnCode + ' Data: ' + data);
			_call(status, returnCode, deviceByte);
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

		return lcRequest.issue([lcFlags.lcrMethods.ISSUE_COMMAND, command], (status, response) => {
			if ( ! status) {
				console.log('Error getField: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceByte  = data.substr(2,2);

			console.log('LCR Issued Command Response:', returnCode, deviceByte);
			_call(status, returnCode, deviceByte);
		});
	};
	
	/**
	 * Issue the activate pump and print method
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.activatePumpPrint = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.START_PAUSE_DELIVERY, command], (status, response) => {
			if ( ! status) {
				console.log('Error getField: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2);

			console.log('LCR Activate Pump and Print:', returnCode);
			_call(status, returnCode);
		});
	};
	
	/**
	 * Issue the Check Status Command a.k.a. GetProductID
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getMachineStatus = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.MACHINE_STATUS], (status, response) => {
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
			_call(status, {
				returnCode: returnCode,
				deviceStat: deviceStat,
				printerStat: printerStat,
				deliveryStat: deliveryStat,
				deliveryCode: deliveryCode
			});
		});
	};
	
	/**
	 * Get the current delivery status of the LCR
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getDeliveryStatus = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.DELIVERY_STATUS], (status, response) => {
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
			_call(status, {
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

		return lcRequest.issue([lcFlags.lcrMethods.GET_VERSION], (status, response) => {
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
			_call(status, {
				returnCode: returnCode,
				deviceSta: deviceState,
				version: version
			});
		});
	};
	
	/**
	 * Get the meters security level
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getSecurity = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_SECURITY], (status, response) => {
			if ( ! status) {
				console.log('Error getVersion: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceState = data.substr(2,2),
				security    = data.substr(4);

			console.log('LCR Security - ', returnCode, deviceState, version);
			_call(status, {
				returnCode: returnCode,
				deviceSta: deviceState,
				security: security
			});
		});
	};
	
	/**
	 * Get data information about all data fields available in the LCR
	 *  
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getFieldParams = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD_PARAMS], (status, response) => {
			if ( ! status) {
				console.log('Error getVersion: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceState = data.substr(2,2),
				paramData   = data.substr(4);

			console.log('LCR Get Field Params - ', returnCode, deviceState);
			_call(status, {
				returnCode: returnCode,
				deviceSta: deviceState,
				param: paramData
			});
		});
	};
	
	/**
	 * Get data information about all data fields available in the LCR
	 *  
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getFieldParams2 = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD_PARAMS2], (status, response) => {
			if ( ! status) {
				console.log('Error getVersion: ' + response.message);
				return false;
			}
			
			let 
				data        = response.data,
				returnCode  = data.substr(0,2),
				deviceState = data.substr(2,2),
				paramData   = data.substr(4);

			console.log('LCR Param Data Callback - ', returnCode, deviceState);
			_call(status, {
				returnCode: returnCode,
				deviceSta: deviceState,
				param: paramData
			});
		});
	}
	
	return self;
};
		
