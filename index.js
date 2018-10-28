/**
 * Initialization script for the Cleveland-LCR Daemon
 * 
 * useage: node index.js [--debug=true|false] [--lcrCom=ttyUSB0]
 * flags: 
 *     debug - Will cause the script to run verbose.
 *     lcrCom - The com device for the LCR Meter. Defaults to ttyUSB0.
 *     
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

// Serial Comms Demo

var 
	count = 0,
	SerialPort = require('serialport'),
	Readline = require('@serialport/parser-readline'),
	port = new SerialPort('/dev/ttyUSB0', {baudRate: 19200});

function hex(str) {
	var arr = [];
	for (var i = 0, l = str.length; i < l; i++) {
		var ascii = str.charCodeAt(i);
		arr.push(ascii);
	}
	arr.push(255);
	arr.push(255);
	arr.push(255);
	return new Buffer(arr);
}

function hexToString(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

port.on('readable', function () {
	console.log('From Device: ', port.read());
});

setTimeout(() => {
	port.write(new Buffer.from([0x7E, 0x7E, 0xFA, 0xFF, 0x02, 0x01, 0x00, 0x2F, 0x34]), function (err) {	
		if (err) {
			return console.log('Error on write: ', err.message);
		}
		console.log('Sent To Device: ', new Buffer.from([0x7E, 0x7E, 0xFA, 0xFF, 0x02, 0x01, 0x00, 0x2F, 0x34]));
	});
}, 2000);

// End of Serial Comms Demo







// Bluetooth Demo

const bleno = require("bleno");

console.log("Starting bleno...");

const COUNTER_SERVICE_UUID = "00010000-9FAB-43C8-9231-40F6E305F96D";
const COUNTER_CHAR_UUID = "00010001-9FAB-43C8-9231-40F6E305F96D";


class CounterCharacteristic extends bleno.Characteristic {
    constructor() {
        super({
            uuid: COUNTER_CHAR_UUID,
            properties: ["notify"],
            value: null
        });

        this.counter = 0;
    }

    onSubscribe(maxValueSize, updateValueCallback) {
        console.log(`Counter subscribed, max value size is ${maxValueSize}`);
        this.updateValueCallback = updateValueCallback;
    }

    onUnsubscribe() {
        console.log("Counter unsubscribed");
        this.updateValueCallback = null;
    }    

    sendNotification(value) {
        if(this.updateValueCallback) {
            console.log(`Sending notification with value ${value}`);

            const notificationBytes = new Buffer(2);
            notificationBytes.writeInt16LE(value);

            this.updateValueCallback(notificationBytes);
        }
    }

    start() {
        console.log("Starting counter");
        this.handle = setInterval(() => {
            this.counter = (this.counter + 1) % 0xFFFF;
            this.sendNotification(this.counter);
        }, 1000);
    }

    stop() {
        console.log("Stopping counter");
        clearInterval(this.handle);
        this.handle = null;
    }
}

let counter = new CounterCharacteristic();
counter.start();


bleno.on("stateChange", state => {

    if (state === "poweredOn") {
        
        bleno.startAdvertising("Counter", [COUNTER_SERVICE_UUID], err => {
            if (err) console.log(err);
        });

    } else {
        console.log("Stopping...");
        counter.stop();
        bleno.stopAdvertising();
    }        
});

bleno.on("advertisingStart", err => {

    console.log("Configuring services...");
    
    if(err) {
        console.error(err);
        return;
    }

    let service = new bleno.PrimaryService({
        uuid: COUNTER_CHAR_UUID,
        characteristics: [counter]
    });

    bleno.setServices([service], err => {
        if(err)
            console.log(err);
        else
            console.log("Services configured");
    });
});

// some diagnostics 
bleno.on("stateChange", state => console.log(`Bleno: Adapter changed state to ${state}`));

bleno.on("advertisingStart", err => console.log("Bleno: advertisingStart"));
bleno.on("advertisingStartError", err => console.log("Bleno: advertisingStartError"));
bleno.on("advertisingStop", err => console.log("Bleno: advertisingStop"));

bleno.on("servicesSet", err => console.log("Bleno: servicesSet"));
bleno.on("servicesSetError", err => console.log("Bleno: servicesSetError"));

bleno.on("accept", clientAddress => console.log(`Bleno: accept ${clientAddress}`));
bleno.on("disconnect", clientAddress => console.log(`Bleno: disconnect ${clientAddress}`));

// End of Bluetooth Dmeo