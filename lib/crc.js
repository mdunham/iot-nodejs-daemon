/** 
 * CRC Module - Cyclic Redundancy Check
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

/**
 * Cyclic Redundancy Check - CRC16
 * 
 * This function was ported from C example given in the LCR SDK PDF.
 * 
 * @see ftp://52.165.238.179/public/LCP%20SDK/SF000CD.zip
 * @param {int} byte
 * @param {int} crc
 * @returns {int}
 */
module.exports = (byte, crc) => {
	let XORFlag, i;

	if (crc) {
		for (i = 7; i >= 0; i--) {
			XORFlag = ((crc & 0x8000) !== 0x0000);
			crc <<= 1;
			crc |= ((byte >> i) & 0x01);
			if (XORFlag)
				crc ^= 0x1021;
		}
	}

	return crc;
};
