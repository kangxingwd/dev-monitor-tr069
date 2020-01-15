import { createHash, createHmac } from "crypto"
import dateformat = require("dateformat");
import {getAsync} from "./nbi/common";
var fs = require('fs');

export const ErrCode = {
    ParameterErr:           40000,
    AuthenticationFailed:   40001,
    NoAuthority:            40002,
    AccountExist:           40003,
    AccountNoExist:         40004,
    AccountNoPermission:    40005,
    AccountInfoErr:         40006,

    DevInfoError:           40010,
    DevCheckFailed:         40011,
    DevAccountInfoErr:      40012,

    FileOPError:            40020,
    
    TaskNoExist:            40030,    
    TaskTypeErr:            40031,
    TaskCreateErr:          40032,
    TaskOPError:            40033,
    BtaskOPError:           40034,
    TaskObjError:           40035,

    EventAlreadyRegistered: 40040,
    EventNotRegistered:     40041,
    
    ServerErr:              50000
};

let errMap: any = {
    40000:  "请求参数错误或格式不正确",
    40001:  "认证不通过",
    40002:  "没有认证",
    40003:  "账号已经存在",
    40004:  "账号不存在",
    40005:  "账号没有权限",
    40006:  "账号信息错误",

    40010:  "设备信息错误",
    40011:  "设备合法性校验失败！",
    40012:  "设备账号信息有误",

    40020:  "文件操作失败",

    40030:  "任务不存在",
    40031:  "任务类型错误",
    40032:  "新建任务失败",
    40033:  "任务操作失败",
    40034:  "批量任务操作失败",
    40035:  "任务对象操作失败",

    40040:  "事件已经注册",
    40041:  "事件未注册",

    50000:  "服务端错误"
};

export function sendOk(res: any, data: any): void {
    let ret = { status: 0, data: data };
    res.setHeader("Content-Type","application/json");
    res.send(JSON.stringify(ret))
}

export function sendErrorCode(res: any, errCode: number): void {
    let ret = { status: 1, data: { err_message: errMap[errCode.toString()], errCode: errCode} };
    res.setHeader("Content-Type","application/json");
    res.send(JSON.stringify(ret))
}

// errMsg
// 1、系统错误
// 2、自定义错误
//      格式：[errCode] errmsg
//      例子：[40001] 用户名错误。
export function sendError(res: any, errMsg: string): void {
    let errCode: number = ErrCode.ServerErr;
    let errMsgFront = errMsg.match(/^\[\d{5}]/);
    let errMsgBack = "";
    if(errMsgFront) {
        errMsgBack = errMsg.slice(7);
        errCode = parseInt(errMsgFront[0].slice(1,6));
        if(isNaN(errCode)) {
            errCode = ErrCode.ServerErr;
        }
    }
    console.log("sendError:: " + errMsg);
    let ret = { status: 1, data: { errMsg: errMap[errCode.toString()] + ` [${errMsgBack}]`, errCode: errCode} };
    res.setHeader("Content-Type","application/json");
    res.send(JSON.stringify(ret))
}

export function md5sum(str: string): string {
    return createHash('md5').update(str).digest("hex")
}

export function getUnixTime(formattedTime?: string): number {
    if(formattedTime){
        return parseInt((new Date(formattedTime).getTime()/1000).toString());
    }
    return parseInt((Date.now()/1000).toString());
}

export function getDate(): any {
    return formatDate(new Date(Date.now()))
}

export function formatDate(d: Date) {
    return dateformat(d, "yyyy-mm-dd")
}

export function getTime(): any {
    return formatTime(new Date(Date.now()))
}

export function formatTime(d: Date) {
    return dateformat(d, "yyyy-mm-dd HH:MM:ss")
}

export function compareTime(date1: any, date2: any ){
    var oDate1 = new Date(date1);
    var oDate2 = new Date(date2);
    if(oDate1.getTime() > oDate2.getTime()){
        return 1
    } else if (oDate1.getTime() < oDate2.getTime()){
        return -1
    } else {
        return 0
    }
}

