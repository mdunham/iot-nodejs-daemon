#!/bin/sh

###
# This scripts installs cl-lcr-daemon
###

echo "Please enter the ID of the truck this will track:"
read truckID

_IP=$(hostname -I) || "no ip"
UUID=`/sbin/blkid -o value -s UUID $(/bin/mount | grep '^/dev' | grep 'on / ' |  cut -d " " -f 1)`
echo $UUID > /etc/cl-lcr-uuid
echo $truckID > /etc/cl-lcr-truck

cp /etc/rc.local /etc/rc.backup
echo "#!/bin/sh -e" > /etc/rc.local
echo "hciconfig hci0 up" >> /etc/rc.local
echo "stty -F /dev/ttyAMA0 9600" >> /etc/rc.local
echo "gpsd /dev/ttyAMA0 -F /var/run/gpsd.sock" >> /etc/rc.local
echo "/usr/bin/tvservice -o" >> /etc/rc.local
echo "exit 0" >> /etc/rc.local

./bin/cl-lcr-cli register

hologram send "install:$UUID:$truckID:$_IP"
