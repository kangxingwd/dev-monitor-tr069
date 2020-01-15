#!/bin/bash

# 分支版本
version_branch=basic-V1.0

# 默认服务端网关域名/ip， 可以修改
ACS_FS_HOSTNAME=demo.cwmp.tenbay.cn
ACS_FS_PORT=9002

INSTALL_PATH=/opt/tr069
TR069_PATH=$INSTALL_PATH/acs-shell
TR069_SHARED_PATH=/var/tr069
MYSQL_DATA_PATH=$TR069_SHARED_PATH/mysql
MONGODB_DATA_PATH=$TR069_SHARED_PATH/mongodb
MONGODB_PATH=$TR069_SHARED_PATH/mongodb-data

sudo apt-get update

# 安装 docker
sudo apt-get -y install docker docker.io

# 安装 docker-compose
sudo apt-get -y install git python-pip python-dev build-essential
sudo pip install --upgrade pip 
sudo pip install --upgrade virtualenv 
pip install docker-compose
docker-compose version
pip install -U docker-compose
echo "docker-compose install sucess!"

# 获取代码
sudo rm -rf $INSTALL_PATH
sudo mkdir $INSTALL_PATH
cd $INSTALL_PATH
git clone https://gitlab.com/TenbayServer/cwmp/acs-shell.git
sudo cp acs-shell acs-shell.bk -r
cd acs-shell
git checkout $version_branch
git pull

# 初始化容器中数据库的数据映射到宿主机
sudo mkdir $TR069_SHARED_PATH -p
sudo mkdir $MYSQL_DATA_PATH -p
sudo mkdir $MONGODB_PATH -p
sudo mkdir $MONGODB_DATA_PATH -p
sudo cp mysql/mysql/* $MYSQL_DATA_PATH/ -rf
sudo cp web $TR069_SHARED_PATH/ -rf
sudo cp nginx $TR069_SHARED_PATH/ -rf
sudo cp docker-compose.yml $TR069_SHARED_PATH/
sudo chmod 777 $MYSQL_DATA_PATH -R
sudo chmod 777 $MONGODB_DATA_PATH -R
sudo chmod 777 $TR069_SHARED_PATH/web -R
sudo chmod 777 $TR069_SHARED_PATH/nginx -R

# 设置 ACS升级文件系统的 服务端网关域名
sed -i "s/FS_IP.*$/FS_IP\" : \"$ACS_FS_HOSTNAME\",/g" $TR069_PATH/tr069-acs/config/config.json
sed -i "s/FS_PORT.*$/FS_PORT\" : $ACS_FS_PORT,/g" $TR069_PATH/tr069-acs/config/config.json

# 创建容器，
docker-compose build

# 启动容器
docker-compose up -d

# 添加服务
sudo chmod 755 $TR069_PATH/tr069_srv.sh
sudo cp $TR069_PATH/tr069_srv.sh /etc/init.d/tr069
systemctl daemon-reload

# 开机启动
sed -i '/^exit 0.*$/i\service tr069 up' /etc/rc.local

echo "	tr069 server is runing!"
echo "	you can run: 		"
echo "		 service tr069 star	    "
echo "		 service tr069 stop		"
echo "		 service tr069 upgrade		"
echo "		 service tr069 log			"

