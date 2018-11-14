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

dir="/root/cl-lcr-daemon/"
cmd="node ."

name=`basename $0`
pid_file="/var/run/$name.pid"
stdout_log="/var/log/$name.log"
stderr_log="/var/log/$name.err"

program_is_installed() {
	local return_=1
	type $1 >/dev/null 2>&1 || { local return_=0; }
	echo "$return_"
}

get_pid() {
    cat "$pid_file"
}

is_running() {
    [ -f "$pid_file" ] && ps -p `get_pid` > /dev/null 2>&1
}

case "$1" in
    start)
    if is_running; then
        echo "Already started"
    else
		if ! $(program_is_installed node); then
			printf "\e[31m✘ Missing dependency: node"
			printf "\033\e[0m"
			nodeInstall=node-v8.9.0-linux-$(`uname -m`)
			nodeDownload=https://nodejs.org/dist/v8.9.0/$nodeInstall.tar.gz
			echo "Attempting auto install from $nodeDownload"
			cd /tmp/ && wget $nodeDownload && tar -xzf $nodeInstall.tar.gz && cd $nodeInstall && cp -R * /usr/local/
			if ! $(program_is_installed node); then
				printf "\e[31m✘ Unable to install node"
				printf "\033\e[0m"
				exit(1)
			else:
				printf "\e[32m✔ Node Successfully Installed"
				printf "\033\e[0m"
			fi
		fi
		echo "Starting $name"
		cd "$dir"
		sudo $cmd >> "$stdout_log" 2>> "$stderr_log" &
		echo $! > "$pid_file"
		if ! is_running; then
			echo "Unable to start, see $stdout_log and $stderr_log"
			exit 1
		fi
    fi
    ;;
    stop)
    if is_running; then
        echo -n "Stopping $name.."
        kill `get_pid`
        for i in 1 2 3 4 5 6 7 8 9 10
        # for i in `seq 10`
        do
            if ! is_running; then
                break
            fi

            echo -n "."
            sleep 1
        done
        echo

        if is_running; then
            echo "Not stopped; may still be shutting down or shutdown may have failed"
            exit 1
        else
            echo "Stopped"
            if [ -f "$pid_file" ]; then
                rm "$pid_file"
            fi
        fi
    else
        echo "Not running"
    fi
    ;;
    restart)
    $0 stop
    if is_running; then
        echo "Unable to stop, will not attempt to start"
        exit 1
    fi
    $0 start
    ;;
    status)
    if is_running; then
        echo "Running"
    else
        echo "Stopped"
        exit 1
    fi
    ;;
    *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0