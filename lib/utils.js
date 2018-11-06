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
exports.bytesToString = (byteArray) => {
	if ('object' !== typeof byteArray) return '';
	let output = '';
	for (var i = 0; i < byteArray.length; i += 2)
		output += String.fromCharCode(byteArray[i]);
	return output;
};

/**
 * Makes working with byte messages alot easier than using substring
 * 
 * @param {string} data Hex data string
 * @returns {object}
 */
exports.byteData = function(data) {
	let self = this;
	
	self.data = data;
	
	self.getByte = (offset, length) => {
		return self.data.substr(offset * 2, length * 2);
	};
	
	self.toString = () => data;
	
	return self;
};

/**
 * Convert an array of bytes to HEX
 * 
 * @param {Array} byteArray
 * @returns {String}
 */
exports.bytesToHex = (byteArray) => {
	if ( ! byteArray) return '';
	let hexStr = '';
	for (var i = 0; i < byteArray.length; i++) {
		var hex = (byteArray[i] & 0xff).toString(16);
		hex = (hex.length === 1) ? '0' + hex : hex;
		hexStr = hexStr + hex.toUpperCase();
	}
	return hexStr;
};


