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
const SERVICE_UUID = "a113580d-d823-4f1d-a664-104ca3e3c0ec";
const CHAR_UUID = "4dd566b5-ba51-4ae5-ad9d-0694349e7205";
const LcrCharacteristic = require('./ble-lcr-char.js');

module.exports = (device) => {
	let LcrBLE = new LcrCharacteristic();
	LcrBLE.setDevice(device);
	LcrBLE.start();
	
	bleno.on("stateChange", state => {
		if (state === "poweredOn") {
			bleno.startAdvertising("LCR - Cleveland", [SERVICE_UUID], err => {
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