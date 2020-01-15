#!/bin/bash
SYSTEM_INFO_FILE=system_info.json

data=`git log --pretty=format:'commit:%H version:%ai' -n 1 |awk -F ' ' '{print $2}' | awk -F ':' '{print $2}' | sed 's/-//g'`

time=`git log --pretty=format:'commit:%H version:%ai' -n 1 |awk -F ' ' '{print $3}' | awk -F ':' '{printf "%s%s\n",$1,$2}'`

num=`git branch -a|grep "*" | awk -F '-' '{print $3}'`

if [ -z "$num" ]; then 
    num=`git branch -a|grep "*" | awk -F '-' '{print $2}'` 
fi

version=${num}"-"${data}${time}

echo $version

sed -i "s/soft_version.*$/soft_version\" : \"$version\"/g" $SYSTEM_INFO_FILE


