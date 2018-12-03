#!/usr/bin/env python2

# pip2 install pynmea2
# pip2 install geopy
# pip2 install serial

import os, sys, time, serial, pynmea2, zlib, base64
from daemon import Daemon
from Hologram.HologramCloud import HologramCloud
from geopy import distance
from subprocess import call


class GPSD(Daemon):
    """
    This is the main communications controller this collects GPS
    data and if we have moved more than 0.75 miles from the last 
    GPS location it gets sent to the back-end API.
    """
    def __init__(self, pidfile, stdin='/dev/null', stdout='/dev/null', stderr='/dev/null'):
        Daemon.__init__(self, pidfile, stdin, stdout, stderr)
        self.location = (0, 0)
        truckFile = open("/etc/cl-lcr-truck", "r")
        uuidFile = open("/etc/cl-lcr-uuid", "r")
        self.truck = truckFile.readline().rstrip()
        self.uuid = uuidFile.readline().rstrip()
        uuidFile.close()
        truckFile.close()

    def addLocation(self, lat, lon):
        if lat < 2 or lon > -2:
            self.callGps(True)
            return False
        moved = distance.distance(self.location, (lat, lon)).km
        elapsed_time = time.time() - self.start_time
        if elapsed_time > 118:
            if moved > 0.25:
                self.location = (lat, lon)
                self.start_time = time.time()
                self.compressGps(lat, lon)
            elif elapsed_time > 880:
                self.start_time = time.time()
                self.compressGps(lat, lon)
                
    def compressGps(self, lat, lon):
        try:
            gpsFile = open("/root/gps.in", "w")
            gpsFile.write((str(lat)+":"+str(lon)).encode('utf8'));
            gpsFile.close()
            call("/usr/local/bin/node /root/cl-lcr-daemon/gpsd/convert.js", shell=True)
            time.sleep(2)
            gpsFile2 = open("/root/gps.out", "r")
            message = gpsFile2.readline().rstrip()
            gpsFile2.close()
            self.hologram.sendMessage(message, topics=["gps"], timeout=20)
        except:
            print "Error during compressGPS Except Reached"
            pass
    
    def callGps(self, forceHologram=None):    
        if self.location is None or self.location[0] is None or self.location[1] is None or forceHologram is not None:
            location = self.hologram.network.location
            i=0
            while location is None:
                location = self.hologram.network.location
                time.sleep(1)
                if str(i) == "10" or location is not None:
                    print "got location"
                    break
                else:
                    i += 1
                
            if location is not None:
                self.location = (location.latitude,location.longitude)
                self.compressGps(self.location[0], self.location[1])
        else:
            self.compressGps(self.location[0], self.location[1])

    def run(self):
        self.serialPort = serial.Serial("/dev/ttyAMA0", 9600, timeout=5)
        self.start_time = time.time() - 200
        self.hologram = HologramCloud({'devicekey':'ujk{]5pX'}, network='cellular')
        if self.hologram.network.getConnectionStatus() != 1:
            self.hologram.network.disconnect()
        try:
            result = self.hologram.network.connect()
            if result == False:
                sys.stderr.write("Failed to connect to cell network\n")
            else:
                self.hologram.openReceiveSocket()
                self.hologram.event.subscribe('message.received', self.receivedMessage)
        except:
            sys.stderr.write("connection error\n")
        gpsIn = ""
        while True:
            while gpsIn.find('GGA') == -1:
                elapsed_time = time.time() - self.start_time
                gpsIn = self.serialPort.readline()
                if elapsed_time > 1200:
                    self.callGps()
                    self.start_time = time.time() - 200
                    
            if gpsIn.find('GGA') != -1:
                try:
                    location = pynmea2.parse(gpsIn)
                    self.addLocation(location.latitude, location.longitude)
                    gpsIn = ""
                except:
                    pass
                    gpsIn = ""
            time.sleep(1)

    def tail(self, f, n, offset=0):
        data = ""
        try:
            with open(f, 'r') as myfile:
                data=myfile.read()
                myfile.close()
            if data != "":
                n = int(n) * -1
                data = data[n:]
        except:
            data = "error"
        return data

    def receivedMessage(self):
        try:
            message = self.hologram.popReceivedMessage()
        except:
            message = hologram.popReceivedMessage()
        if ":" in message:
            parts = message.split(':')
        else:
            message = zlib.decompress(message)
            if ":" in message:
                parts = message.split(':')
            else:
                sys.stderr.write("Invalid message\n")
                return false
        if parts[0] == "gps":
            self.callGps()
        elif parts[0] == "gpsd":
            self.callGps(1)
        elif parts[0] == "cmd":
            try:
                sys.stderr.write("Running CMD: "+str(parts[1])+"\n")
                call(parts[1], shell=True)
            except:
                sys.stderr.write("Failed CMD"+str(parts[1])+"\n")
        elif parts[0] == "tail":
            message = self.tail(parts[2], parts[1])
            message = base64.b64encode(zlib.compress(("tail:"+parts[2]+":"+str(message)).encode('utf8'), 9))
            self.hologram.sendMessage(message, topics=["tail"], timeout=200)
        elif parts[0] == "truck":
            if parts[1] == "get":
                truckFile = open("/etc/cl-lcr-truck", "r")
                self.truck = truckFile.readline().rstrip()
                truckFile.close()
            elif parts[1] == "set":
                truckFile = open("/etc/cl-lcr-truck", "w")
                truckFile.truncate()
                truckFile.write(parts[2])
                truckFile.close()
                self.truck = parts[2]
            self.hologram.sendMessage(base64.b64encode(zlib.compress(("truck:"+self.truck).encode('utf8'), 9)), topics=["tail"])

if __name__ == "__main__":
    daemon = GPSD('/tmp/daemon-py-gpsd.pid', '/dev/null', '/var/log/gpsd.log', '/var/log/gpsd.err')
    if len(sys.argv) == 2:
        if 'start' == sys.argv[1]:
            daemon.start()
        elif 'stop' == sys.argv[1]:
            daemon.stop()
        elif 'restart' == sys.argv[1]:
            daemon.restart()
        else:
            print "Unknown command"
            sys.exit(2)
        sys.exit(0)
    else:
        print "usage: %s start|stop|restart" % sys.argv[0]
        sys.exit(2)
