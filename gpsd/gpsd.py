#!/usr/bin/env python2

# pip2 install pynmea2
# pip2 install geopy
# pip2 install serial

import os, sys, time, serial, pynmea2, zlib
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
        moved = distance.distance(self.location, (lat, lon)).km
        elapsed_time = time.time() - self.start_time
        if moved > 0.75:
            self.location = (lat, lon)
            if elapsed_time > 300:
                self.start_time = time.time()
                message = zlib.compress(self.truck+":"+str(lat)+":"+str(lon))
                self.hologram.sendMessage(message, topics=["gps"])

    def run(self):
        self.serialPort = serial.Serial("/dev/ttyAMA0", 9600, timeout=5)
        self.start_time = 0
        self.hologram = HologramCloud({'devicekey':'ujk{]5pX'}, network='cellular')
        try:
            self.hologram.network.disconnect()
        except:
            pass
        try:
            result = self.hologram.network.connect()
            if result == False:
                print "Failed to connect to cell network"
            else:
                self.hologram.openReceiveSocket()
                self.hologram.event.subscribe('message.received', self.receivedMessage)
        except:
            print "connection error"
            self.restart()
        while True:
            gpsIn = self.serialPort.readline()
            if gpsIn.find('GGA') == -1:
                try:
                    location = pynmea2.parse(gpsIn)
                    self.addLocation(self, location.latitude, location.longitude)
                except:
                   pass
                time.sleep(1)

    def tail(f, n, offset=0):
        stdin,stdout = os.popen2("tail -n "+n+offset+" "+f)
        stdin.close()
        lines = stdout.readlines(); stdout.close()
        return lines[:,-offset]

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
                print "Invalid message received"
                return False
        if parts[0] == "gps":
            message = zlib.compress(self.truck+":"+str(self.location[0])+":"+str(self.location[1]))
            self.hologram.sendMessage(message, topics=["gps"])
        elif parts[0] == "cmd":
            del parts[0]
            try:
                call(parts[1], shell=True)
            except:
                pass
        elif parts[0] == "tail":
            del parts[0]
            message = self.tail(parts[2], parts[1])
            self.hologram.sendMessage(zlib.compress(message), topics=["tail"])
        elif parts[0] == "truck_id":
            truckFile = open("/etc/cl-lcr-truck", "w")
            truckFile.truncate()
            truckFile.write(parts[1])
            truckFile.close()

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
