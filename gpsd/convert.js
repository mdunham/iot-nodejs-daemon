/**
 * Conversion compression for GPS Cords
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

const 
	fs = require('fs'),
	gpsInPath = '/root/gps.in',
	gpsOutPath = '/root/gps.out';

try {
	if (fs.existsSync(gpsInPath)) {
		compressGps();
	} else {
		console.log('GPS.in Does Not Exists', err);
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
				data = data.rtrim();

				if (data.indexOf(':') === -1) return process.exit(1);

				let 
					parts = data.split(':'),
					lat = parts[0],
					lon = parts[1],
					newLat = '',
					newLon = '';

				lat = lat.toString().replace('.', '');
				lon = lon.toString().replace(/\.|\-/g, '');
				if ( ! parseInt(lat) || ! parseInt(lon)) return console.log('Empty or zeroed lat/lon') && process.exit(1);

				lat = lat.match(/..|./g);
				lon = lon.match(/..|./g);

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
		return console.log('Unable to open gps.in', err) && process.exit(1);
	}
}