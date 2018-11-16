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

apt update
apt -y upgrade
apt install -y python2
apt install -y node
apt install -y gpsd gpsd-clients python-gps

curl -L hologram.io/python-install | bash

cp /etc/rc.local /etc/rc.backup
echo "#!/bin/sh -e" > /etc/rc.local
echo "hciconfig hci0 up" >> /etc/rc.local
echo "stty -F /dev/ttyAMA0 9600" >> /etc/rc.local
echo "gpsd /dev/ttyAMA0 -F /var/run/gpsd.sock" >> /etc/rc.local
echo "/usr/bin/tvservice -o" >> /etc/rc.local
echo "exit 0" >> /etc/rc.local

echo "core_freq=250" > /boot/config.txt
echo "dtparam=act_led_trigger=none" >> /boot/config.txt
echo "dtparam=act_led_activelow=on" >> /boot/config.txt
echo "dtoverlay=pi3-miniuart-bt" >> /boot/config.txt
echo "enable_uart=1" >> /boot/config.txt
echo "force_turbo=1" >> /boot/config.txt

cd /root/cl-lcr-daemon/ && npm install --unsafe-perms --force

./bin/cl-lcr-cli register

hologram send "install:$UUID:$truckID:$_IP"

echo "Install complete"
echo "You should now reboot to verify install"
