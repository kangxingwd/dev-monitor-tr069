export let CommonConfig: any = {
    OnlineTime: 6 * 60 * 1000,   // 6分钟
    AccountDefaultPasswd: "88888888",
    TokenExpiresTime: 7200000,
    LogDir: "/var/log/tr069/",
    UpdateNewDevTime:   1000 * 60 * 60,         // 1 小时
    UpdateDevInfoTime:   1000 * 60 * 2,         // 2 分钟
    CheckDevTime:       1000 * 60 * 5,          // 5 分钟

    ClearDayOnlineTime: 1000 * 60 * 60 * 24,    // 定时清除每日在线时长数据的时间  (1 天)
    KeepDayOnlineTime:  1000 * 60 * 60 * 24 * 730,  //对每日在线时长数据保存时间  (730 天)
    SystemInfoPath: "/home/system_info.json",

    NbiDefaultProjection: "devId,status,devProductclass,softwareVersion,wlanSSID,ip,realIp,mac,memoryTotal,memoryFree,address,IMEI,upTime,lastActiveTime,proxyUser",
    NbiDefaultPageSize: 10,
    NbiDefaultPageNum: 1,

    WifiProbeEnable:    true,
    ClearWifiProbeTime: 1000 * 60 * 5,          // 定时清除超时探针的时间  (5 分钟)
    WifiProbeOvertime:  1000 * 60 * 60,         // WiFi探针超时时间  1小时

    LinkTaskEnable:     true,
    LinkAccessFilePath: "/home/link_file",
    MakeLinkFileShFilePath: "/home/make_link_file.sh",

    EventNotifyEnable:  true,
    SendNotifyTime:     1000 * 60,              // 1 分钟

    DevAddrMapEnable:   true,
	DevMapDelayTime: 15 * 60 * 1000,			//15 min	服务器启动后x分钟开启设备地址查询
	UpdateMapIntervalTime: 5 * 1000,        	//5s		更新队列里dev地址的间隔时间
	UpdateMapNum: 5,								//每次从队列里取出更新地址的个数 

	ProxyUserEnable: true,
	OnlineTimeEnable: true
};

export function initCommonConfig(config: any) {
    if(config.hasOwnProperty("CommonConfig")){
        for (let conf in config.CommonConfig) {
            if(CommonConfig.hasOwnProperty(conf)){
                CommonConfig[conf] = config.CommonConfig[conf];
            }
        }
    }
}
