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
	self.startSync = true;
	self.sync = true;
	self.lastCmd = '';

	/**
	 * Generates a request message for the LC meter
	 * 
	 * @param {Object} byteArray
	 * @returns {Boolean}
	 */
	self.build = function(byteArray) {
		if ('object' !== typeof byteArray) {
			//console.log('Request->build() expected an object but got ' + typeof byteArray);
			return false;
		}
		
		let 
			crc = 0x7E7E,
			crcByte1, crcByte2,
			rawString = '',
			hexArr = [],
			message = [126, 126, node, port, self.startSync ? 0x02 : self.sync ? 0x01 : 0x00, byteArray.length];
		
		self.startSync = false;
		self.sync = self.sync ? false : true;
		
		for (var i = 0; i < byteArray.length; i++) {
			let byte = byteArray[i];
			if (parseInt(byte) === parseInt(0x1B) || parseInt(byte) === parseInt(0x7E)) {
				message.push(parseInt(0x1B));
			}
			message.push(parseInt(byte));
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
		
		crcByte1 = ((crc%0x0100) & 0xFF).toString(16);
		crcByte2 = ((crc/0x0100) & 0xFF).toString(16);
		crcByte1 = (crcByte1.length === 1) ? '0' + crcByte1 : crcByte1.toUpperCase();
		crcByte2 = (crcByte2.length === 1) ? '0' + crcByte2 : crcByte2.toUpperCase();
		hexArr.push(crcByte1);
		hexArr.push(crcByte2);
		console.log('Built Hex Array:', hexArr);
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
		if (self.lastCmd === command) self.sync = self.sync ? false : true;
		let payload = self.build(command, node, port);
		return commPort.write(payload, callback);
	};
	
	return self;
};


