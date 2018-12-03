/**
 * Conversion compression for GPS Cords
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

var fs = require('fs');

fs.readFile('/root/gps.in', { encoding: 'utf-8' }, function(err, data){
    if ( ! err) {
        data = data.trim();
		var 
			parts = data.split(':'),
			lat = parts[0],
			lon = parts[1],
			newLat = '',
			newLon = '';
			
		lat = lat.toString().replace('.', '');
		lon = lon.toString().replace(/\.|\-/g, '');
		lat = lat.match(/..|./g);
		lon = lon.match(/..|./g);
		
		for (var i = 0; i < lat.length; i++) {
			newLat = newLat + String.fromCharCode(lat[i]);
		}

		for (var i = 0; i < lon.length; i++) {
			newLon = newLon + String.fromCharCode(lon[i]);
		}
		
		fs.writeFile("/root/gps.out", newLat + '~' + newLon, function(err) {
			if(err) {
				return console.log('Unable to write gps.out', err);
			}
			process.exit(0);
		}); 
    } else {
        console.log(err);
    }
});

