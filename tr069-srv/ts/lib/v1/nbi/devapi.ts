import { log_dev as log } from '../../log'
import {compareTime, formatDate, strToMac, parseMacToId, getUnixTime, getTime} from '../utils'

import { NbiConfig, NbiApi,NbiDev } from '../../../config/nbi'
import { CommonConfig } from '../../../config/common'
import querystring = require("querystring");
import { RespStruct, getAsync, postAsync, delAsync } from './common'
import {devAddrMap} from '../../../daemon/v1/dev_addr';
import {getDefaultDev, IDev} from "../../../models/v1/dev";
//import lodash = require('lodash');

export interface IDevInfo {
    dev_id?: string;                // 设备ID
    serialNumber?: string;          //  序列号/mac地址
    soft_version?: string;         // 软件版本
    dev_productclass?: string;     // 设备型号
}

export async function getDevNumByStatus(tagList: string[], status: number, onlineTime: number):Promise<any> {
    let query: any = {};
    let devNum:number;

    if(status == 1){
        query["_lastInform"] = { $gt: new Date(Date.now() - onlineTime) };
    }else {
        query["_lastInform"] = { $lte: new Date(Date.now() - onlineTime) };
    }
    query["_tags"] = {"$in": tagList};

    let args = {
        query: JSON.stringify(query),
        projection: "_id",
        limit:  10,
        skip:   0
    };
    let url = `${NbiApi.DevicesPath}` + querystring.stringify(args);
    console.log(url);

    let ret: RespStruct;
    try {
        ret = await getAsync(url);
    }catch (e) {
        throw e
    }
    if ( ret.statusCode !== 200) {
        throw Error(`request failed! url: ${url}`)
    }

    let devs: any[] = JSON.parse(ret.body);
    devNum = ret.total?Number(ret.total):devs.length;
    return devNum;
}

export async function getDevInfoByDevIdList(projection: string, query: any, limit:number, skip: number, sort: any): Promise<any> {
    let args: any = {};

    // 构造请求参数
    if(query)       args["query"] = query;
    if(projection)  args["projection"] = projection;
    if(limit)       args["limit"] = limit;
    if(skip)        args["skip"] = skip;
    if(sort)        args["sort"] = sort;

    log.debug("getDevInfo  ----args : " + JSON.stringify(args));
    //console.log("getDevInfo  ----args : " + JSON.stringify(args));

    let url:string = `${NbiApi.DevicesPath}` + querystring.stringify(args);
    log.debug("getDevInfoV1    -getDevInfoByDevIdList  url : " + url);

    // 请求NbI
    let ret: RespStruct;
    try {
        ret = await getAsync(url);
    }catch (e) {
        throw e
    }
    if ( ret.statusCode !== 200) {
        throw Error(`request failed! url: ${url}`)
    }

    // 拼接回应
    let devs: any[] = JSON.parse(ret.body);

    return {
        devs:    devs,
        total:   ret.total?Number(ret.total):ret.total,
    }
}

export async function getNewDevList(mysqlDevList: string[]): Promise<any> {
    let projection: string[] = [NbiDev.id, NbiDev.serialNumber, NbiDev.softwareVersion, NbiDev.devProductclass, NbiDev.manufacturer,
                NbiDev.oui, NbiDev.ip, NbiDev.realIp, NbiDev.lastInform, NbiDev.tags];
    let srcDevNum = mysqlDevList.length;
    var devIDSet = new Set(mysqlDevList);

    let args = {
        projection: projection.join(",")
    };

    let url = `${NbiApi.DevicesPath}` + querystring.stringify(args);  // 拼接URL
    let ret: RespStruct;
    try {
        ret = await getAsync(url);  // 请求 NBI
    }catch (e) {
        throw Error(`request failed! url: ${url} ${e.message}`)
    }

    if ( ret.error || ret.statusCode !== 200) {
        throw Error(`request failed! url: ${url}`)
    }
    let devList: IDev[] = [];
    // 如果个数没有变化，就不做处理
    if (srcDevNum === ret.total) {
        log.debug(`dev num: ${srcDevNum} no change!`)
        return devList
    }

    let devs: any[] = JSON.parse(ret.body);
    for (let dev of devs) {
        //log.debug(`new dev:  ` + JSON.stringify(dev));
        // 如果没有该设备，添加
        if(!devIDSet.has(dev._deviceId._SerialNumber)) {
            let newDev: any = getDefaultDev();

            newDev.dev_id = getNbiDevSerialNumber(dev);
            newDev.cwmp_id = getNbiDevId(dev);
            newDev.manufacturer = getNbiDevManufacturer(dev);
            newDev.oui = getNbiDevOui(dev);
            newDev.soft_version = getNbiDevSoftVersion(dev);
            newDev.dev_productclass = getNbiDevProductclass(dev);
            newDev.connect_ip = getNbiDevRealIp(dev);
            newDev.ip = getNbiDevIp(dev);
            newDev.status = getNbiDevStatus(dev);
            newDev.tags = getNbiDevTags(dev);

            devList.push(newDev);
        }
    }
    return devList
}

export async function deleteDev(devId: string): Promise<any> {
    let url = `${NbiConfig.nbiAddress}/devices/${encodeURI(devId)}`;
    let ret: RespStruct = await delAsync(url);
    if ( ret.statusCode !== 200) {
        throw Error("删除设备失败! 设备ID：" + devId)
    }
}

