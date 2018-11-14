#!/bin/bash

service cl-lcr-daemon stop;
(killall node >/dev/null 2>&1)
sleep 1
hciconfig hci0 up;
(stty -F /dev/ttyAMA0 9600 &)
sleep 2
gpsd /dev/ttyAMA0 -F /var/run/gpsd.sock; 
echo "rc.localed" > /root/booted.rc;
sleep 2
hologram network connect;
sleep 1;
hologram send --cloud --devicekey 'ujk{]5pX'  'boot'
sleep 1
hologram network disconnect;
sleep 1;
service cl-lcr-daemon start;
