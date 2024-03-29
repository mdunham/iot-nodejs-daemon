# Bluetooth to Serial Communications Daemon

This application generates a bluetooth service that allows the Cleveland Drivers mobile app to communicate with a Liquid Controls LCR-II meter via usb-serial. The mobile app uses the phones bluetooth to connect to this service.  

__Note:__ macOS / Mac OS X, Linux, FreeBSD and Windows are currently are supported, but the instructions below are for a Raspberry Pi.

## Prerequisites

 * install [nodejs](https://github.com/nodejs/node#readme)
 * The following are installed during the ```npm install``` command:
	 * install [bleno](https://github.com/noble/bleno#readme)
	 * install [serialport](https://github.com/node-serialport/node-serialport#readme)

### Bleno on Linux

 * Kernel version 3.6 or above
 * ```libbluetooth-dev```
 * ```bluetoothd``` disabled, if BlueZ 5.14 or later is installed. Use ```sudo hciconfig hci0 up``` to power Bluetooth adapter up after stopping or disabling ```bluetoothd```.
    * ```System V```:
      * ```sudo service bluetooth stop``` (once)
      * ```sudo update-rc.d bluetooth remove``` (persist on reboot)
    * ```systemd```
      * ```sudo systemctl stop bluetooth``` (once)
      * ```sudo systemctl disable bluetooth``` (persist on reboot)

#### Ubuntu/Debian/Raspbian

```sh
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

Make sure ```node``` is on your path, if it's not, some options:
 * symlink ```nodejs``` to ```node```: ```sudo ln -s /usr/bin/nodejs /usr/bin/node```
 * [install Node.js using the NodeSource package](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

## Installation

__Note:__ You must be logged in as root before performing the following.

 * Clone the repository: ```git clone https://github.com/mdunham/cl-lcr-daemon.git /root/```
 * Change to the cl-lcr-daemon directory: ```cd /root/cl-lcr-daemon/```
 * Install dependencies: ```npm install --unsafe-perm```
	 * __Note:__ Since you're installing as root you must use the ```--unsafe-perm``` flag
 * Start the daemon: ```npm start```

## Register Daemon to Run on Boot

 * Make the CLI executable: ```chmod +x /root/cl-lcr-daemon/bin/cl-lcr-cli```
 * Also, the Boot script: ```chmod +x /root/cl-lcr-daemon/bin/boot```
 * Run the register command: ```/root/cl-lcr-cli/bin/cl-lcr-cli register```
 * Start the daemon: ```service cl-lcr-daemon start```

## Development

__Log Output:__ Main log located at ```/var/log/cl-lcr-daemon.log``` and errors are logged to ```/var/log/cl-lcr-daemon.err```

 * To run the daemon
	 * ```service cl-lcr-daemon start```
 * To stop the daemon
	 * ```service cl-lcr-daemon stop```

This application is maintained by [Matthew Dunham](http://linkedin.com/in/matthewdunham) at [Hot Coffey Design](http://hotcoffeydesign.com).