export async function addDevTags(devId: string, tag: string): Promise<any> {
    let url = `${NbiConfig.nbiAddress}/devices/${encodeURI(devId)}/tags/${tag}`;
    let ret: RespStruct = await postAsync(url);
    if ( ret.statusCode !== 200) {
        throw Error("添加设备tag失败! 设备ID：" + devId)
    }
}

export async function deleteDevTags(devId: string, tag: string): Promise<any> {
    let url = `${NbiConfig.nbiAddress}/devices/${encodeURI(devId)}/tags/${tag}`;
    let ret: RespStruct = await delAsync(url);
    if ( ret.statusCode !== 200) {
        throw Error("删除设备tag失败! 设备ID：" + devId)
    }
}

export function getNbiDevLastInform(dev: any, other?: any): any {
    if (dev._lastInform) {
        return dev._lastInform
    }
    return ""
}

export function getNbiDevId(dev: any, other?: any): any {
    if (dev._id) {
        return dev._id;
    }
    return ""
}

export function getNbiDevSerialNumber(dev: any, other?: any): any {
    if (dev._deviceId && dev._deviceId._SerialNumber) {
        return dev._deviceId._SerialNumber;
    }
    return ""
}

export function getNbiDevProductclass(dev: any, other?: any): any {
    if (dev._deviceId && dev._deviceId._ProductClass) {
        return dev._deviceId._ProductClass;
    }
    return ""
}

function getNbiDevManufacturer(dev: any, other?: any): any {
    if (dev._deviceId && dev._deviceId._Manufacturer) {
        return dev._deviceId._Manufacturer;
    }
    return ""
}

export function getNbiDevOui(dev: any, other?: any): any {
    if (dev._deviceId && dev._deviceId._OUI) {
        return dev._deviceId._OUI;
    }
    return ""
}

export function getNbiDevSoftVersion(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.DeviceInfo &&
        dev.InternetGatewayDevice.DeviceInfo.SoftwareVersion ) {
        return dev.InternetGatewayDevice.DeviceInfo.SoftwareVersion._value;
    }
    return ""
}

export function getNbiDevUpTime(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.DeviceInfo &&
        dev.InternetGatewayDevice.DeviceInfo.UpTime ) {
        return dev.InternetGatewayDevice.DeviceInfo.UpTime._value;
    }
    return ""
}

export function getNbiDevSsid(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.LANDevice &&
        dev.InternetGatewayDevice.LANDevice["1"] &&
        dev.InternetGatewayDevice.LANDevice["1"].WLANConfiguration &&
        dev.InternetGatewayDevice.LANDevice["1"].WLANConfiguration["1"] &&
        dev.InternetGatewayDevice.LANDevice["1"].WLANConfiguration["1"].SSID){
        return  dev.InternetGatewayDevice.LANDevice["1"].WLANConfiguration["1"].SSID._value;
    }
    return ""
}

export function getNbiDevIMEI(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.DeviceInfo &&
        dev.InternetGatewayDevice.DeviceInfo.X_TGT_IMEI) {
        return  dev.InternetGatewayDevice.DeviceInfo.X_TGT_IMEI._value;
    }
    return ""
}

export function getNbiDevStatus(dev: any, other?: any): any {
    if(dev._lastInform) {
        if (compareTime(dev._lastInform,  new Date(Date.now() - CommonConfig.OnlineTime)) === 1) {
            return 1
        }else {
            return 0
        }
    }else {
        return undefined
    }
}

export function getNbiDevAddress(dev: any, other?: any): any {
    if(dev._deviceId._SerialNumber) {
        if(devAddrMap.has(dev._deviceId._SerialNumber)) {
            return devAddrMap.get(dev._deviceId._SerialNumber).dev_site;
        }else {
            return "";
        }
    }else {
        return undefined
    }
}

export function getNbiDevTags(dev: any, other?: any): any {
    if (dev._tags){
        return dev._tags;
    }
    return []
}

export function getNbiDevRealIp(dev: any, other?: any): any {
    if (dev.RealIp && dev.RealIp._value != undefined){
        return dev.RealIp._value;
    }
    return ""
}

export function getNbiDevIp(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.WANDevice &&
        dev.InternetGatewayDevice.WANDevice["1"] &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"] &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection["1"] &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection["1"].ExternalIPAddress){
        return dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection["1"].ExternalIPAddress._value;
    }
    return ""
}

export function getNbiDevMac(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.WANDevice &&
        dev.InternetGatewayDevice.WANDevice["1"] &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"] &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection["1"] &&
        dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection["1"].MACAddress){
            return dev.InternetGatewayDevice.WANDevice["1"].WANConnectionDevice["1"].WANIPConnection["1"].MACAddress._value;
    }
    return ""
}

export function getNbiDevMemTotal(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.DeviceInfo &&
        dev.InternetGatewayDevice.DeviceInfo.MemoryStatus &&
        dev.InternetGatewayDevice.DeviceInfo.MemoryStatus.Total ) {
        return dev.InternetGatewayDevice.DeviceInfo.MemoryStatus.Total._value;
    }
    return ""
}

export function getNbiDevMemFree(dev: any, other?: any): any {
    if (dev.InternetGatewayDevice &&
        dev.InternetGatewayDevice.DeviceInfo &&
        dev.InternetGatewayDevice.DeviceInfo.MemoryStatus &&
        dev.InternetGatewayDevice.DeviceInfo.MemoryStatus.Free ) {
            return dev.InternetGatewayDevice.DeviceInfo.MemoryStatus.Free._value;
    }
    return ""
}




