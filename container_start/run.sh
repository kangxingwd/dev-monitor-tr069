#!/bin/bash

echo "start mongodb"
service mongodb start
sleep 2

echo "start mysqld"
rm -rf /var/run/mysqld/*
service mysql start
sleep 5

mysql -uroot -p123456 < /home/init.sql
mysql -uroot -p123456 < /home/ext.sql

echo "start redis"
nohup redis-server &
sleep 2

mkdir -p /var/log/tr069-acs
rm -rf /var/log/tr069-acs/*

echo "start nbi"
nohup /home/tr069-acs/genieacs/bin/genieacs-nbi &
sleep 5

echo "start fs"
nohup /home/tr069-acs/genieacs/bin/genieacs-fs &

echo "start cwmp"
nohup /home/tr069-acs/genieacs/bin/genieacs-cwmp &

echo "star node_srv"
cd /home/tr069-srv/
npm install --registry=http://registry.npm.taobao.org
npm run build
nohup npm run start &
sleep 15

echo "start nginx"
service nginx start
sleep 5

touch nohup.out
tail -f nohup.out