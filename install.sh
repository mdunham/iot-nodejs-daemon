#!/bin/sh

###
# This scripts installs cl-lcr-daemon
###

echo "Please enter the ID of the truck this will track:"
read truckID

echo "$truckID" > /etc/cl-lcr-truck
UUID=`blkid -o value -s UUID $(mount | grep '^/dev' | grep 'on / ' |  cut -d " " -f 1)`
_IP=$(hostname -I) || "no ip"

if [ "$oldUUID" != "$UUID" ]; then
	echo "$UUID" > /etc/cl-lcr-uuid
	UUID="$oldUUID->$UUID"
fi

cp /etc/rc.local /etc/rc.backup
echo "hciconfig hci0 up" > /etc/rc.local
echo "stty -F /dev/ttyAMA0 9600 &" >> /etc/rc.local
echo "gpsd /dev/ttyAMA0 -F /var/run/gpsd.sock" >> /etc/rc.local
echo "exit 0" >> /etc/rc.local

hologram send "install:$UUID:$truckID:$_IP"
