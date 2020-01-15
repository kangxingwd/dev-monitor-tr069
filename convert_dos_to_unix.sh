#!/bin/bash


dos2unix docker-compose.yml Dockerfile first_install.sh set_version.sh system_info.json tr069_srv.sh

find nginx -type f -exec dos2unix {} \;
find tr069-acs -type f -exec dos2unix {} \;
find tr069-srv -type f -exec dos2unix {} \;
find web -type f -exec dos2unix {} \;

