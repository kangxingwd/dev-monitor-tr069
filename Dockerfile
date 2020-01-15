FROM tbwl/tr069_base:V1.0

COPY web/ /var/www
COPY tr069-srv/ /home/tr069-srv

COPY tr069-acs/config/* /home/tr069-acs/genieacs/config/
COPY tr069-acs/genieacs/lib/* /home/tr069-acs/genieacs/lib/

COPY nginx/ms-htpasswd /etc/nginx/ms-htpasswd
COPY mysql/ext.sql /home/ext.sql
COPY mysql/init.sql /home/init.sql
COPY container_start/run.sh /home/run.sh
RUN chmod 755 /home/run.sh
COPY container_start/make_link_file.sh /home/make_link_file.sh
RUN chmod 755 /home/make_link_file.sh
COPY system_info.json /home/system_info.json

WORKDIR /home

CMD ["/home/run.sh"]
