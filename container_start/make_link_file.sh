#!/bin/bash

LINK_FILE_PATH=/home/link_file
URL=""
FILE_NAME=""
SCREPT_FILE_NAME=run.sh

function usage() {
        echo "USAGE:"
        echo "  make_link_file [-h] [-u <url>] [-f <filename>] [-p <save_file_path>]"
		echo "example:	/home/make_link_file.sh -u "http://www.baidu.com" -f test1.tar.gz -p /home/link_file"
        exit 1
}

while getopts "f:u:p:h" arg
do
        case $arg in
             f)
				FILE_NAME=$OPTARG
                ;;
             u)
				URL=$OPTARG
                ;;
             p)
				LINK_FILE_PATH=$OPTARG
                ;;
			 h)
                usage
                exit
                ;;
             ?)
				echo "Invalid option: -$OPTARG"
				exit 1
				;;
		esac
done

function Mkdir() {
	if [ ! -d $1 ];then
		mkdir $1 -p
	fi
}

function creat_link_file() {

cat>$1<<EOF
#!/bin/sh

status_code=\`curl -k -I -m 10 --connect-timeout 5 -o /dev/null -s -w %{http_code} $2\`

if [ "\$status_code"x = "200"x ];then
        echo "code : \${status_code}"
        exit 0
else
        exit 1
fi

exit 1
EOF
}

function main() {
	# 创建保存连接的目录
	Mkdir $LINK_FILE_PATH
	cd $LINK_FILE_PATH
	
	# 创建链接文件
	run_file=$LINK_FILE_PATH/$SCREPT_FILE_NAME
	creat_link_file $run_file $URL
	chmod +x $run_file
	
	# 压缩文件
	tar -zcvPf $FILE_NAME $SCREPT_FILE_NAME
	exit 0
}

main











