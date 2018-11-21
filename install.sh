#!/bin/sh

confirm() {
    # call with a prompt string or use a default
    read -r -p "${1:- Are you sure? [y/N]} " response
    case "$response" in
        [nN][oO]|[Nn]) 
            false
            ;;
        *)
            true
            ;;
    esac
}

###
# This scripts installs cl-lcr-daemon
###

confirm "Would you like to install the Cleveland LCR Daemon? [Y/n]" || exit 0

echo "Please enter the ID of the truck this will track:"
read truckID

_IP=$(hostname -I) || "no ip"
UUID=`/sbin/blkid -o value -s UUID $(/bin/mount | grep '^/dev' | grep 'on / ' |  cut -d " " -f 1)`
echo $UUID > /etc/cl-lcr-uuid
echo $truckID > /etc/cl-lcr-truck

confirm "Update the system (apt update)? [Y/n]" && (apt update; apt -y upgrade)
confirm "Install Python, NodeJS, and other dependancies? [Y/n]" && (apt install -y python2 node gpsd gpsd-clients python-gps; curl -L hologram.io/python-install | bash; apt remove -y python3)

echo "Backing up rc.local..."
cp /etc/rc.local /etc/rc.backup
echo "#!/bin/sh -e" > /etc/rc.local
echo "hciconfig hci0 up" >> /etc/rc.local
echo "(stty -F /dev/ttyAMA0 9600) &" >> /etc/rc.local
echo "sleep 1; gpsd /dev/ttyAMA0 -F /var/run/gpsd.sock" >> /etc/rc.local
echo "/usr/bin/tvservice -o" >> /etc/rc.local
echo "exit 0" >> /etc/rc.local
echo "New rc.local created"
echo "Modifing the /boot/config.txt"
echo "core_freq=250" > /boot/config.txt
echo "dtparam=act_led_trigger=none" >> /boot/config.txt
echo "dtparam=act_led_activelow=on" >> /boot/config.txt
echo "dtoverlay=pi3-miniuart-bt" >> /boot/config.txt
echo "enable_uart=1" >> /boot/config.txt
echo "force_turbo=1" >> /boot/config.txt

chmod +x /root/cl-lcr-daemon/bin/*
chmod +x /root/cl-lcr-daemon/gpsd/*
chmod +x /etc/rc.local

echo "Running npm install..."
cd /root/cl-lcr-daemon/ && npm install --unsafe-perms --force

echo "Registering the daemon to auto start..."
./bin/cl-lcr-cli register

#hologram send "install:$UUID:$truckID:$_IP"

echo "Install complete"
confirm "Reboot the system? [Y/n]" && reboot now
