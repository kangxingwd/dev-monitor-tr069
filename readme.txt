
[ 首次安装 ]
1、运行环境要求：

	ubuntu 系统，16， 18都可以
	ubuntu 环境干净，保证没有占用80，3306，443 等常用端口

2、准备工作
			
	 (1)  拷贝 first_install.sh 到ubuntu系统任意目录下，加权限
			sudo chmod 755 first_install.sh
	
4、运行脚本：
	
	./first_install.sh

	留意中途有让输入用户名和密码：
		username: 	gitlabshare
		password:	gitlabshare2017

5、设置 tr069 服务器文件系统的ip/域名(若服务器处于外网，填写服务器的ip或域名; 若处于内网填写服务器的域名或者网关处的域名/ip，然后添加映射)

		service tr069 setIP 192.168.0.1 
		
6、添加映射（若服务端处于外网，不需要添加映射） 
	tr069服务端向外暴露三个端口:  
		80:		管理页面
		7547：	cwmp服务端，处理客户端连接的主要服务
		7567：	fs升级文件服务端，给客户端提供升级文件的服务
	
	若要保证客户端能正常连接和升级，需要在网关处添加映射
		网关：7547  ->  tr069服务端: 7547
		网关：7567  ->  tr069服务端: 7567
	
	或者可以给tr069服务端分配一个域名，网关处添加域名映射到tr069服务端，然后客户端配置tr069服务端的域名。
	

7、安装完成后就已经运行。可通过查看日志判断是否正常运行
	
	service tr069 log
	
8、安装后系统对应的一些文件

	web页面：		/home/tr069/acs-shell/www
	nginx配置文件： /home/tr069/acs-shell/nginx/sites-available
	nginx日志：		/var/log/tr069-nginx/
	服务端日志：	/var/log/tr069
	ACS日志：		/var/log/tr069-acs
	mysql data：	/var/lib/tr069-mysql
	mongodb data:	/var/lib/tr069-data

[ 非首次安装 升级 ]

1、普通升级
	（1）service tr069 upgrade		：升级过程会停止服务，请提前做好准备。
	（2）service tr069 setIp 12.168.1.1		: 设置tr069外网IP，域名也可以

2、跨分支升级
	
	（1）service tr069 branchList    :查看分支列表
			显示大致如下：
				*release-v1
				remotes/origin/HEAD -> origin/master
				remotes/origin/master
				remotes/origin/release-v1
				remotes/origin/release-v2
				remotes/origin/release-v3
				
			* 号开头的为当前分支版本
	
	（2）service tr069 upgrade release-v2		：升级到 release-v2 分支
	（3）service tr069 setIp 12.168.1.1			: 设置tr069外网IP，域名也可以

	
[ 附录 ]

1、电脑没有关机，可通过
		service tr069 start		：启动服务
		service tr069 stop		：停止服务
		service tr069 restart	：重启服务
		
2、电脑关机后，可通过
		service tr069 up		：启动服务
		service tr069 down		：停止服务
		
3、启动后，可通过：
		service tr069 log		：查看log
		
		docker ps -a 			: 查看NAMES 字段为 acs-shell_tr069 的docker容器，查看 STATUS 字段
									看是否在线， up为在线

4、如果运行中有异常,可尝试通过下面步骤恢复：

	（1） service tr069 restart	：重启服务
	（2） 	
			service tr069 down	：停止服务
			service tr069 up	：启动服务
	（3） 
			cd /home/tr069/acs-shell
			docker-compose build
			service tr069 up	：启动服务
			
5、操作服务的命令

	service tr069 start		：启动服务
	service tr069 stop		：停止服务
	service tr069 restart	：重新启动服务
	service tr069 log		：查看log
	service tr069 upgrade	：升级
	service tr069 up		：创建镜像和容器，启动服务，
	service tr069 down		：停止服务，删除镜像和缓存
	
	
	
	