/**
 * BLE LCR Characteristic Module
 * 
 * This is class handles the bluetooth read/write/updates
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const lcFlags      = require('./lc-flags.js');
const bleno        = require('bleno');
const SERVICE_UUID = "a113580d-d823-4f1d-a664-104ca3e3c0ec";
const CHAR_UUID    = "4dd566b5-ba51-4ae5-ad9d-0694349e7205";

class LcrCharacteristic extends bleno.Characteristic {
	constructor() {
		super({
			uuid: CHAR_UUID,
			properties: ['read', 'write', 'notify'],
			value: null
		});
		this.handle = '';
		this.user_id = '';
		this.truck_id = '12ca4bcc-8938-4bc7-8c21-d2098a7e55ee';
		this.updateValueCallback = null;
		this._device = null;
		var self = this;
		require('fs').readFile('/etc/cl-lcr-truck', (err, data) => {
			if (err) console.info('Error Reading Truck ID');
			else self.truck_id = data;
		});
	}

	setDevice(device) {
		this._device = device;
	}

	onSubscribe(maxValueSize, updateValueCallback) {
		console.info(`Counter subscribed, max value size is ${maxValueSize}`);
		this.updateValueCallback = updateValueCallback;
	}

	onUnsubscribe() {
		console.info("Counter unsubscribed");
		this.updateValueCallback = null;
	}

	onWriteRequest(data, offset, withoutResponse, callback) {
		var self = this, cmdArgs = data.toString();

		if (cmdArgs.indexOf('||') !== -1) {
			cmdArgs = cmdArgs.split('||');
		} else {
			cmdArgs = [cmdArgs];
		}

		console.info('BLE - onWriteRequest:', cmdArgs);

		if (this.updateValueCallback) {
			console.info('BLE - onWriteRequest: notifying', parseInt(data));
			switch (cmdArgs[0]) {
				case 'truck':
					this.updateValueCallback(new Buffer('ok|' + self.truck_id));	
					break;
				case 'status':
					this._device.checkStatus((status, productID, productName) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + productName + '|' + productID));
							console.info('----- STATUS CHECK PASS -----');
							console.info('ProductID: ' + productID + ' - Product Name: ' + productName);
						} else {
							console.info('----- STATUS CHECK FAIL -----');
						}
					});
					break;
				case 'delivery_status':
					this._device.getDeliveryStatus((status, deliveryStatus) => {
						if (status) {
							this.updateValueCallback(new Buffer(deliveryStatus.returnCode + ' ' + deliveryStatus.deviceStatus + ' ' + deliveryStatus.deliveryStatus + ' ' + deliveryStatus.deliveryCode));
							console.info('----- DELIVERY STATUS CHECK PASS -----', deliveryStatus);
						} else {
							console.info('----- DELIVERY STATUS CHECK FAIL -----');
						}
					});
					break;
//				case 'delivery_status':
//					this._device.getDeliveryStatus((status, deliveryStatus) => {
//						if (status) {
//							this.updateValueCallback(new Buffer('ok|' + JSON.stringify(deliveryStatus)));
//							console.info('----- DELIVERY STATUS CHECK PASS -----', deliveryStatus);
//						} else {
//							console.info('----- DELIVERY STATUS CHECK FAIL -----');
//						}
//					});
//					break;
				case 'sync':
					this.handle = setInterval(() => {
						if (this.updateValueCallback) {
							this.updateValueCallback(new Buffer('sync|' + JSON.stringify(this._device.getSyncStatus())));
							console.info('----- SYNC -----', JSON.stringify(this._device.getSyncStatus()));
						} else {
							console.info('----- SYNC FAIL -----');
						}
					}, 3000);
					break;
				case 'new_delivery':
					// need to set the device into factory mode and calibrate the system to disable 
					// requiring a ticket when using the app disable it after 
					// check if a password is needed for new deliveries or new shifts
					// check if customer number is needed for preset delivery
					// add the option to deliver with preset or manual
					// add the prompts to the mobile app for switch toggling
					this._device.command(lcFlags.commands.START_RESUME_DELIVERY, (status, returnCode, deviceStatus) => {
						if ( ! status) {
							console.info('Command Failed');
							this.updateValueCallback(new Buffer('fail'));
						} else {
							this.updateValueCallback(new Buffer('ok|' + returnCode + '|' + deviceStatus));
						}
					});
//					this._device.activatePumpPrint((status, returnCode) => {
//						if (status) {
//							var
//								arr = new ArrayBuffer(4),
//								view = new DataView(arr),
//								netPreset = this._device.paddedDecimal(cmdArgs[1]);
//								
//							view.setInt32(0, netPreset.replace('.', ''), false);
//							this._device.setField(0x06, [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)], (status, returnCode) => {
//								this.updateValueCallback(new Buffer(((status) ? 'ok' : 'fail') + '|' + returnCode + '|set_net_preset|' + netPreset));
//								
//								this._device.command(0x00, (status, returnCode) => {
//									this.updateValueCallback(new Buffer(((status) ? 'ok' : 'fail') + '|' + returnCode + '|flow_start'));
//									this._device.setField(0x06, [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)], (status, returnCode) => {
//										this.updateValueCallback(new Buffer(((status) ? 'ok' : 'fail') + '|' + returnCode + '|set_net_preset|' + netPreset));
//
//										this._device.command(0x00, (status, returnCode) => {
//											this.updateValueCallback(new Buffer(((status) ? 'ok' : 'fail') + '|' + returnCode + '|flow_start'));
//											this._device.setField(0x06, [view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)], (status, returnCode) => {
//												this.updateValueCallback(new Buffer(((status) ? 'ok' : 'fail') + '|' + returnCode + '|set_net_preset|' + netPreset));
//
//												this._device.command(0x00, (status, returnCode) => {
//													this.updateValueCallback(new Buffer(((status) ? 'ok' : 'fail') + '|' + returnCode + '|flow_start'));
//												});
//											});
//										});
//									});
//								});
//							});
//						}
//						
//						this.updateValueCallback(new Buffer(((status) ? 'ok' : 'fail') + '|' + returnCode + '|pump_activated'));
//					});
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
							console.info('----- GET TOTALIZER PASS -----', totalizer);
						} else {
							console.info('----- GET TOTALIZER FAIL -----');
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
							console.info('----- GET GROSS PASS -----', totalizer);
						} else {
							console.info('----- GET GROSS FAIL -----');
						}
					});
					break;
				case 'delete_transaction':
					this._device.removeTransaction((status, returnStatus) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + returnStatus));
							console.info('----- DELETE TRANSACTION PASS -----', returnStatus);
						} else {
							console.info('----- DELETE TRANSACTION FAIL -----');
						}
					});
					break;
				case 'get_transaction':
					this._device.getTransaction((status, returnStatus, record) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + returnStatus + '|' + JSON.stringify(record)));
							console.info('----- GET TRANSACTION PASS -----');
							console.info(record);
						} else {
							console.info('----- GET TRANSACTION FAIL -----');
						}
					});
					break;
				case 'set_field':
					if (cmdArgs.length < 2) {
							console.info('Invalid field number');
							this.updateValueCallback(new Buffer('error|Invalid field number'));
							return false;
					}
					this._device.setField(cmdArgs[1], parseInt(cmdArgs[2]), (status, deviceByte, value) => {
							if (status) {
									this.updateValueCallback(new Buffer('ok|' + deviceByte + '|' + value));
									console.info('----- GET FIELD PASS -----');
									console.info('Device Byte: ' + deviceByte + ' - Value: ' + value);
							} else {
									this.updateValueCallback(new Buffer('error|Bad status returned|' + status));
									console.info('----- GET FIELD FAIL -----');
							}
					});
					break;
				case 'get_field':
					if (cmdArgs.length < 2) {
						console.info('Invalid field number');
						this.updateValueCallback(new Buffer('error|Invalid field number'));
						return false;
					}
					this._device.getField(cmdArgs[1], (status, deviceByte, value) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + deviceByte + '|' + value));
							console.info('----- GET FIELD PASS -----');
							console.info('Device Byte: ' + deviceByte + ' - Value: ' + value);
						} else {
							this.updateValueCallback(new Buffer('error|Bad status returned|' + status));
							console.info('----- GET FIELD FAIL -----');
						}
					});
					break;
				case 'get_field_params':
					if (cmdArgs.length < 3) {
						console.info('Invalid field number');
						this.updateValueCallback(new Buffer('error|Invalid field number'));
						return false;
					}
					this._device.getFieldParams(cmdArgs[1], cmdArgs[2], (status, params) => {
						if (status) {
							this.updateValueCallback(new Buffer('ok|' + JSON.stringify(params)));
							console.info('----- GET FIELD PARAMS PASS -----');
							console.info('Params: ', params);
						} else {
							this.updateValueCallback(new Buffer('error|Bad status returned|' + status));
							console.info('----- GET FIELD PARAMS FAIL -----');
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
		data.writeUInt16LE(1 << 4, 0);
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
		console.info("Stopping counter");
		clearInterval(this.handle);
		this.handle = null;
	}
}

module.exports.LcrCharacteristic = LcrCharacteristic;
module.exports.CHAR_UUID = CHAR_UUID;
module.exports.SERVICE_UUID = SERVICE_UUID;
