import {getDefaultDev, IDev} from "../../models/v1/dev";
import {ErrCode, getTime, getUnixTime} from "./utils";
import {EventType, haveEvent} from "../../daemon/v1/user_event";
import {notify} from "../../daemon/v1/daemon";
import daoDev = require("../../dao/v1/dev");
import daoAccount = require("../../dao/v1/account");
import {log_dev as log} from "../log";
import {NbiApi, NbiDev} from "../../config/nbi";
import devApi = require("./nbi/devapi");
import {CommonConfig} from "../../config/common";
import {getConnectionAsync} from "../mysqlpool";
import {getDevIdListByUserId} from "../../dao/v1/dev";

export let getNbiDevInfoFunMap:any = {
    id:                 devApi.getNbiDevId,
    devId:              devApi.getNbiDevSerialNumber,
    serialNumber:       devApi.getNbiDevSerialNumber,
    devProductclass:    devApi.getNbiDevProductclass,
    softwareVersion:    devApi.getNbiDevSoftVersion,
    mac:                devApi.getNbiDevMac,
    ip:                 devApi.getNbiDevIp,
    ssid:               devApi.getNbiDevSsid,
    wlanSSID:           devApi.getNbiDevSsid,
    lastInform:         devApi.getNbiDevLastInform,
    memoryTotal:        devApi.getNbiDevMemTotal,
    memoryFree:         devApi.getNbiDevMemFree,
    upTime:             devApi.getNbiDevUpTime,
    realIp:             devApi.getNbiDevRealIp,
    IMEI:               devApi.getNbiDevIMEI,
    status:             devApi.getNbiDevStatus,
    address:            devApi.getNbiDevAddress,
    tags:               devApi.getNbiDevTags,
    proxyUser:          getDevProxyUser
};

// 设备id - 设备信息
export let devMap: Map<string, any>;
export let needUpdateDevMap: Map<string, any>;  //需要更新的设备 map

export function devMapAdd(dev: IDev) {
    devMap.set(dev.dev_id, {
        cwmp_id:        dev.cwmp_id,
        ip:             dev.ip,
        soft_version:   dev.soft_version,
        connect_ip:     dev.connect_ip,
        status:         dev.status,
        last_time:      dev.last_inform
    });
}

export function needUpdateDevMapAdd(dev: IDev) {
    needUpdateDevMap.set(dev.dev_id, {
        cwmp_id:        dev.cwmp_id,
        ip:             dev.ip,
        soft_version:   dev.soft_version,
        connect_ip:     dev.connect_ip,
        status:         dev.status,
        last_time:      dev.last_inform,
        need_update: 0
    });
}

export async function devMapInit() {
    try {
        devMap = new Map<string, any>();
        needUpdateDevMap = new Map<string, any>();
        let devList: IDev[] = await daoDev.getAllDev();
        for (let dev of devList) {
            devMapAdd(dev);
        }
    }catch (e) {
        log.error(`devMapInit erro : ${e.message}`)
    }
}

