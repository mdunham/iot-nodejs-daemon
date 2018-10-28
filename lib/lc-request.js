/**
 * LCR Request Object Module
 * 
 * This module handles processing commands to send to the LC metter.
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const crc16 = require('./crc.js');

const lcStatus = {
	mid:        parseInt('00000001', 2),
	sync:       parseInt('00000010', 2),
	busy:       parseInt('00000100', 2),
	aborted:    parseInt('00001000', 2),
	no_request: parseInt('00010000', 2),
	overflow:   parseInt('00100000', 2),
	invalid:    parseInt('01000000', 2),
	valid:      parseInt('10000000', 2)
};

exports.lcStatus = lcStatus;

/**
 * LCR Request Module
 * 
 * @param {SerialPort} commPort SerialPort object
 * @param {int} node Location node of the LC meter
 * @param {int} port Local port
 * @returns {Function}
 */
module.exports = function(commPort, node, port) {
	let self = this;
	
	self.sync = true;

	/**
	 * Generates a request message for the LC meter
	 * 
	 * @param {Object} byteArray
	 * @returns {Boolean}
	 */
	self.build = function(byteArray) {
		if ('object' !== typeof byteArray) {
			console.log('Request->build() expected an object but got ' + typeof byteArray);
			return false;
		}
		
		let 
			crc = 0x7E7E,
			rawString = '',
			hexArr = [],
			message = [126, 126, node, port, (self.sync) ? lcStatus.sync : 1, byteArray.length];
		
		self.sync = false;
		
		for (var i = 0; i < byteArray.length; i++) {
			message.push(byteArray[i]);
		}
		
		for (var i = 0; i < message.length; i++) {
			rawString = rawString + String.fromCharCode(message[i]);
			if (i > 1) {
				crc = crc16(message[i], crc);
			}
			let hByte = (message[i] & 0xff).toString(16);
			hByte = (hByte.length === 1) ? '0' + hByte : hByte.toUpperCase();
			hexArr.push(hByte);
		}

		hexArr.push(((crc%0x0100) & 0xff).toString(16));
		hexArr.push(((crc/0x0100) & 0xff).toString(16));
		return  Buffer.from(hexArr.join(''), 'hex');
	};
	
	/**
	 * Issue a new command to the LCR meter
	 * 
	 * @param {Object} command Array of bytes
	 * @param {Function} callback
	 * @returns {Boolean}
	 */
	self.issue = function(command, callback) {
		let payload = self.build(command, node, port);
		return commPort.write(payload, callback);
	};
	
	return self;
};


