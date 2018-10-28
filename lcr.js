/**
 * LCR API Module
 * 
 * This module contains methods for generating the HEX required to send a message to an LC Meter
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const SerialPort = require('serialport');

let lcStatus = {
	mid:        parseInt('00000001', 2),
	sync:       parseInt('00000010', 2),
	busy:       parseInt('00000100', 2),
	aborted:    parseInt('00001000', 2),
	no_request: parseInt('00010000', 2),
	overflow:   parseInt('00100000', 2),
	invalid:    parseInt('01000000', 2),
	valid:      parseInt('10000000', 2)
};

module.exports = function(device = 'ttyUSB0', node = 250, port = 255) {
	let 
		self = this,
		canWrite = false,
		isOpen = false,
		rxBuffer = '',
		rxTimer = null,
		dataCallback,
		failCallback,
		commPort = new SerialPort('/dev/' + device, {
			baudRate: 19200,
			autoOpen: false
		}),
		hexToString = function(hex) {
			if ('string' !== typeof hex) hex = hex.toString();
			let output = '';
			for (var i = 0; i < hex.length; i += 2)
				output += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
			return output;
		},
		bytesToString = function(byteArray) {
			if ('array' !== typeof byteArray) return '';
			let output = '';
			for (var i = 0; i < byteArray.length; i += 2)
				output += String.fromCharCode(byteArray[i]);
			return output;
		},
		bytesToHex = function(byteArray) {
			if ( ! byteArray) {
				return '';
			}

			var hexStr = '';
			for (var i = 0; i < byteArray.length; i++) {
				var hex = (byteArray[i] & 0xff).toString(16);
				hex = (hex.length === 1) ? '0' + hex : hex;
				hexStr = hexStr + hex.toUpperCase();
			}

			return hexStr;
		},
		verifyResponse = () => {
			if (rxBuffer.length < 12) return false;

			let 
				head    = parseInt(rxBuffer.substr(0, 4), 16),
				to      = parseInt(rxBuffer.substr(4, 2), 16),
				from    = parseInt(rxBuffer.substr(6, 2), 16),
				status  = parseInt(rxBuffer.substr(8, 2), 16),
				dataLen = parseInt(rxBuffer.substr(10, 2), 16);

			if (rxBuffer.length < (12 + (dataLen * 2))) return false;
			else if (rxBuffer.length === 6 + dataLen + 2) {
				let data = rxBuffer.substr(12, 2 * dataLen);
				rxBuffer = '';
				dataCallback(status, data);
			}
		},
		appendCrc = function(byte, crc) {
			let XORFlag, i;

			if (crc) {
				for (i = 7; i >= 0; i--) {
					XORFlag = ((crc & 0x8000) != 0x0000);
					crc <<= 1;
					crc |= ((byte >> i) & 0x01);
					if (XORFlag)
						crc ^= 0x1021;
				}
			}
			
			return crc;
		};

	commPort.on('open', (error) => {
		if (error) return console.log('CommPort - Error - ' + error.message);
		isOpen = true;
		canWrite = true;
		console.log('CommPort - Open - /dev/' + device);
	});

	commPort.on('close', () => {
		isOpen = false;
		canWrite = false;
		console.log('CommPort - Closed - /dev/' + device);
	});
	
	commPort.on('drain', () => {
		canWrite = true;
		console.log('CommPort - Drained - /dev/' + device);
	});

	commPort.on('error', (error) => {
		isOpen = false;
		canWrite = false;
		console.log('CommPort - Error - ' + error.message);
	});

	commPort.on('data', (data) => {
		if (rxTimer) clearTimeout(rxTimer);
		rxBuffer = rxBuffer + data.toString('hex');
		rxTimer = setTimeout(verifyResponse, 100);
	});

	self.buildMessage = function(byteArray) {
		if ('object' !== typeof byteArray) {
			console.log('Invalid type passed to buildMessage - ' + typeof byteArray);
			return false;
		}
		
		let 
			crc = 0x7E7E,
			rawString = '',
			message = [126, 126, node, port, lcStatus.sync, byteArray.length];
	
		for (var i = 0; i < byteArray.length; i++) {
			message.push(byteArray[i]);
		}
		
		for (var i = 0; i < message.length; i++) {
			rawString = rawString + String.fromCharCode(message[i]);
			if (i > 1) {
				crc = appendCrc(message[i], crc);
			}
		}
		message.push(((crc/0x0100) & 0xff).toString(16));
		message.push(((crc%0x0100) & 0xff).toString(16));
		console.log('Message built: ', (new Buffer.from(message, 'hex')));
		return new Buffer.from(message, 'hex');
	};

	self.checkStatus = function(callback) {
		let buffer;

		console.log('Check status called');

		dataCallback = (data) => {
			let 
				returnCode  = data.substr(0,2),
				productID   = data.substr(2,2),
				productName = hexToString(data.substr(4));

			console.log('LCR Status Check - Good');
			callback(true, productID, productName);
		};

		failCallback = () => {
			console.log('LCR Status Check - Bad');
			callback(false);
		};

		if ( ! isOpen) {
			commPort.open(function(err){
				if (err) callback(false);
				self.checkStatus(callback);
			});
		} else {
			if ( ! canWrite) {
				setTimeout(() => {
					self.checkStatus(callback);
				}, 100);
				return false;
			}

			buffer = self.buildMessage([0]);
			canWrite = false;
			commPort.write(buffer, (err) => {
				if (err) {
					console.log('CommPort Write - Error: ' + err.message);
					callback(false);
				} else {
					console.log('CommPort Write - Success: ', buffer);
				}
			});
		}
	};

	return this;
}
		
