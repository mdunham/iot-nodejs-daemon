#!/bin/sh

### BEGIN INIT INFO
# Provides:          cl-lcr-daemon
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Starts the cl-lcr-daemon application
# Description:       Daemon for facilitating communication between the Cleveland app and an LC meter.
### END INIT INFO

# Carry out specific functions when asked to by the system
case "$1" in
  start)
    echo "Starting cl-lcr-daemon"
    # run application you want to start
    (/usr/local/bin/node /root/cl-lcr-daemon/index.js &> /root/cl-lcr-daemon/daemon-log.log &)
    ;;
  stop)
    echo "Stopping cl-lcr-daemon"
    # kill application you want to stop
    (killall node &> /dev/null)
    (/root/cl-lcr-daemon/bin/cl-lcr-cli stop > /dev/null)
    ;;
  *)
    echo "Usage: /etc/init.d/cl-lcr-daemon {start|stop}"
    exit 1
    ;;
esac

exit 0
