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

/**
 * LCR Device Module
 * 
 * This module enables you to communicate with a specific LCR meter over a serial interface.
 * 
 * @param {string} deviceTTY The name of the connection device found in /dev/ defaults to ttyUSB0
 * @param {int} node The node location of the LCR meter typically 250
 * @param {int} port The port of the local host typically 255
 * @returns {self}
 */
module.exports.device = function(deviceTTY = 'ttyUSB0', node = 250, port = 255) {
	let 
		self = this,
		device = new comms(deviceTTY),
		lcRequest = new request(device, node, port);

	/**
	 * Checks to see if the serial connection to the LCR is active
	 * 
	 * @returns {boolean}   
	 */
	self.isConnected = function() {
		return device.isOpen;
	};
	
	/**
	 * Attempt to connect to the LCR
	 * 
	 * @param {function} callback Should accept one argument a boolean true on success false on fail
	 * @returns {void}
	 */
	self.connect = function(callback) {
		return device.connect(callback);
	};

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
				returnCode  = data.getByte(0,1),
				productID   = data.getByte(1,1),
				productName = ascii.hexToString(data.toString().substr(4));

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
	 * Delete the last transaction
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.removeTransaction = function(callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.DELETE_TRANSACTION], (status, response) => {
			let 
				data        = response.data,
				returnCode  = data.substr(0,2);

			console.log('LCR Remove Transaction - ' + returnCode);
			_call(status, returnCode, dataOutput);
		});
	};
	
	/**
	 * Get the last transaction                                          
	 *
	 * @param {Function} callback
	 * @returns {void}
	 */
	self.getTransaction = function(callback) {
			let _call = callback;

			return lcRequest.issue([lcFlags.lcrMethods.GET_TRANSACTION], (status, response) => {
					let
							data        = response.data,
							returnCode  = data.getByte(0, 1),
							temp        = data.getByte(1, 4),
							customerId  = data.getByte(5, 4),
							saleNumber  = data.getByte(9, 4),
							gross       = data.getByte(13, 4),
							net         = data.getByte(17, 4),
							statusCode  = data.getByte(21, 2),
							compType    = data.getByte(23, 1),
							dateFormat  = data.getByte(24, 1),
							decimals    = data.getByte(25, 1),
							product     = data.getByte(26, 1),
							qtyUnits    = data.getByte(27, 1),
							tempScale   = data.getByte(28, 1),
							dateTime    = data.getByte(29, 12),
							record = {
								customerId: customerId,
								saleNumber: saleNumber,
								productId: product,
								grossQty: gross,
								netQty: net,
								qtyUnits: qtyUnits,
								decimals: decimals,
								productTemp: temp,
								tempCompensate: compType,
								tempScale: tempScale,
								date: dateTime,
								dateFormat: dateFormat,
								status: statusCode
							};


					console.log('LCR Get Transaction - ' + returnCode, record);
					_call(status, returnCode, record);
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
	self.getFieldParams = function(param, block, callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD_PARAMS, param, block], (status, response) => {
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
	self.getFieldParams2 = function(param, block, callback) {
		let _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD_PARAMS2, param, block], (status, response) => {
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
		
