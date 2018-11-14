import serial
import pynmea2

from Hologram.HologramCloud import HologramCloud

str = ''
#Get GPS Location
serialPort = serial.Serial("/dev/ttyAMA0", 9600, timeout=5)

#Wait until we have a valid location
while str.find('GGA') == -1:
    str = serialPort.readline()

#parse the string for latitude and longitude
msg = pynmea2.parse(str)
print msg
print msg.latitude
print msg.longitude

latitude = msg.latitude
longitude = msg.longitude

#Set the sign of the latitude based on the direction (N/S)
#if msg.lat_dir == 'S':
#    latitude = '-' + latitude

#Set the sign of the longitude based on the direction (E/W)
#if msg.lon_dir == 'W':
#    longitude = '-' + longitude

#Get a hologram instance and connect
credentials = {'devicekey':'ujk{]5pX'}
hologram = HologramCloud(credentials, network='cellular')

try:
	result = hologram.network.connect()
except:
	print "Connected"

location = hologram.network.location

if location is None:
	location = hologram.network.location

if location is None:
	location = false
	message = latitude+","+longitude
else:
	message = latitude+","+longitude+"|"+location.latitude+","+location.longitude

if result == False:
    print ' Failed to connect to cell network'

#Our message will be a google maps link that will show the current location

#print message

#Send the message
response_code = hologram.sendMessage(message,topics=["gmail"])

hologram.getResultString(response_code)
print message

#Disconnect
hologram.network.disconnect()
