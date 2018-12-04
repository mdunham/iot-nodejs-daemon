#! /usr/bin/python
 
import os
from gps import *
from time import *
import time
import threading
 
gpsd = None
class GpsPoller(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        global gpsd #bring it in scope
        gpsd = gps(mode=WATCH_ENABLE) #starting the stream of info
        self.current_value = None
        self.running = True #setting the thread running to true
 
    def run(self):
        global gpsd
        while gpsp.running:
            gpsd.next() #this will continue to loop and grab EACH set of gpsd info to clear the buffer
 
if __name__ == '__main__':
    gpsp = GpsPoller() # create the thread
    gpsp.start()
    while True:
        try:
            gpsFile = open("/root/gps.in2", "w")
            gpsFile.write((str(gpsd.fix.latitude)+":"+str(gpsd.fix.longitude)+":"+str(gpsd.fix.speed)+":"+str(gpsd.fix.altitude)).encode('utf8'));
            gpsFile.close()
        except:
            pass
        time.sleep(5) #set to whatever    
