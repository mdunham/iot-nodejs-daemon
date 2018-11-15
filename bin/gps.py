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

truck = truckFile.readline().rstrip()
uuid = uuidFile.readline().rstrip()

latitude = str(msg.latitude)
longitude = str(msg.longitude)

credentials = {'devicekey':'ujk{]5pX'}
hologram = HologramCloud(credentials, network='cellular')

message = truck+":"+uuid+":"+latitude+":"+longitude

response_code = hologram.sendMessage(message,topics=["gps"])

hologram.getResultString(response_code)
print message

hologram.network.disconnect()
