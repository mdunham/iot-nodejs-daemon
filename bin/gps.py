import serial
import pynmea2
from Hologram.HologramCloud import HologramCloud

rstr = ''
gstr = ''
serialPort = serial.Serial("/dev/ttyAMA0", 9600, timeout=5)

while gstr.find('GGA') == -1:
    gstr = serialPort.readline()

msg = pynmea2.parse(gstr)

truckFile = open("/etc/cl-lcr-truck", "r")
uuidFile = open("/etc/cl-lcr-uuid", "r")

truck = truckFile.readline()
uuid = uuidFile.readline()

latitude = str(msg.latitude)
longitude = str(msg.longitude)

credentials = {'devicekey':'ujk{]5pX'}
hologram = HologramCloud(credentials, network='cellular')

#try:
#	result = hologram.network.connect()
#except:
#	print "Connected"

#location = hologram.network.location

#if location is None:
#	location = hologram.network.location

#if location is None:
#	location = false

message = truck+":"+uuid+":"+latitude+","+longitude

#else:
#	message = latitude+","+longitude+"|"+str(location.latitude)+","+str(location.longitude)

response_code = hologram.sendMessage(message,topics=["gps"])

hologram.getResultString(response_code)
print message

hologram.network.disconnect()
