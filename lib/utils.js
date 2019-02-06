/** 
 * Hex and Ascii Utilities
 * 
 * This module contains utility methods used by the LCR module.
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

const util    = require('util');
const fs      = require('fs');
const lcrLog  = fs.createWriteStream('/var/log/lcr-totals.log', { flags: 'a' });
const stdFile = fs.createWriteStream('/var/log/lcr.log', { flags: 'a' }); 
const getTime = () => {
	let m = new Date();
	return	("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
		("0" + m.getUTCDate()).slice(-2) + " " +
		("0" + m.getUTCHours()).slice(-2) + ":" +
		("0" + m.getUTCMinutes()).slice(-2);
};

console.lcr = function() {
	let msg = getTime() + ' - ' + util.format.apply(null, arguments) + '\n';
	lcrLog.write(msg);
	console.info(msg);
};

console.info = function() {
	if (process.argv && process.argv.length  && process.argv.slice(-1)[0] === 'debug') {
		process.stdout.write(getTime() + ' - ' + util.format.apply(null, arguments) + '\n');
	}
};

console.error = console.log = function() {
	stdFile.write(getTime() + ' - ' + util.format.apply(null, arguments) + '\n');
	if (process.argv && process.argv.length  && process.argv.slice(-1)[0] === 'debug') {
		process.stdout.write(getTime() + ' - ' + util.format.apply(null, arguments) + '\n');
	}
};

console.log(process.argv.slice(-1));

if ( ! String.prototype.splice) {
    /**
     * {JSDoc}
     *
     * The splice() method changes the content of a string by removing a range of
     * characters and/or adding new characters.
     *
     * @this {String}
     * @param {number} start Index at which to start changing the string.
     * @param {number} delCount An integer indicating the number of old chars to remove.
     * @param {string} newSubStr The String that is spliced in.
     * @return {string} A new string with the spliced substring.
     */
    String.prototype.splice = function(start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}

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
 * @param {int} decimals
 * @returns {String}
 */
exports.toVolume = (byteArray, decimals) => {
	try {
		if ('string' === typeof byteArray) byteArray.match(/../g);
		if ('object' !== typeof byteArray) return '';
		var
			buf = new ArrayBuffer(4),
			view = new DataView(buf),
			int32 = 0;
			console.log('Byte Array for volume: ' + byteArray.join(' - '),byteArray);
		byteArray.forEach(function (b, i) {
			view.setUint8(i, parseInt(b, 16));
		});

		int32 = (view.getInt32(0)).toString();

		if ( ! decimals && decimals !== 0) return int32;
		return ! decimals ? int32 : 
			int32.substr(0, int32.length - decimals) + '.' + int32.substr(-decimals);
	} catch (e) {
		
	}
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
 * @param {int} decimals
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
		if (i > 3) { 
			console.error('Trying to go toUint32 but there were more bytes than buffer...', byteArray, decimals);
		}
		view.setUint8(i, parseInt(b, 16));
	});

	int32 = (view.getUint32(0)).toString();

	if ( ! decimals && decimals !== 0) return int32;
	return ! decimals ? int32 : 
		int32.substring(0, int32.length - decimals) + '.' + int32.substr(-decimals);
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

