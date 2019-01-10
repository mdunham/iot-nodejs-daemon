/** 
 * Hex and Ascii Utilities
 * 
 * This module contains utility methods used by the LCR module.
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

/**
 * Converts a string containing HEX to ASCII
 * 
 * @param {String} hex
 * @returns {String}
 */
exports.hexToString = (hex) => {
	if ('string' !== typeof hex) hex = hex.toString();
	let output = '';
	for (var i = 0; i < hex.length; i += 2)
		output += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	return output;
};

/**
 * Converts an array of bytes into ASCII
 * 
 * @param {Array} byteArray
 * @returns {String}
 */
exports.toAscii = (byteArray) => {
	if ('string' === typeof byteArray) byteArray.match(/../g);
	if ('object' !== typeof byteArray) return '';
	let output = '';
	for (var i = 0; i < byteArray.length; i += 2)
		output += String.fromCharCode(byteArray[i]);
	return output;
};

/**
 * Converts an array of bytes into a 32 bit int
 * 
 * @param {Array} byteArray
 * @returns {String}
 */
exports.toVolume = (byteArray, decimals) => {
	if ('string' === typeof byteArray) byteArray.match(/../g);
	if ('object' !== typeof byteArray) return '';
	var
		buf = new ArrayBuffer(4),
		view = new DataView(buf),
		int32 = 0;

	byteArray.forEach(function (b, i) {
		view.setUint8(i, parseInt(b, 16));
	});

	int32 = (view.getInt32(0)).toString();

	if ( ! decimals && decimals !== 0) return int32;
	return ! decimals ? int32 : 
		int32.substring(0, int32.length - decimals) + '.' + int32.substring(int32.length - decimals);
};

/**
 * Converts an array of bytes into a 32 bit signed long
 * 
 * @param {Array} byteArray
 * @returns {String}
 */
exports.toInt32 = (byteArray) => {
	if ('string' === typeof byteArray) byteArray.match(/../g);
	if ('object' !== typeof byteArray) return '';
	var
		buf = new ArrayBuffer(4),
		view = new DataView(buf),
		int32 = 0;

	byteArray.forEach(function (b, i) {
		view.setUint8(i, parseInt(b, 16));
	});

	int32 = (view.getInt32(0)).toString();

	return int32;
};

/**
 * Converts an array of bytes into a 32 bit unsigned long
 * 
 * @param {Array} byteArray
 * @returns {String}
 */
exports.toUint32 = (byteArray, decimals) => {
	if ('string' === typeof byteArray) byteArray.match(/../g);
	if ('object' !== typeof byteArray) return '';
	var
		buf = new ArrayBuffer(4),
		view = new DataView(buf),
		int32 = 0;

	byteArray.forEach(function (b, i) {
		view.setUint8(i, parseInt(b, 16));
	});

	int32 = (view.getUint32(0)).toString();

	if ( ! decimals && decimals !== 0) return int32;
	return ! decimals ? int32 : 
		int32.substring(0, int32.length - decimals) + '.' + int32.substring(int32.length - decimals);
};

/**
 * Makes working with byte messages alot easier than using substring
 * 
 * @param {string} data Hex data string
 * @returns {object}
 */
function dataByte(data){
	this.data = data;
	
	this.getByte = (offset, length) => {
		return this.data.substr(offset * 2, length * 2);
	};
	
	return this;
}

dataByte.prototype.toString = function() {
	return this.data;
};

exports.byteData = function(data) {
	return new dataByte(data);
};

/**
 * Convert an array of bytes to HEX
 * 
 * @param {Array} byteArray
 * @returns {String}
 */
exports.bytesToHex = (byteArray) => {
	return Array.from(byteArray, function (byte) {
		return ('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('');
	
	/** ORIGINAL CODE *****
	if ( ! byteArray) return '';
	let hexStr = '';
	for (var i = 0; i < byteArray.length; i++) {
		var hex = (byteArray[i] & 0xff).toString(16);
		hex = (hex.length === 1) ? '0' + hex : hex;
		hexStr = hexStr + hex.toUpperCase();
	}
	return hexStr;
	*/
};

/**
 * Converts a string into a hex string
 * 
 * @param {string} string
 * @param {boolean} retArr Return result as a hex array defaults to false return string
 * @returns {String|Object} If retArr is true it will return an array else a string
 */
exports.stringToHex = (string, retArr = false) => {
	if ( ! string) return '';
	let byteArray = string.split('').map((char) => char.charCodeAt(0)),
		hexStr = '';
	for (var i = 0; i < byteArray.length; i++) {
		var hex = (byteArray[i] & 0xff).toString(16);
		hex = (hex.length === 1) ? '0' + hex : hex;
		hexStr = hexStr + hex.toUpperCase();
	}
	return retArr ? hexStr.match(/.{1,3}/g) : hexStr;
};

/**
 * Convert a string into an 8 bit array buffer
 * 
 * @param {String} string The ascii string to convert into a uint8 byte array
 * @returns {Object} The buffer from the TypedArray
 */
exports.stringToByteBuffer = (string) => {
   var array = new Uint8Array(string.length);
   for (var i = 0, l = string.length; i < l; i++) {
       array[i] = string.charCodeAt(i);
    }
    return array.buffer;
};

/**
 * Get the property name from an object that contains a value
 * 
 * @param {Object} object
 * @param {String} value
 * @returns {String}
 */
global.getKeyByValue = function(object, value) {
  return Object.keys(object).find(key => object[key] === value);
};

/**
 * Test Script
 * 
 * Run this from Safari's remote console to test BLE
 * connectivity between a phone and the lcr daemon.
 **

function 

function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

ble.disconnect('1F1DDF0D-4816-56F8-5BB5-B46B87C4C650');

setTimeout(()=> enableBluetooth((status) => {
	if (status) {
		findDaemon((devices) => {
			devices.map((device) => {
				console.log('Device From Scan - ' + device.name, device);
				if (device.name === 'Cleveland LCR Daemon') {
					connectTo(device.id, (info) => {
						console.log('Checklist Success BLE Connected to Device!!!', info);
						ble.startNotification('1F1DDF0D-4816-56F8-5BB5-B46B87C4C650', '4DD566B5-BA51-4AE5-AD9D-0694349E7205', '4DD566B5-BA51-4AE5-AD9D-0694349E7205', (buffer) => { console.log('BLE Response: ' + bytesToString(buffer)) }, console.log);
						setTimeout(() => {
							console.log('BLE Write ---> status');
							ble.write('1F1DDF0D-4816-56F8-5BB5-B46B87C4C650', '4DD566B5-BA51-4AE5-AD9D-0694349E7205', '4DD566B5-BA51-4AE5-AD9D-0694349E7205', stringToBytes('status'), (data) => { console.log('BLE Write Success', data) }, (data) => { console.log('BLE Write Fail', data) })
						}, 200);
					});
				}
			});
		});
	} else {
		console.log('Checklist Error: Bluetooth not enabled');
	}
}), 200);

 */