import serial
import pynmea2

from Hologram.HologramCloud import HologramCloud

gstr = ''
serialPort = serial.Serial("/dev/ttyAMA0", 9600, timeout=5)

while gstr.find('GGA') == -1:
    gstr = serialPort.readline()

msg = pynmea2.parse(gstr)
print msg
print msg.latitude
print msg.longitude

latitude = str(msg.latitude)
longitude = str(msg.longitude)

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
	message = latitude+","+longitude+"|"+str(location.latitude)+","+str(location.longitude)

response_code = hologram.sendMessage(message,topics=["gmail"])

hologram.getResultString(response_code)
print message

hologram.network.disconnect()
