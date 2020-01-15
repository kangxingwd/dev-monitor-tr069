export const NbiConfig = {
    nbiAddress: "http://127.0.0.1:7557"
};

export const NbiApi = {
    DevicesPath: `${NbiConfig.nbiAddress}/devices?`,
    TasksPath: `${NbiConfig.nbiAddress}/tasks?`,
    FilePath: `${NbiConfig.nbiAddress}/files?`,
    FaultsPath: `${NbiConfig.nbiAddress}/faults?`
};

export let NbiDev:any = {
    id:                 "_id",
    devId:              "_deviceId._SerialNumber",
    serialNumber:       "_deviceId._SerialNumber",
    manufacturer:       "_deviceId._Manufacturer",
    oui:                "_deviceId._OUI",
    devProductclass:    "_deviceId._ProductClass",
    softwareVersion:    "InternetGatewayDevice.DeviceInfo.SoftwareVersion._value",
    mac:                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.MACAddress._value",
    ip:                 "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress._value",
    ssid:               "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID._value",
    wlanSSID:           "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID._value",
    lastInform:         "_lastInform",
    status:             "_lastInform",
    memoryTotal:        "InternetGatewayDevice.DeviceInfo.MemoryStatus.Total",
    memoryFree:         "InternetGatewayDevice.DeviceInfo.MemoryStatus.Free",
    upTime:             "InternetGatewayDevice.DeviceInfo.UpTime",
    realIp:             "RealIp",
    IMEI:               "InternetGatewayDevice.DeviceInfo.X_TGT_IMEI",
    tags:               "_tags",
    proxyUser:          "_tags"
};

export const NbiFileType = {
    ImageFile:          "1 Firmware Upgrade Image",
    WebContentFile:     "2 Web Content",
    VendorConfFile:     "3 Vendor Configuration File",
    ToneFile:           "4 Tone File",
    RingerFile:         "5 Ringer File"
};

