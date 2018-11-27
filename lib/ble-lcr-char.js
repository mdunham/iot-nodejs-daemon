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
		this.user_id = '';
		this.truck_id = '12ca4bcc-8938-4bc7-8c21-d2098a7e55ee';
		this.updateValueCallback = null;
		this._device = null;
		var self = this;
		require('fs').readFile('/etc/cl-lcr-truck', (err, data) => {
			if (err) console.log('Error Reading Truck ID');
			else self.truck_id = data;
		});
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
		var self = this, cmdArgs = data.toString();

		if (cmdArgs.indexOf('||') !== -1) {
			cmdArgs = cmdArgs.split('||');
		} else {
			cmdArgs = [cmdArgs];
		}

		console.log('BLE - onWriteRequest:', cmdArgs);

		if (this.updateValueCallback) {
			console.log('BLE - onWriteRequest: notifying', parseInt(data));
			switch (cmdArgs[0]) {
				case 'truck':
					this.updateValueCallback(new Buffer('ok|' + self.truck_id));	
					break;
				case 'status':
					this._device.checkStatus((status, productID, productName) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + productName + '|' + productID));
							console.log('----- STATUS CHECK PASS -----');
							console.log('ProductID: ' + productID + ' - Product Name: ' + productName);
						} else {
							console.log('----- STATUS CHECK FAIL -----');
						}
					});
					break;
				case 'delivery_status':
					this._device.getDeliveryStatus((status, deliveryStatus) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + JSON.stringify(deliveryStatus)));
							console.log('----- DELIVERY STATUS CHECK PASS -----', deliveryStatus);
						} else {
							console.log('----- DELIVERY STATUS CHECK FAIL -----');
						}
					});
					break;
				case 'delivery_status':
					this._device.getDeliveryStatus((status, deliveryStatus) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + JSON.stringify(deliveryStatus)));
							console.log('----- DELIVERY STATUS CHECK PASS -----', deliveryStatus);
						} else {
							console.log('----- DELIVERY STATUS CHECK FAIL -----');
						}
					});
					break;
				case 'new_delivery':
					this._device.activatePumpPrint((status, returnCode) => {
						if (status) {
							let
								arr = new ArrayBuffer(4),
								view = new DataView(arr);
							view.setInt32(0, parseInt(cmdArgs[1]), false);
							this._device.setField(0x05, [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)], (status, returnCode) => {});
							this.updateValueCallback(new Buffer('ok|' + returnCode));
							setTimeout(function(){
								this._device.command(0, (status) => console.log('Started the pump', status));
							}, 10000);
							console.log('----- NEW ORDER CHECK PASS -----', returnCode);
						} else {
							console.log('----- NEW ORDER CHECK FAIL -----');
						}
					});
					break;
				case 'get_totalizer':
					this._device.getField(0x64, (status, deviceByte, data) => {
						let
							totalizer,
							buf = new ArrayBuffer(4),
							view = new DataView(buf);

						data.forEach(function (b, i) {
							view.setUint8(i, parseInt(b, 16));
						});

						totalizer = view.getInt32(0);
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + totalizer));
							console.log('----- GET TOTALIZER PASS -----', totalizer);
						} else {
							console.log('----- GET TOTALIZER FAIL -----');
						}
					});
					break;
				case 'get_gross':
					this._device.getField(0x02, (status, deviceByte, data) => {
						let
							totalizer,
							buf = new ArrayBuffer(4),
							view = new DataView(buf);

						data.forEach(function (b, i) {
							view.setUint8(i, parseInt(b, 16));
						});

						totalizer = view.getInt32(0);
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + totalizer));
							console.log('----- GET GROSS PASS -----', totalizer);
						} else {
							console.log('----- GET GROSS FAIL -----');
						}
					});
					break;
				case 'delete_transaction':
					this._device.removeTransaction((status, returnStatus) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + returnStatus));
							console.log('----- DELETE TRANSACTION PASS -----', returnStatus);
						} else {
							console.log('----- DELETE TRANSACTION FAIL -----');
						}
					});
					break;
				case 'get_transaction':
					this._device.getTransaction((status, returnStatus, record) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + returnStatus + '|' + JSON.stringify(record)));
							console.log('----- GET TRANSACTION PASS -----');
							console.log(record);
						} else {
							console.log('----- GET TRANSACTION FAIL -----');
						}
					});
					break;
				case 'gps':
					var spawn = require("child_process").spawn, output = '', udp = this.updateValueCallback;
					var process = spawn('python2', ['/root/cl-lcr-daemon/bin/gps.py']);
					process.stdout.on('data', function (data) {
						output = output + data.toString();
					});
					process.on('close', (code) => {
						console.log(`child process exited with code ${code}`);
						udp(new Buffer(output));
					});
					break;
				case 'get_field':
					if (cmdArgs.length < 2) {
						console.log('Invalid field number');
						this.updateValueCallback(new Buffer('error|Invalid field number'));
						return false;
					}
					this._device.getField(cmdArgs[1], cmdArgs[2], (status, deviceByte, value) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + deviceByte + '|' + value));
							console.log('----- GET FIELD PASS -----');
							console.log('Device Byte: ' + deviceByte + ' - Value: ' + value);
						} else {
							this.updateValueCallback(new Buffer('error|Bad status returned|' + status));
							console.log('----- GET FIELD FAIL -----');
						}
					});
					break;
				case 'get_field_params':
					if (cmdArgs.length < 3) {
						console.log('Invalid field number');
						this.updateValueCallback(new Buffer('error|Invalid field number'));
						return false;
					}
					this._device.getFieldParams(cmdArgs[1], cmdArgs[2], (status, params) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + JSON.stringify(params)));
							console.log('----- GET FIELD PARAMS PASS -----');
							console.log('Params: ', params);
						} else {
							this.updateValueCallback(new Buffer('error|Bad status returned|' + status));
							console.log('----- GET FIELD PARAMS FAIL -----');
						}
					});
					break;
				default:
					this.updateValueCallback(new Buffer('error|Invalid command|' + cmdArgs[0]));
			}
		}
		callback(this.RESULT_SUCCESS);
	}

	onReadRequest(offset, callback) {
		var data = new Buffer(2);
		data.writeUInt16BE(1 << 4, 0);
		callback(this.RESULT_SUCCESS, data);
	}

	sendNotification(value) {
		if (this.updateValueCallback) {
			const notificationBytes = new Buffer();
			notificationBytes.writeInt16LE(value);
			this.updateValueCallback(notificationBytes);
		}
	}

	start() {
		
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