export function strToMac(str: string): string {
    let mac:string;
    mac =  str.substr(0,2) + ":" +
        str.substr(2,2) + ":" +
        str.substr(4,2) + ":" +
        str.substr(6,2) + ":" +
        str.substr(8,2) + ":" +
        str.substr(10,2);
    return mac
}

export function compareVersion(srcVersionInfo: string, destVersionInfo: string): boolean{
    const srcVersion: number = Number(srcVersionInfo.split('-')[0].slice(1));
    const destVersion: number = Number(destVersionInfo.split('-')[0].slice(1));
    const srcPackTime: number = Number(srcVersionInfo.split('-')[1]);
    const destPackTime: number = Number(destVersionInfo.split('-')[1]);
    if(srcVersion < destVersion){
        return true;
    }else if(srcVersion == destVersion){
        if(srcPackTime < destPackTime){
            return true;
        }else {
            return false;
        }
    }else {
        return false;
    }
}

export function parseMacToId(mac: string): string {
    return mac.replace(/[-:]/g, "");
}

export  async function getSiteByIP(ip: string): Promise<any>{
    const key: string = 'uubUtS95p7DcdWgRUabt947E8LHVwMxM';
    let url: string = `http://api.map.baidu.com:80/location/ip?ak=${key}&coor=bd09ll&ip=${ip}`;
    let addr: any = JSON.parse((await getAsync(url)).body);
    if(addr.status !== 0)
        return null;
    return {code: addr.content.address_detail.city_code, address: addr.content.address, lat: addr.content.point.y, lng: addr.content.point.x};
}

let cpu_old: any;
let firstFlag = 0;
export async function getCpuUse(): Promise<any> {
    let data = fs.readFileSync('/proc/stat', 'utf8');

    let cpuArr2 = data.split("\n")[0].split(/\s+/);
    let cpu_new = {
        user: cpuArr2[1],
        nice: cpuArr2[2],
        system: cpuArr2[3],
        idle: cpuArr2[4],
        iowait: cpuArr2[5],
        irq: cpuArr2[6],
        softirq: cpuArr2[7]
    };
    console.log("cpu_new: " + JSON.stringify(cpu_new));

    let user = cpu_new.user;
    let nice = cpu_new.nice;
    let system = cpu_new.system;
    let idle = cpu_new.idle;
    let iowait = cpu_new.iowait;
    let irq = cpu_new.irq;
    let softirq = cpu_new.softirq;

    if(firstFlag == 1 ) {
        user = cpu_new.user - cpu_old.user;
        nice = cpu_new.nice - cpu_old.nice;
        system = cpu_new.system - cpu_old.system;
        idle = cpu_new.idle - cpu_old.idle;
        iowait = cpu_new.iowait - cpu_old.iowait;
        irq = cpu_new.irq - cpu_old.irq;
        softirq = cpu_new.softirq - cpu_old.softirq;
    }else {
        firstFlag = 1;
    }

    cpu_old = cpu_new;
    console.log("user " + user + " nice " + nice + " system " + system + " idle " + idle +
        " iowait " + iowait + " irq " + irq + " softirq " + softirq);

    let retult = (user + nice + system + iowait + irq + softirq) / (user + nice + system + idle + iowait + irq + softirq);
    let usage = parseInt(String(100 * retult))+ "%";
    console.log("usage : " + usage);
    return usage
}

export async function getSysMem(): Promise<any> {
    let memInfo:any = {};
    let data = fs.readFileSync('/proc/meminfo', 'utf8');

    let memArr = data.split('\n');
    for (let memInfoLine of memArr) {
        let info = memInfoLine.split(/\s+|:|\t/);
        memInfo[info[0]] = Number(info[2]);
    }
    return memInfo
}

export function checkTest(num: string): boolean {
    return num == md5sum(md5sum(dateformat(new Date(Date.now()), "yyyy-mm-dd")).slice(-4));
}

export let sleepMs = function (delay_ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1)
            } catch (e) {
                reject(0)
            }
        }, delay_ms);
    })
}