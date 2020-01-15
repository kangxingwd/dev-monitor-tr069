#!/bin/bash

TR069_PATH=/opt/tr069/acs-shell
TR069_SHARED_PATH=/var/tr069
cd $TR069_PATH

case $1 in
start)
    docker-compose up -d
	echo "please wait....."
	sleep 10
    ;;
stop)
    docker-compose down
    docker rmi $(docker images -f "dangling=true" -q)
	echo "please wait....."
	sleep 5
    ;;
restart)
    docker-compose down
    docker-compose up -d
	echo "please wait....."
	sleep 10
    ;;
upgrade)
	docker-compose down
	git reset --hard HEAD
	git checkout .
	git clean -d -fx
	if [ ! -n "$2" ] ;then
		git pull
	else
		git fetch
		git checkout $2
		git pull
	fi
	echo "please wait..."
	chmod 777 set_version.sh
	./set_version.sh
	docker-compose build
	cp web $TR069_SHARED_PATH/ -rf
    cp nginx $TR069_SHARED_PATH/ -rf
    cp docker-compose.yml $TR069_SHARED_PATH/
	docker-compose up -d
	sleep 5
	echo "upgrade success!"
    ;;
setFsIpAndPort)
	if [ ! -n "$2" ] ;then
		echo "please input ip or hostname"
		exit 1
	else
		sed -i "s/FS_IP.*$/FS_IP\" : \"$2\",/g"  $TR069_PATH/tr069-acs/config/config.json
		if [ -n "$3" ] ;then
		    sed -i "s/FS_PORT.*$/FS_PORT\" : $3,/g" $TR069_PATH/tr069-acs/config/config.json
		fi
	fi
	echo "please wait..."
        docker-compose down
        docker-compose build
        docker-compose up -d
        sleep 5
        echo "set ip success!"
    ;;
branchList)
	git fetch
	git branch -a
    ;;
up)
    docker-compose up -d
	echo "please wait....."
	sleep 10
    ;;
down)
    docker-compose down
    docker rmi $(docker images -f "dangling=true" -q)
	echo "please wait....."
	sleep 10
    ;;
uninstall)
    docker-compose down
    docker rmi $(docker images -f "dangling=true" -q)
    rm -rf $TR069_SHARED_PATH
    cd /
    rm -rf $TR069_PATH
	sleep 5
	echo "uninstall tr069 successfully"
    ;;
enter)
    docker-compose exec tr069 bash
    ;;
log)
    docker-compose logs -f tr069
    ;;
*)
	echo "Usage: /etc/init.d/tr069 {start|stop|restart|upgrade|restart|up|down|branchList|setFsIpAndPort}"
	exit 1
esac

