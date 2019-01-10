/* global data */

/**
 * LCR API Module
 * 
 * This module contains methods for generating the HEX required to send a message to an LC Meter
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const comms   = require('./comm-port.js');
const ascii   = require('./utils.js');
const request = require('./lc-request.js');
const lcFlags = require('./lc-flags.js');

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
	var 
		self = this,
		checkConn,
		lcrTotals = {},
		syncStatus = {},
		device = new comms(deviceTTY),
		_decimals = 1,
		lcRequest = new request(device, node, port);
	
	/**
	 * The current device status byte
	 * 
	 * @type {int}
	 */
	self.deviceStatus = -0x01;
	
	/**
	 * Version of software running on LCR
	 * 
	 * @type {String}
	 */
	self.lcrVersion = false;
	
	/**
	 * Current product number active on the LCR
	 * 
	 * @type {String}
	 */
	self.lcrProduct = false;
	
	/**
	 * Connect to and configure the LCR
	 * 
	 * @param {boolean} reconnect True = Connect only, False = Connect and configure
	 * @return {Void}
	 */
	self.init = function(reconnect) {
		var
			auditString = '',
			retry,
			steps = {

			// Connect to the LCR
			connect: (count) => {
				count = count || 0;
				retry = setTimeout(() => steps.connect(++count), 2000);
				self.connect((status) => {
					if ( ! status) {
						return console.log('LCR::init -> No LCR Detected After ' + count + ' attempts.');
					}
					
					console.log('LCR::init -> LCR Connected');
					if ( ! reconnect) {
						checkConn = setInterval(() => {
							// Check for the LCR meter connection
							if ( ! self.isConnected()) {
								console.log('LCR::connWatch -> LCR disconnected attempting connect.');
								clearInterval(checkConn);
								steps.connect(0);
							}
						}, 5000);

						clearTimeout(retry);
						steps.sync(0);
					}
				});
			},
			
			// Verify that we are connected to an LCR
			sync: (count) => {
				retry = setTimeout(() => steps.sync(++count), 2000);
				self.checkStatus(function(status, product, version) {
					if ( ! status) {
						console.log('LCR::init -> Sync failed attempt #' + count);
						return setTimeout(() => steps.sync(++count), 50);
					}
					
					self.lcrVersion = version;
					self.lcrProduct = product;
					clearTimeout(retry);
					steps.status(0);
				});
			},
			
			// Get the machine status
			status: (count) => {
				retry = setTimeout(() => steps.status(++count), 2000);
				self.getDeliveryStatus(function(status, data) {
					if ( ! status) {
						console.log('LCR::init -> Delivery status fail attempt #' + count);
						return setTimeout(() => steps.sync(++count), 50);
					}
					
					self.lcrStatus = data;
					clearTimeout(retry);
					steps.getDecimals(0);
				});
			},
			
			// Get the number of decimal places the LCR uses on volume values
			getDecimals: (count) => {
				retry = setTimeout(() => steps.getDecimals(++count), 2000);
				self.getDecimals(function(precision) {
					if ( ! precision) {
						console.log('LCR::init -> Get decimals failed attempt #' + count);
						return setTimeout(() => steps.getDecimals(++count), 50);
					}
					
					clearTimeout(retry);
					steps.getTotalNet(0);
				});
			},
			
			// Get the gross and net totalizer values as well as current shift 
			getTotalNet: (count) => {
				retry = setTimeout(() => steps.getTotalNet(++count), 2000);
				self.getTotalNet((volume) => {
					if (false === volume) {
						console.log('LCR::init -> Failed to get the net totalizer attempt #' + count);
						return setTimeout(() => steps.getTotalNet(++count), 50);
					}
					
					lcrTotals.totalNet = ascii.toVolume(volume);
					clearTimeout(retry);
					steps.getTotalGross(0);
				});
			},
			
			// Get the gross and net totalizer values as well as current shift 
			getTotalGross: (count) => {
				retry = setTimeout(() => steps.getTotalGross(++count), 2000);
				self.getTotalGross((volume) => {
					if (false === volume) {
						console.log('LCR::init -> Failed to get the gross totalizer attempt #' + count);
						return setTimeout(() => steps.getTotalGross(++count), 50);
					}
					
					lcrTotals.totalGross = volume;
					clearTimeout(retry);
					steps.getShiftCount(0);
				});
			},
			
			// Get the gross and net totalizer values as well as current shift 
			getShiftCount: (count) => {
				retry = setTimeout(() => steps.getShiftCount(++count), 2000);
				self.getShiftCount((deliveries) => {
					if (false === deliveries) {
						console.log('LCR::init -> Failed to get this shift\'s number of deliveries attempt #' + count);
						return setTimeout(() => steps.getShiftCount(++count), 50);
					}
					
					lcrTotals.shiftDeliveries = deliveries;
					clearTimeout(retry);
					steps.getShiftNet(0);
				});
			},
			
			// Get the gross and net totalizer values as well as current shift 
			getShiftNet: (count) => {
				retry = setTimeout(() => steps.getShiftNet(++count), 2000);
				self.getShiftNet((volume) => {
					if (false === volume) {
						console.log('LCR::init -> Failed to get the net shift attempt #' + count);
						return setTimeout(() => steps.getShiftNet(++count), 50);
					}
					
					lcrTotals.totalNet = volume;
					clearTimeout(retry);
					steps.getShiftGross(0);
				});
			},
			
			// Get the gross and net totalizer values as well as current shift 
			getShiftGross: (count) => {
				retry = setTimeout(() => steps.getShiftGross(++count), 2000);
				self.getShiftGross((volume) => {
					if (false === volume) {
						console.log('LCR::init -> Failed to get the gross shift attempt #' + count);
						return setTimeout(() => steps.getShiftGross(++count), 50);
					}
					
					lcrTotals.shiftGross = volume;
					clearTimeout(retry);
					steps.checkPrinter(0);
				});
			},
			
			// See if a ticket is required and try to disable it
			checkPrinter: (count) => {
				retry = setTimeout(() => steps.checkPrinter(++count), 2000);
				self.checkPrinter((ticketRequired) => {
					console.log('LCR::init -> LCR ' + (ticketRequired ? 'requires' : 'does not require') + ' a ticket count #' + count);
					if (ticketRequired && count <= 10) {
						self.unlockLCR(() => self.calibrateLCR((status) => {
							if (status) {
								self.disablePrinter((status, deviceByte) => {
									clearTimeout(retry);
									setTimeout(() => steps.checkPrinter(++count), 50);
								});
							}
						}));
					} else {
						if ( ! ticketRequired || count >= 10) {
							console.log('LCR::init -> The LCR ' + (ticketRequired ? 'still requires' : 'no longer requires') + ' a ticket to be printed count #' + count);
							clearTimeout(retry);
						}
					}
				});
				
				console.lcr('Initialized - Total Gross: ' + lcrTotals.totalGross + ' Total Net: ' + 
					lcrTotals.shiftNet + ' Shift Gross: ' + lcrTotals.shiftGross + ' Shift Net: ' + 
					lcrTotals.shiftNet + ' Delivery Count: ' + lcrTotals.shiftDeliveries);
				
				console.log('LCR::init -> Initialization Complete');
			}
		};
		
		console.log('LCR::init -> Begin initialization...');
		steps.connect(0);
	},
	
	/**
	 * Format volume data to show the correct decimal place
	 * 
	 * @param {string|int} value
	 * @param {int} decimals
	 * @return {string}
	 */
	self.getWithDecimal = function(value, decimals) {
		if ( ! decimals && decimals !== 0 && _decimals) decimals = _decimals;
		if ( ! decimals && decimals !== 0) return value;
		return value.substring(0, value.length - decimals) + '.' + value.substr(-decimals);
	};
	
	/**
	 * Returns a value that includes the correct decimal position padded with 0s
	 * 
	 * @param {int} value
	 * @param {int} decimals
	 * @return {string}
	 */
	self.paddedDecimal = function(value, decimals) {
		if ( ! decimals && decimals !== 0 && _decimals) decimals = _decimals;
		if ( ! decimals && decimals !== 0) return value;
		return self.getWithDecimal(value + '0'.repeat(decimals), decimals);
	};
	
	/**
	 * Get the amount of decimals for volumes
	 * 
	 * @returns {boolean} 
	 */
	self.getDecimals = function(callback) {
		var _call = callback;
		
		return self.getField(0x27, function(status, deviceByte, data) {
			if ( ! status || ! data || ! data.length || 'undefined' === typeof data[0] || '' === data[0]) {
				return _call(false);
			}

			switch (parseInt(data[0], 16)) {
				case 0:
					_decimals = 2;
					break;
				case 1:
					_decimals = 1;
					break;
				case 2:
					_decimals = 0;
					break;
				default:
					_decimals = 1;
			}

			_call(_decimals);
		});
	};
	
	/**
	 * Checks to see if the serial connection to the LCR is active
	 * 
	 * @returns {boolean}   
	 */
	self.isConnected = function() {
		return device.isOpen;
	};
	
	self.getSyncStatus = function() {
		return syncStatus;
	};
	
	/**
	 * This refreshs the LCR statuses 
	 * 
	 * @returns {void}
	 */
	self.pulseStatus = function() {
//		var
//			_fieldData = {},
//			_skipDec = false,
//			_fieldDesc = ['vol-decimals', 'gross-qty-current', 'flow-rate', 'net-preset', 'gross-qty-current-shift', 'prod-com-gross', 'gross-totalizer-previous', 'abs-gross-qty-current', 'net-qty-remaining'],
//			_getFields = [0x27, 0x02, 0x04, 0x06, 0x0D, 0x11, 0x64, 0x2C, 0x5D], 
//			getFields = function(index) {
//				if ( ! index && _skipDec) return getFields(index+1);
//				if (index === _getFields.length) {
//					if (_fieldData['gross-qty-current'] !== '.0' && _fieldData['prod-com-gross'] !== '.0' && _fieldData['gross-qty-current-shift'] !== '.0')
//					syncStatus = _fieldData;
//					console.log('----- SYNC -----', JSON.stringify(syncStatus));
//					setTimeout(self.pulseStatus, 500);
//					return;
//				}
//				var wId = setTimeout(function(){ _fieldData[_fieldDesc[index]] = _fieldData[_fieldDesc[index]] || 0; getFields(index+1); }, 500);
//				self.getField(_getFields[index], function(status, deviceByte, data) {
//					if (status) {
//						
//						_fieldData[_fieldDesc[index]] = (view.getInt32(0)).toString();
//						if (data && data.length) {
//							if (index === 0) {
//								switch (parseInt(data[0], 16)) {
//									case 0:
//										_decimals = 2;
//										_skipDec = true;
//										break;
//									case 1:
//										_decimals = 1;
//										_skipDec = true;
//										break;
//									case 2:
//										_decimals = 0;
//										_skipDec = true;
//										break;
//									default:
//										_decimals = 1;
//								}
//							} else {
//								try {
//									data.forEach(function (b, i) {
//										view.setUint8(i, parseInt(b, 16));
//									});
//									_fieldData[_fieldDesc[index]] = (view.getInt32(0)).toString();
//								} catch (e) {console.log('Error Parsing Val: ' , e);}
//								if (_decimals) _fieldData[_fieldDesc[index]] = self.getWithDecimal(_fieldData[_fieldDesc[index]], _decimals);
//							}
//						
//						}
//					} else {
//						_fieldData[_fieldDesc[index]] = 0;
//					}
//					clearTimeout(wId);
//					getFields(index+1);
//				});
//			};
//
//		getFields(0);
	},

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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_PRODUCT_ID], (status, response) => {
			var 
				data        = response.data,
				returnCode  = data.getByte(0, 1),
				productID   = data.getByte(1, 1),
				productName = ascii.hexToString(data.toString().substr(4));

			console.info('LCR Status Check - ' + returnCode + ' Data: ' + data);
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.CHECK_LAST_REQUEST], (status, response) => {
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				dataOutput   = data.substr(2);

			console.info('LCR Check Request - ' + returnCode + ' - Data: ', dataOutput);
			_call(status, returnCode, dataOutput);
		});
	};

	/**
	 * Devare the last transaction
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.removeTransaction = function(callback) {
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.DELETE_TRANSACTION], (status, response) => {
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2);

			console.info('LCR Remove Transaction - ' + returnCode);
			_call(status, returnCode);
		});
	};
	
	/**
	 * Disable the need to print a delivery ticket
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.disablePrinter = function(callback) {
		var _call = callback;
		self.setField(0x25, [0x01], _call);
	};
	
	/**
	 * Checks to see if a ticket is required
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.checkPrinter = function(callback) {
		var _call = callback;
		self.getField(0x25, (status, deviceByte, data) => _call(parseInt(data[0]) === 0));
	};
	
	/**
	 * Unlock the LCR
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.unlockLCR = function(callback) {
		var _call = callback;
		self.setField(0x48, [0,0,0,0,0], _call);
	};
	
	/**
	 * Factory unlock the LCR
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.unlockFactory = function(callback) {
		var _call = callback;
		self.setField(0x4A, [0,0,0,0,0], _call);
	};
	
	/**
	 * Put LCR into calibrate mode
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.calibrateLCR = function(callback) {
		var _call = callback;
		self.unlockFactory(() => {
			self.command(lcFlags.commands.PLACE_LCR_IN_CALIBRATE, (status, returnCode) => {
				_call( ! returnCode);
			});
		});
	};
	
	/**
	 * Clear the current shift totals
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.clearShift = function(callback) {
		var _call = callback;
		self.setField(0x10, [0], (status) => {
			if ( ! status) {
				return setTimeout(() => self.clearShift(_call), 50);
			}
			
			_call(ascii.toVolume(data, _decimals));
		});
	};
	
	/**
	 * Get the current shifts net total delivered
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getShiftNet = function(callback) {
		var  _call = callback;
		self.getField(0x0E, (status, deviceByte, data) => {
			if ( ! status) {
				return _call(false);
			}
			
			_call(ascii.toVolume(data, _decimals));
		});
	};
	
	/**
	 * Get the current shifts gross total delivered
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getShiftGross = function(callback) {
		var  _call = callback;
		self.getField(0x0D, (status, deviceByte, data) => {
			if ( ! status) {
				return _call(false);
			}
			
			_call(ascii.toVolume(data, _decimals));
		});
	};
	
	/**
	 * Get the net totalizer last delivery
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getTotalNet = function(callback) {
		var  _call = callback;
		self.getField(0x65, (status, deviceByte, data) => {
			if ( ! status) {
				return _call(false);
			}
			
			_call(ascii.toVolume(data, _decimals));
		});
	};
	
	/**
	 * Get the current shifts gross total delivered
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getTotalGross = function(callback) {
		var  _call = callback;
		self.getField(0x64, (status, deviceByte, data) => {
			if ( ! status) {
				return _call(false);
			}
			
			_call(ascii.toVolume(data, _decimals));
		});
	};
	
	/**
	 * Get the current shifts gross total delivered
	 * 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getShiftCount = function(callback) {
		var  _call = callback;
		self.getField(0x0F, (status, deviceByte, data) => {
			if ( ! status) {
				return _call(false);
			}
			
			_call(ascii.toUint32(data));
		});
	};
	
	
	
	/**
	 * Get the last transaction                                          
	 *
	 * @param {Function} callback
	 * @returns {void}
	 */
	self.getTransaction = function(callback) {
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_TRANSACTION], (status, response) => {
			var
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.ABORT_REQUEST], (status, response) => {
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				dataOutput  = data.substr(2);

			console.info('LCR Abort Request - ' + returnCode + ' - Data: ', dataOutput);
			_call(status, returnCode, dataOutput);
		});
	};
	
	/**
	 * Get the value of a field
	 *  
	 * @param {int} fieldNum 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getField = function(fieldNum, callback) {
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD, fieldNum], (status, response) => {
			if ( ! status) {
				console.info('Error getField: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				deviceByte  = data.substr(2,2),
				fieldValue  = data.substr(4);
			
			console.info('LCR Get Field - ' + fieldNum + ' Data: ' + data);
			_call(status, deviceByte, fieldValue.match(/../g));
		});
	};
	
	/**
	 * Update the value of field
	 * 
	 * @param {int} fieldNum 
	 * @param {mixed} rawData object literal, numerical, or string
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.setField = function(fieldNum, rawData, callback) {
		var data = [lcFlags.lcrMethods.SET_FIELD, fieldNum], _call = callback;
		if ('object' === typeof rawData) {
			var uIntArr = new Uint8Array(rawData);
			if (uIntArr.length === 4) {
				for (var i = 0; i < uIntArr.length; i++)
					data.push(uIntArr[i]);
			}
		} else if ('number' === typeof rawData) {
			data.push(rawData);
		} else {
			rawData = rawData.split('').map((char) => char.charCodeAt(0));
			for (var i = 0; i < rawData.length; i++) data.push(rawData[i]);
		}
		return lcRequest.issue(data, (status, response) => {
			if ( ! status) {
				console.info('Error setField: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				deviceByte  = data.substr(2,2);

			console.log('LCR Set Field - ' + fieldNum, _call);
			if (_call) _call(status, deviceByte);
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.SET_BAUD, baud], (status, response) => {
			if ( ! status) {
				console.info('Error setBaud: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				deviceByte  = data.substr(2,2);

			console.info('LCR Set Baud - ' + returnCode + ' Data: ' + data);
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.ISSUE_COMMAND, command], (status, response) => {
			if ( ! status) {
				console.log('Error to issue command Failed: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = parseInt(data.substr(0,2), 16),
				deviceByte  = parseInt(data.substr(2,2), 16);
				
			
			console.info('LCR Issued Command Response:', returnCode, deviceByte);
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.START_PAUSE_DELIVERY], (status, response) => {
			if ( ! status) {
				console.info('Error getField: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2);

			console.info('LCR Activate Pump and Print:', returnCode);
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.MACHINE_STATUS], (status, response) => {
			if ( ! status) {
				console.info('Error getMachineStatus: ' + response.message);
				return false;
			}
			
			var 
				data          = response.data.toString(),
				returnCode    = data.substr(0,2),
				deviceStat    = data.substr(2,2),
				printerStat   = data.substr(4,2),
				deliveryStat  = data.substr(6,4),
				deliveryCode  = data.substr(10,4);

			console.info('LCR Machine Status - ', deviceStat, printerStat, deliveryStat, deliveryCode);
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.DELIVERY_STATUS], (status, response) => {
			if ( ! status) {
				console.info('Error getMachineStatus: ' + response.message);
				return false;
			}
			
			var 
				data          = response.data.toString(),
				returnCode    = data.substr(0,2),
				deviceStat    = getKeyByValue(lcFlags.machine, parseInt(data.substr(2,2), 16)),
				deliveryStat  = getKeyByValue(lcFlags.delivery.status, parseInt(data.substr(4,4), 16)),
				deliveryCode  = getKeyByValue(lcFlags.delivery.code, parseInt(data.substr(8,4), 16));
				
			console.info('LCR Machine Status - ', deviceStat, deliveryStat, deliveryCode);
			_call(status, {
				returnCode: returnCode,
				deviceStatus: deviceStat,
				deliveryStatus: deliveryStat,
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_VERSION], (status, response) => {
			if ( ! status) {
				console.info('Error getVersion: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				deviceState = data.substr(2,2),
				version     = data.substr(4,2);

			console.info('LCR Version - ', returnCode, deviceState, version);
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
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_SECURITY], (status, response) => {
			if ( ! status) {
				console.info('Error getVersion: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				deviceState = data.substr(2,2),
				security    = data.substr(4);

			console.info('LCR Security - ', returnCode, deviceState, version);
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
	 * @param {int} param
	 * @param {int} block 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getFieldParams = function(param, block, callback) {
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD_PARAMS, param, block], (status, response) => {
			if ( ! status) {
				console.log('Error getVersion: ' + response.message);
				return false;
			}
			console.info(response, response.data);
			var 
				data        = response.data.toString(),
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
	 * @param {int} param
	 * @param {int} block 
	 * @param {Function} callback
	 * @returns {void}  
	 */
	self.getFieldParams2 = function(param, block, callback) {
		var _call = callback;

		return lcRequest.issue([lcFlags.lcrMethods.GET_FIELD_PARAMS2, param, block], (status, response) => {
			if ( ! status) {
				console.info('Error getVersion: ' + response.message);
				return false;
			}
			
			var 
				data        = response.data.toString(),
				returnCode  = data.substr(0,2),
				deviceState = data.substr(2,2),
				paramData   = data.substr(4);

			console.info('LCR Param Data Callback - ', returnCode, deviceState);
			_call(status, {
				returnCode: returnCode,
				deviceSta: deviceState,
				param: paramData
			});
		});
	};
	
	return self;
};
		