export function devMapUpdate(dev: IDev) {
    let devInfo: any;

    if(needUpdateDevMap.has(dev.dev_id)){  // 如果在needUpdateDevMap里面，直接判断是否有变化，然后更新needUpdateDevMap
        devInfo =  needUpdateDevMap.get(dev.dev_id);
        log.debug(`needUpdateDevMapinfo: dev_id: ${JSON.stringify(devInfo)}`);
        log.debug(`event_info: ${JSON.stringify(dev)}`);
        if( dev.cwmp_id && devInfo.cwmp_id && dev.cwmp_id != devInfo.cwmp_id){
            try {
                devApi.deleteDev(devInfo.cwmp_id);
            }catch (e) {
                log.error(`deleteDev error: cwmp_id: ${devInfo.cwmp_id}, msg: ${e.message}`)
            }
            devInfo.cwmp_id = dev.cwmp_id;
        }

        if( dev.connect_ip && dev.connect_ip != devInfo.connect_ip){
            devInfo.connect_ip = dev.connect_ip;
            notify("updateDevAddr", [{
                id: dev.dev_id,
                ip: dev.connect_ip
            }]);
        }
        devInfo.ip = dev.ip;
        devInfo.soft_version = dev.soft_version;
        devInfo.status = 1;
        devInfo.last_time = getUnixTime();
    }else if(devMap.has(dev.dev_id)) {      // 如果在devMap里面且有变化，从devMap移动到needUpdateDevMap并更新
        let need_update = 0;
        devInfo = devMap.get(dev.dev_id);
        log.debug(`devMapinfo: ${JSON.stringify(devInfo)}`);
        log.debug(`event_info: ${JSON.stringify(dev)}`);
        if( dev.cwmp_id && devInfo.cwmp_id && dev.cwmp_id != devInfo.cwmp_id){
            try {
                devApi.deleteDev(devInfo.cwmp_id);
            }catch (e) {
                log.error(`deleteDev error: cwmp_id: ${devInfo.cwmp_id}, msg: ${e.message}`)
            }
        }

        if( (dev.ip && devInfo.ip && dev.ip != devInfo.ip) || (dev.ip && !devInfo.ip)){
            need_update = 1;
        }

        if(dev.soft_version && dev.soft_version != devInfo.soft_version){
            need_update = 1;
        }

        if( dev.connect_ip && dev.connect_ip != devInfo.connect_ip){
            need_update = 1;
            notify("updateDevAddr", [{
                id: dev.dev_id,
                ip: dev.connect_ip
            }]);
        }
        // 如果需要更新，就从 devMap 移到 needUpdateDevMap， 并删除devMap中的记录
        if(need_update == 1){
            log.info(`devMap to needUpdateDevMap, dev ${JSON.stringify(dev)}`);
            needUpdateDevMapAdd({
                dev_id:         dev.dev_id,
                cwmp_id:        dev.cwmp_id,
                ip:             dev.ip,
                soft_version:   dev.soft_version,
                connect_ip:     dev.connect_ip,
                status:         1,
                last_inform:     getUnixTime()
            });
            devMap.delete(dev.dev_id);
        }else {
            devInfo.status = 1;
            devInfo.last_time = getUnixTime();
        }
    }else {
        return
    }
}

export function getDevInfoFromMap(dev_id: string): any{
    let devInfo:any = null;
    if(needUpdateDevMap.has(dev_id)){
        devInfo =  needUpdateDevMap.get(dev_id);
    }else if(devMap.has(dev_id)) {
        devInfo = devMap.get(dev_id);
    }
    return devInfo
}

// export function devMapUpdate(dev: IDev) {
//     if(!devMap.has(dev.dev_id)){
//         return
//     }
//
//     let devInfo: any = devMap.get(dev.dev_id);
//     if( dev.cwmp_id && devInfo.cwmp_id && dev.cwmp_id != devInfo.cwmp_id){
//         try {
//             devApi.deleteDev(devInfo.cwmp_id);
//         }catch (e) {
//             log.error(`deleteDev error: cwmp_id: ${devInfo.cwmp_id}, msg: ${e.message}`)
//         }
//         devInfo.cwmp_id = dev.cwmp_id;
//         devInfo.need_update = 1;
//     }
//
//     if( (dev.ip && devInfo.ip && dev.ip != devInfo.ip) || (dev.ip && !devInfo.ip)){
//         devInfo.ip = dev.ip;
//         devInfo.need_update = 1;
//     }
//
//     if(dev.soft_version && dev.soft_version != devInfo.soft_version){
//         devInfo.soft_version = dev.soft_version;
//         devInfo.need_update = 1;
//     }
//
//     if( dev.connect_ip && dev.connect_ip != devInfo.connect_ip){
//         devInfo.connect_ip = dev.connect_ip;
//         devInfo.need_update = 1;
//         notify("updateDevAddr", [{
//             id: dev.dev_id,
//             ip: dev.connect_ip
//         }]);
//     }
//
//     devInfo.status = 1;
//     devInfo.last_time = getUnixTime();
// }

export async function newDevAdd(dev: IDev) {
    await daoDev.devAdd(dev);
}

export async function newDevHandle(req_body: any, devParams: any) {
    try {
        let newDev: IDev = getDefaultDev();

        newDev.user_id = 1;
        newDev.dev_id = req_body.data.deviceId.SerialNumber;
        newDev.cwmp_id = req_body.data.id;
        newDev.manufacturer = req_body.data.deviceId.Manufacturer;
        newDev.oui = req_body.data.deviceId.OUI;
        newDev.dev_productclass = req_body.data.deviceId.ProductClass;
        newDev.soft_version = devParams.SoftwareVersion;
        newDev.connect_ip = req_body.data.requestHeaders['x-forwarded-for'];
        newDev.ip = devParams.Ip;
        newDev.status = 0;
        newDev.last_inform = getUnixTime();
        newDev.assign_time = getTime();
        newDev.assign_userid = 1;
        newDev.history_online_time = 0;
        newDev.ext = req_body.data.requestHeaders['user-agent'];

        // 入库
        await daoDev.devAdd(newDev);

        // 添加内存数据
        log.debug(`devMapAdd  ${newDev.dev_id} ${newDev.ip}`);
        newDev.status = 1;
        devMapAdd(newDev);

        // 设置设备tags
        let username: string = await daoAccount.getUsernameById(newDev.user_id);
        setTimeout(function(){
            devApi.addDevTags(newDev.cwmp_id, username);
        },5000);

        // 更新 设备真实地址
        notify("updateDevAddr", [{
            id: newDev.dev_id,
            ip: newDev.connect_ip
        }]);
    }catch (e) {
        log.error(`newDevHandle error: ${e.message}`);
    }
}

