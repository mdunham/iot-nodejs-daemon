/**
 * BLE LCR Characteristic Module
 * 
 * This is class handles the bluetooth read/write/updates
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const bleno = require('bleno');
const SERVICE_UUID = "a113580d-d823-4f1d-a664-104ca3e3c0ec";
const CHAR_UUID = "4dd566b5-ba51-4ae5-ad9d-0694349e7205";

class LcrCharacteristic extends bleno.Characteristic {
	constructor() {
		super({
			uuid: CHAR_UUID,
			properties: ['read', 'write', 'notify'],
			value: null
		});

		this._user = new Buffer(0);
		this.counter = 0;
		this.updateValueCallback = null;
		this._device = null;
	}
	
	setDevice(device) {
		this._device = device;
	}
	
	onSubscribe(maxValueSize, updateValueCallback) {
		console.log(`Counter subscribed, max value size is ${maxValueSize}`);
		this.updateValueCallback = updateValueCallback;
	}

	onUnsubscribe() {
		console.log("Counter unsubscribed");
		this.updateValueCallback = null;
	}

	onWriteRequest(data, offset, withoutResponse, callback) {
		var self = this;
		this._user = data;
		console.log('BLE - onWriteRequest: value = ' + this._user.toString('hex'));
		if (this.updateValueCallback) {
			console.log('BLE - onWriteRequest: notifying');
			if (parseInt(data) === 126) {
				device.checkStatus((status, productID, productName) => {
					if (status) {
						$this.updateValueCallback(new Buffer('ok|' + productName + '|' + productID));
						console.log('----- STATUS CHECK PASS -----');
						console.log('ProductID: ' + productID + ' - Product Name: ' + productName);
					} else {
						console.log('----- STATUS CHECK FAIL -----');
					}
				});
			} else {
				this.updateValueCallback(new Buffer('no data'));
			}
		}
		callback(this.RESULT_SUCCESS);
	}
	
	onReadRequest(offset, callback) {
		console.log('Read??: ' , offset);
		var data = new Buffer(2);
		data.writeUInt16BE(1<<4, 0);
		callback(this.RESULT_SUCCESS, data);
	}
	
	sendNotification(value) {
		if (this.updateValueCallback) {
			console.log(`Sending notification with value ${value}`);
			const notificationBytes = new Buffer();
			notificationBytes.writeInt16LE(value);
			this.updateValueCallback(notificationBytes);
		}
	}

	start() {
		console.log('What am I supposed to start?');
		//this.hanle = setInterval(() => {
		//	console.log('Heart Beat BLE');
		//}, 2500);
	}

	stop() {
		console.log("Stopping counter");
		clearInterval(this.handle);
		this.handle = null;
	}
}

module.exports.LcrCharacteristic = LcrCharacteristic;
module.exports.CHAR_UUID = CHAR_UUID;
module.exports.SERVICE_UUID = SERVICE_UUID;
