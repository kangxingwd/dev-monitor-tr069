use mysql;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';

CREATE DATABASE IF NOT EXISTS tr069 DEFAULT CHARSET UTF8MB4 COLLATE utf8mb4_general_ci;

use tr069;
SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for account
-- ----------------------------
CREATE TABLE IF NOT EXISTS `account` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT '账号ID',
  `username` varchar(255) DEFAULT NULL COMMENT '用户名',
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `level` int(10) DEFAULT '1' COMMENT '权限等级, 1,2,3  分别代表3个级别代理商',
  `parent_id` int(10) DEFAULT '1' COMMENT '上一级的 userid',
  `enable` int(10) DEFAULT '1' COMMENT '开启状态',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `last_time` varchar(255) DEFAULT NULL COMMENT '最近操作时间',
  `ext` varchar(255) DEFAULT NULL COMMENT '扩展',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for btask
-- ----------------------------
CREATE TABLE IF NOT EXISTS `btask` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `btask_name` varchar(255) DEFAULT NULL COMMENT '批量任务名称',
  `username` varchar(255) DEFAULT NULL COMMENT '提交批量任务的账号',
  `task_type` varchar(255) DEFAULT NULL COMMENT '任务类型  upgrade, linkAccess',
  `task_args` varchar(255) DEFAULT NULL COMMENT '任务参数  filename或者url',
  `devs_num` int(10) DEFAULT NULL,
  `time` varchar(255) DEFAULT NULL COMMENT '提交时间',
  `ext` varchar(255) DEFAULT NULL COMMENT '扩展属性',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for day_online
-- ----------------------------
CREATE TABLE IF NOT EXISTS `day_online` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `dev_id` varchar(255) DEFAULT NULL COMMENT '设备ID',
  `date` int(10) DEFAULT NULL COMMENT '日期',
  `online_time` int(10) DEFAULT '0' COMMENT '在线时长(秒)',
  `ext` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for dev
-- ----------------------------
CREATE TABLE IF NOT EXISTS `dev` (
  `dev_id` varchar(255) NOT NULL COMMENT '设备ID',
  `user_id` int(10) DEFAULT '1' COMMENT '账号ID',
  `cwmp_id` varchar(255) DEFAULT NULL COMMENT 'cwmp的默认ID',
  `manufacturer` varchar(255) DEFAULT NULL COMMENT '厂商',
  `oui` varchar(255) DEFAULT NULL COMMENT '厂商唯一标识符',
  `soft_version` varchar(255) DEFAULT NULL COMMENT '软件版本',
  `dev_productclass` varchar(255) DEFAULT NULL COMMENT '设备型号',
  `ip` varchar(255) DEFAULT NULL,
  `connect_ip` varchar(255) DEFAULT NULL,
  `assign_time` varchar(255) DEFAULT NULL COMMENT '最近修改时间',
  `assign_userid` int(10) DEFAULT '1' COMMENT '最近修改的用户',
  `status` int(10) DEFAULT '0' COMMENT '设备状态',
  `last_inform` bigint(20) DEFAULT NULL COMMENT '最后一次心跳时间',
  `history_online_time` bigint(20) DEFAULT '0' COMMENT '历史在线时间',
  `ext` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`dev_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for event
-- ----------------------------
CREATE TABLE IF NOT EXISTS `event` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL COMMENT '用户名 ',
  `event` varchar(255) DEFAULT NULL COMMENT '事件类型 ,statusChange、addrChange、\r\nupgradeResult、wifiProbe、\r\ntaskStatus',
  `url` varchar(255) DEFAULT NULL,
  `ext` varchar(255) DEFAULT NULL COMMENT '扩展',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for file2user
-- ----------------------------
CREATE TABLE IF NOT EXISTS `file2user` (
  `alias_filename` varchar(255) NOT NULL COMMENT '文件名别名（文件名+用户名）',
  `filename` varchar(255) DEFAULT NULL COMMENT '真实文件名',
  `username` varchar(255) DEFAULT NULL,
  `filetype` varchar(255) DEFAULT NULL,
  `oui` varchar(255) DEFAULT NULL,
  `product_class` varchar(255) DEFAULT NULL,
  `soft_version` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`alias_filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for tasks
-- ----------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `task_id` varchar(255) NOT NULL COMMENT '任务ID',
  `dev_id` varchar(255) DEFAULT NULL COMMENT '设备ID',
  `btask_id` int(10) DEFAULT NULL COMMENT '批量任务ID,单个任务为0,批量任务为批量任务ID',
  `file_name` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `channel` varchar(255) DEFAULT NULL COMMENT 'nbi错误任务id',
  `task_name` varchar(255) DEFAULT NULL,
  `task_status` int(10) DEFAULT NULL,
  `dev_exist` int(10) DEFAULT NULL,
  `fault_code` int(10) DEFAULT NULL COMMENT '错误码',
  `fault_msg` varchar(255) DEFAULT NULL COMMENT '错误信息',
  `fault_detail` varchar(255) DEFAULT NULL COMMENT '错误细节',
  `retries` varchar(255) DEFAULT NULL COMMENT '重试次数',
  `date` varchar(255) DEFAULT NULL COMMENT '创建时间',
  `ext` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for task_obj
-- ----------------------------
CREATE TABLE IF NOT EXISTS `task_obj` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT COMMENT '任务对象ID, 主键、自增',
  `name` varchar(255) DEFAULT NULL COMMENT '任务对象名',
  `description` varchar(255) DEFAULT '' COMMENT '描述',
  `username` varchar(255) DEFAULT NULL COMMENT '用户名',
  `task_type` varchar(255) DEFAULT NULL COMMENT '任务类型',
  `upgrade_file` varchar(255) DEFAULT NULL COMMENT '升级文件名',
  `url` varchar(255) DEFAULT NULL COMMENT '连接url',
  `custom_file` varchar(255) DEFAULT NULL COMMENT '自定义文件名',
  `date` varchar(255) DEFAULT NULL COMMENT '创建时间',
  `ext` varchar(255) DEFAULT NULL COMMENT '扩展字段',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

INSERT INTO `account` VALUES ('1', 'admin', 'admin', '1', '1', '1', 'Administrator', '2019-01-01 00:00:00', 'Administrator');