export async function updateDevInfo() {
    try {
        let devsInfo: IDev[] = [];
        for (let [devID, devInfo] of needUpdateDevMap) {
            log.info(`updateDevInfo---: ${devID}`);
            devInfo.dev_id = devID;

            let devInfoTmp: IDev = {
                dev_id:         devInfo.dev_id,
                cwmp_id:        devInfo.cwmp_id,
                ip:             devInfo.ip,
                soft_version:   devInfo.soft_version,
                connect_ip:     devInfo.connect_ip,
                status:         1,
                last_inform:     getUnixTime()
            };
            devsInfo.push(devInfo);
            needUpdateDevMap.delete(devInfo.dev_id);
            devMapAdd(devInfoTmp);
        }

        await daoDev.updateDevsInfo(devsInfo);
        if(devsInfo.length > 0){
            log.info(`updateDevMapInfo num: ${devsInfo.length}`);
        }
    }catch (e) {
        log.error(`updateDevInfo error: ${e.message}`)
    }
}

// export async function updateDevInfo() {
//     try {
//         let devsInfo: IDev[] = [];
//         for (let [devID, devInfo] of devMap) {
//             if(devInfo.need_update == 1){
//                 log.info(`updateDevInfo---: ${devID}`);
//                 devInfo.dev_id = devID;
//                 devsInfo.push(devInfo);
//                 devInfo.need_update = 0;
//             }
//         }
//         await daoDev.updateDevsInfo(devsInfo);
//     }catch (e) {
//         log.error(`updateDevInfo error: ${e.message}`)
//     }
// }

// 设备状态通知
export async function eventStatusChange(devIdList: string[], status: number) {
    if(!CommonConfig.EventNotifyEnable)  return;
    for (let devId of devIdList) {
        let username: string = await daoDev.getUsernameByDevid(devId);

        if(haveEvent(username, EventType.statusChange)){
            notify("userEvent", {
                username:   username,
                event:      EventType.statusChange,
                devId:      devId,
                data:       {
                    status: status
                }
            });
        }
    }
}

// 地址变更通知
export async function eventAddrChange(username: string, devId: string, newAddr: string, oldAddr: string) {
    try {
        if(CommonConfig.EventNotifyEnable && haveEvent(username, EventType.addrChange)){
            notify("userEvent", {
                username:   username,
                event:      EventType.addrChange,
                devId:      devId,
                data:       {
                    newAddr:    newAddr,
                    oldAddr:    oldAddr
                }
            });
        }
    }catch (e) {
        log.error(`eventAddrChange error: ${e.message}`);
    }
}

// wifi探针通知
export async function eventWifiProbe(username: string, devId: string, newDevMacs: string[]) {
    try {
        if(CommonConfig.EventNotifyEnable && haveEvent(username, EventType.wifiProbe)){
            notify("userEvent", {
                username:   username,
                event:      EventType.wifiProbe,
                devId:      devId,
                data:       {
                    devs:   newDevMacs
                }
            });
        }
    }catch (e) {
        log.error(`eventAddrChange error: ${e.message}`);
    }
}

export async function getDevInfoByDevIdList(loginInfo: any, devIdList: string[], pageSize: number, pageNumber: number,
                                            projection: string, query?: any): Promise<any> {
    let queryProjection :string[] = projection.split(",");
    let nbiQuery:any;
    let nbiProjection: string;
    let nbiLimit:any = pageSize;
    let nbiSkip:any = pageSize * (pageNumber - 1);
    let nbiSort:any = `{"${NbiDev.id}":1}`;  // 默认按id排序

    // 解析 projection
    if(!projection.match("devId")) {
        queryProjection.push("devId");
    }
    nbiProjection = parseProjection(queryProjection).join(",");

    // 解析query
    if(!query) {
        query = `{"proxyUser":"${loginInfo.username}"}`;
    }
    nbiQuery = await parseQuery(query, loginInfo);

    let {devs, total} =  await devApi.getDevInfoByDevIdList(nbiProjection, nbiQuery, nbiLimit, nbiSkip, nbiSort);
    let devInfoList: any[] = [];

    for (let dev of devs) {
        let devInfo: any = {};
        for (let projection of queryProjection) {
            if(getNbiDevInfoFunMap.hasOwnProperty(projection)){
                devInfo[projection] = await getNbiDevInfoFunMap[projection](dev, loginInfo);
            }
        }
        devInfoList.push(devInfo)
    }
    let retTotal: number = total?total:devs.length;

    return {
        devInfoList:    devInfoList,
        total:          retTotal,
    }
}

