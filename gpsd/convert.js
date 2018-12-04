/**
 * Conversion compression for GPS Cords
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

const fs = require('fs');
const gpsInPath = '/root/gps.in';
const gpsOutPath = '/root/gps.out';

try {
	if (fs.existsSync(gpsInPath)) {
		compressGps();
	} else {
		console.log('GPS.in Does Not Exists');
		process.exit(1);
	}
} catch (err) {
	console.log('Error during gps.in exists check', err);
	process.exit(1);
}

/**
 * 
 * @returns {undefined}
 */
function compressGps() {
	try {
		fs.readFile(gpsInPath, { encoding: 'utf-8' }, function(err, data){
			if ( ! err) {
				data = data.trim();

				if (data.indexOf(':') === -1) return process.exit(1);

				let 
					parts = data.split(':'),
					lat = parts[0].toString(),
					lon = parts[1].toString(),
					newLat = '',
					newLon = '';

				if ( ! parseFloat(lon) || ! parseFloat(lat) || lat === "." || lon === "-." || ! lat.length || ! lon.length) {
					console.log('Bad lat or lon');
					return process.exit(0);
				}
				
				lat = lat.replace('.', '').match(/..|./g);
				lon = lon.replace(/\.|\-/g, '').match(/..|./g);
				
				for (var i = 0; i < lat.length; i++) {
					newLat = newLat + String.fromCharCode(lat[i]);
				}

				for (var i = 0; i < lon.length; i++) {
					newLon = newLon + String.fromCharCode(lon[i]);
				}
				
				try {
					fs.writeFile(gpsOutPath, newLat + '~' + newLon, function(err) {
						if (err) return console.log('Unable to write gps.out', err) && process.exit(1);
						process.exit(0);
					}); 
				} catch (err) {
					return console.log('Unable to write gps.out', err) && process.exit(1);
				}
			} else {
				console.log('Unable to open gps.in', err);
				return process.exit(1);
			}
		});
	} catch (err) {
		console.log('Unable to open gps.in', err);
		return process.exit(1);
	}
}