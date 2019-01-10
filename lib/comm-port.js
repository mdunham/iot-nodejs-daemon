/**
 * Comm Port Module
 * 
 * This is where all the serial communication happens.
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const SerialPort = require('serialport');
const utils = require('./utils');
const lcFlags = require('./lc-flags');

/**
 * Comm Port Module
 * 
 * @param {String} device Serial ports device tty defaults to ttyUSB0
 * @returns {nm$_comm-port.module}
 */
module.exports = function(device) {
	var self = this, rxTimer, waitTimer;

	self.callback = () => {};
	self.buffer = '';
	self.isOpen = false;
	self.canWrite = false;
	
	// Create the serial comms object
	self.serial = new SerialPort('/dev/' + device, {
		baudRate: 19200,
		autoOpen: false
	});

	// Called when the serial port to the LCR meter is openned
	self.serial.on('open', (error) => {
		if (error) return console.info('CommPort - Error - ' + error.message);
		self.isOpen = true;
		self.canWrite = true;
		console.info('CommPort - Open - /dev/' + device);
	});

	// Called when the serial port to the LCR meter is closed
	self.serial.on('close', () => {
		self.isOpen = false;
		self.canWrite = false;
		console.info('CommPort::Closed - /dev/' + device);
	});

	// Called when the write has successfully completed
	self.serial.on('drain', () => {
		self.canWrite = true;
		console.info('CommPort - Drained - /dev/' + device);
	});

	// Whenever any type of serial comms error occurs
	self.serial.on('error', (error) => {
		self.isOpen = false;
		self.canWrite = true;
		console.info('CommPort::Error -> ' + error.message);
	});
	
	// When the comms receive data
	self.serial.on('readable', () => {
		let data = self.serial.read();
		if (rxTimer) clearTimeout(rxTimer);
		self.buffer = self.buffer + data.toString('hex');
		rxTimer = setTimeout(self.verify, 150);
		console.info('CommPort::Received -> ', data);
	});

	/**
	* Validates that the response is valid and complete
	* 
	* @returns {Boolean}
	*/
	self.verify = () => {
		console.info('Verifying buffer: ', self.buffer);
		let buffer = self.buffer;
		if (buffer.length < 12) return false;

		let 
			head    = parseInt(buffer.substr(0, 4), 16),
			to      = parseInt(buffer.substr(4, 2), 16),
			from    = parseInt(buffer.substr(6, 2), 16),
			status  = parseInt(buffer.substr(8, 2), 16),
			dataLen = parseInt(buffer.substr(10, 2), 16),
			data;
			
		if ((status & lcFlags.status.busy) !== 0) console.log('LCR::busy -> Returned a busy status');
		if ((status & lcFlags.status.overflow) !== 0) console.log('LCR::overflow -> Returned a overflow status');
		if ((status & lcFlags.status.invalid) !== 0) console.log('LCR::invalid -> Returned a invalid status');
		if ((status & lcFlags.status.aborted) !== 0) console.log('LCR::aborted -> Returned a aborted status');
		if ((status & lcFlags.status.no_request) !== 0) console.log('LCR::no_request -> Returned a no_request status');

		if (buffer.length >= 16 + (dataLen * 2)) {
			data = buffer.substr(12, 2 * dataLen);
			
			if (data.substr(0, 2) !== '00') {
				console.log('LCR::returnCode -> ' + getKeyByValue(lcFlags.returnCodeDetails, parseInt(data.substr(0, 2), 16)));
			}
			var buffe = buffer;
			self.buffer = buffer = '';
			self.canWrite = true;
			return self.callback(true, {
				status: status,
				from: from,
				to:	to,
				length: dataLen,
				data: utils.byteData(data),
				buffer: buffe
			});
		} else {
			if (status & lcFlags.status.overflow) { 
				console.log('LCR::ERROR ---> Buffer Overflow');
				self.callback(false);
				self.buffer = buffer = '';
				self.canWrite = true;
			}

			if (status & lcFlags.status.invalid) { 
				console.log('LCR::ERROR ---> Command NOT SUPPORTED');
				self.callback(false);
				self.buffer = buffer = '';
				self.canWrite = true;
			}
		}

		return false;
	};
	
	/**
	 * Attempt to connect to the LCR meter via com port
	 * 
	 * @param {function} callback
	 * @returns {void}
	 */
	self.connect = function(callback) {
		self.serial.open(function(err){
			if ( ! err) { 
				callback(true);
			} else {
				console.info('Serial Error - onOpen: ' + err.message);
				callback(false);
			}
		});
	};

	/**
	 * Setup the comms for a new message
	 * 
	 * @param {string} buffer
	 * @param {Function} callback
	 * @param {int} waited
	 * @returns {Boolean}
	 */
	self.write = (buffer, callback, waited = 0) => {
		if ( ! self.isOpen) {
			self.connect((status) => { 
				setTimeout(() => {
					console.info('--- onWrite Connection Timeout -> Retrying the write #' + waited);
					self.write(buffer, callback, ++waited);
				}, 250); 
			});
			return false;
		}

		if ( ! self.canWrite) {
			if (waited > 10) {
				callback(false, { 
					error: 'Timeout occured while waiting for canWrite'
				});
			} else {
				clearTimeout(waitTimer);
				waitTimer = setTimeout(() => { 
					console.info('waiting on canWrite');
					self.write(buffer, callback, ++waited);
				}, 250);
			}
			return false;
		}

		self.callback = callback;
		self.canWrite = false;
		self.serial.write(buffer, (error) => {
			self.buffer = '';
			if (error) console.info('CommPort - Error Write');
			else console.info('CommPort::Write -> ', buffer);
			self.serial.drain(() => { self.canWrite = true; });
		});
	};

	return this;
};
