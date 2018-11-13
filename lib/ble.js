/**
 * Bluetooth Service Module
 * 
 * Broadcasts a BLE signal so that drivers can use their Cleveland Driver's
 * mobile application to communicate with a Raspberry Pi. 
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 * @see https://github.com/noble/bleno
 */

"use strict";

const bleno = require("bleno");
const events = require('events');
const character = require('./ble-lcr-char.js');

const SERVICE_UUID = character.SERVICE_UUID;
const CHAR_UUID = character.CHAR_UUID;
const device_name = 'Cleveland LCR Daemon';

process.env['BLENO_DEVICE_NAME'] = device_name;

module.exports = function(device) {
	let LcrBLE = new character.LcrCharacteristic();
	LcrBLE.setDevice(device);
	LcrBLE.start();
	
	bleno.on("stateChange", state => {
		if (state === "poweredOn") {
			bleno.startAdvertising(device_name, [SERVICE_UUID], err => {
				if (err) console.log(err);
			});
		} else {
			console.log("Stopping...");
			LcrBLE.stop();
			bleno.stopAdvertising();
		}        
	});

	bleno.on("advertisingStart", err => {
		console.log("Configuring services...");
		if (err) {
			console.error(err);
			return;
		}
		let service = new bleno.PrimaryService({
			uuid: CHAR_UUID,
			characteristics: [LcrBLE]
		});
		bleno.setServices([service], err => {
			if(err)
				console.log(err);
			else
				console.log("Services configured");
		});
	});

	bleno.on("stateChange", state => console.log(`BLE: Adapter changed state to ${state}`));
	bleno.on("advertisingStart", err => console.log("BLE: advertisingStart"));
	bleno.on("advertisingStartError", err => console.log("BLE: advertisingStartError"));
	bleno.on("advertisingStop", err => console.log("BLE: advertisingStop"));
	bleno.on("servicesSet", err => console.log("BLE: servicesSet"));
	bleno.on("servicesSetError", err => console.log("BLE: servicesSetError"));
	bleno.on("accept", clientAddress => console.log(`BLE: accept ${clientAddress}`));
	bleno.on("disconnect", clientAddress => console.log(`BLE: disconnect ${clientAddress}`));
};
