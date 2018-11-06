/**
 * Comm Port Module
 * 
 * This is where all the serial communication happens.
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const SerialPort = require('serialport');

/**
 * Comm Port Module
 * 
 * @param {String} device Serial ports device tty defaults to ttyUSB0
 * @returns {nm$_comm-port.module}
 */
module.exports = function(device) {
	let self = this, rxTimer, waitTimer;

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
		if (error) return console.log('CommPort - Error - ' + error.message);
		self.isOpen = true;
		self.canWrite = true;
		console.log('CommPort - Open - /dev/' + device);
	});

	// Called when the serial port to the LCR meter is closed
	self.serial.on('close', () => {
		self.isOpen = false;
		self.canWrite = false;
		console.log('CommPort - Closed - /dev/' + device);
	});

	// Called when the write has successfully completed
	self.serial.on('drain', () => {
		self.canWrite = true;
		console.log('CommPort - Drained - /dev/' + device);
	});

	// Whenever any type of serial comms error occurs
	self.serial.on('error', (error) => {
		self.isOpen = false;
		self.canWrite = true;
		console.log('CommPort - Error - ' + error.message);
	});
	
	// When the comms receive data
	self.serial.on('readable', () => {
		let data = self.serial.read();
		if (rxTimer) clearTimeout(rxTimer);
		self.buffer = self.buffer + data.toString('hex');
		rxTimer = setTimeout(self.verify, 100);
		console.log('Received Data: ', data);
	});

	/**
	* Validates that the response is valid and complete
	* 
	* @returns {Boolean}
	*/
	self.verify = () => {
		console.log('Verifying buffer: ', self.buffer);
		let buffer = self.buffer;
		if (buffer.length < 12) return false;

		let 
			head    = parseInt(buffer.substr(0, 4), 16),
			to      = parseInt(buffer.substr(4, 2), 16),
			from    = parseInt(buffer.substr(6, 2), 16),
			status  = parseInt(buffer.substr(8, 2), 16),
			dataLen = parseInt(buffer.substr(10, 2), 16),
			data;

		if (buffer.length >= 16 + (dataLen * 2)) {
			data = buffer.substr(12, 2 * dataLen);
			self.buffer = '';
			buffer = '';
			self.canWrite = true;
			return self.callback(true, {
				status: status,
				from: from,
				to:	to,
				length: dataLen,
				data: data
			});
		}

		return false;
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
			self.serial.open(function(err){
				if ( ! err) { 
					self.write(buffer, callback);
				} else {
					console.log('Serial Error - onOpen: ' + err.message);
					setTimeout(() => { self.write(buffer, callback, ++waited) }, 2500);
				}
			});
			return false;
		}

		if ( ! self.canWrite) {
			if (waited > 50) {
				callback(false, { 
					error: 'Timeout occured while waiting for canWrite'
				});
			} else {
				clearTimeout(waitTimer);
				waitTimer = setTimeout(() => { 
					console.log('waiting on canWrite');
					self.write(buffer, callback, ++waited);
				}, 200);
			}
			return false;
		}

		self.callback = callback;
		self.canWrite = false;
		self.serial.write(buffer, (error) => {
			if ( ! error) console.log('CommPort - Write - ', buffer);
			self.serial.drain(() => { self.canWrite = true; console.log('drainage'); });
		});
	};

	return this;
};