function parseProjection(queryProjection: string[]):string[] {
    let projection: string[] = [];

    for (let itemProjection of queryProjection) {
        if(NbiDev.hasOwnProperty(itemProjection)){
            projection.push(NbiDev[itemProjection])
        }else {
            projection.push(itemProjection)
        }
    }
    projection.push(NbiDev.id);
    return projection;
}

async function parseQuery(requestQuery: string, loginInfo: any): Promise<any> {
    let query: any = JSON.parse(requestQuery);
    let retQuery :any = {};

    // 代理商处理
    if(!query.hasOwnProperty("tags") && !query.hasOwnProperty("_tags")){
        if(query.hasOwnProperty("proxyUser")){
            let userId = await daoAccount.getUserIdByUsername(query["proxyUser"]);
            query["proxyUser"] = { $in: await daoAccount.getAllSubUserNameList(userId)};
        }else {
            query["proxyUser"] = { $in: await daoAccount.getAllSubUserNameList(loginInfo.id)}
        }
    }

    // 状态处理
    if(query.hasOwnProperty("status")){
        if(query["status"] == 1) {
            query["status"] ={ $gt: new Date(Date.now() - CommonConfig.OnlineTime) };
        }else {
            query["status"] ={ $lte: new Date(Date.now() - CommonConfig.OnlineTime) };
        }
    }

    // 设备Id处理
    if(query.hasOwnProperty("devId")){
        query["devId"] = encodeURI(query["devId"]);  // 有些设备的设备型号带有  “-”需要转义
    }

    for (let key in query) {
        if (!query.hasOwnProperty(key)) continue;  // 抛弃继承属性
        if (NbiDev.hasOwnProperty(key)) {
            retQuery[NbiDev[key]] = query[key];
        }else {
            retQuery[key] = query[key];
        }
    }
    return JSON.stringify(retQuery)
}

async function getDevProxyUser(dev: any, other:any): Promise<any> {
    let level:number = other.level;
    let proxyUser:string = other.username;
    if(dev._id && dev._tags && dev._tags.length != 0){
        try {
            let account: any = await daoAccount.getAccountByUsername(dev._tags[0]);
            if(level == 1 && account.level && account.level == 3){
                proxyUser = await daoAccount.getUsernameById(account.parenId);
            }else {
                proxyUser = account.username;
            }
        }catch (e) {
            log.error(`getDevProxyUser error: ${e.message}`);
            proxyUser = other.username;
        }
    }
    return proxyUser
}

export async function checkDevPermission(level:number, userId: number, devices: string[]): Promise<any> {
    if(level !== 1 && level !== 2){
        throw Error(`[${ErrCode.AccountNoPermission}]`)
    }
    let userDevIdsAll: string[] = await daoDev.getAllDevIdListByUserId(userId);
    let userDevsSet = new Set(userDevIdsAll);
    for(let devId of devices){
        if(!userDevsSet.has(devId)){
            throw Error(`[${ErrCode.AccountNoPermission}]devId:${devId}`)
        }
    }
}

export async function changeDevUser(account: string, devices: string[], deleteAccount?: string): Promise<any> {
    let userId:number = await daoAccount.getUserIdByUsername(account);

    if(devices.length === 0 && deleteAccount) {
        let deleteUserId: number = await daoAccount.getUserIdByUsername(deleteAccount);
        devices = await daoDev.getAllDevIdListByUserId(deleteUserId);
    }
    
    //修改nbi 设备的 tags字段
    for (let devId of devices) {
        let username: string;
        try {
            username = await daoDev.getUsernameByDevid(devId);
        }catch (e) {
            log.error(`[allocDevice] dev ${devId} is not exist! ${e.message}`);
            continue
        }

        let cwmp_id = devMap.get(devId).cwmp_id;
        await devApi.deleteDevTags(cwmp_id, username);
        await devApi.addDevTags(cwmp_id, account);
    }

    //修改数据库 parent_id
    await daoDev.changeUserId(userId, devices);

    // TODO 修改设备的代理商后对于任务的处理
}

