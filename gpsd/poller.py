#!/usr/bin/python
 
import os
from gps import *
from time import *
import time
from subprocess import call
import threading

gpsd = None
class GpsPoller(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        global gpsd
        try:
            gpsd = gps(mode=WATCH_ENABLE)
        except:
            call("/usr/sbin/gpsd /dev/ttyAMA0 -F /var/run/gpsd.sock", shell=True)
        self.current_value = None
        self.running = True
     
    def run(self):
        global gpsd
        while gpsp.running:
            try:
                gpsd.next()
            except:
                pass 

if __name__ == '__main__':
    try:
        gpsp = GpsPoller()
        gpsp.start()
        loopCount = 0
        while True:
            try:
                loopCount += 1
                if str(gpsd.fix.latitude) != "nan" and str(gpsd.fix.latitude) != "0.0" and gpsd.fix.latitude is not None:
                    gpsFile = open("/root/gps.in", "w")
                    gpsFile.write(str(gpsd.fix.latitude)+":"+str(gpsd.fix.longitude)+":"+str(gpsd.fix.speed));
                    gpsFile.close()
                elif loopCount > 15:
                    loopCount = 0
                    call("/usr/sbin/gpsd /dev/ttyAMA0 -F /var/run/gpsd.sock", shell=True)
            except:
                pass
            time.sleep(0.5)
    except (KeyboardInterrupt, SystemExit): #when you press ctrl+c
        print "\nKilling Thread..."
        gpsp.running = False
        gpsp.join()   
