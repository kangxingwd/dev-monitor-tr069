import { log_dev as log } from '../../lib/log'
import {CommonConfig} from '../../config/common';
import {compareTime, formatTime, getUnixTime} from "../../lib/v1/utils";

export let devProbeMap: Map<string, any>;           // <devid, <mac, time> >

export async function run() {
    if(CommonConfig.WifiProbeEnable){
        log.debug(`----run daemon wifiProbe --`);
        devProbeMap = new Map<string, any>();
        // setInterval(() => sendWifiProbe(), CommonConfig.SendWifiProbeTime)
        setInterval(() => clearWifiProbe(), CommonConfig.ClearWifiProbeTime)
    }
}

// 定时清除超时探针
function clearWifiProbe() {
    for (let [devId, probeInfoMap] of devProbeMap) {
        let needClear: string[] = [];
        for (var [mac, time] of probeInfoMap) {
            //console.log(devId + " : " + mac + " : " +  formatTime(new Date(time * 1000)));
            if( getUnixTime() - time > CommonConfig.WifiProbeOvertime/1000 ){
                needClear.push(mac);
            }
        }

        for (let mac of needClear){
            probeInfoMap.delete(mac);
        }
    }
}

export async function devProbeMapAdd(devId: string, probeMacList: string[]) {
    if(probeMacList.length == 0) {
        return
    }

    let probeMacs: Map<string, number> = new Map<string, number>();
    for (let mac of probeMacList){
        probeMacs.set(mac, getUnixTime());
    }
    devProbeMap.set(devId, probeMacs);
}

// 探针去重
export async function probeDeWeight(devId: string, ProbeMacStr: string): Promise<any> {
    let newProbeMacs: string[] = [];
    try {
        let probeMacList: string[] = ProbeMacStr.split(',');
        if(!devProbeMap.has(devId)){
            devProbeMapAdd(devId, probeMacList);
            return probeMacList
        }

        let probeInfo: Map<string, number> = devProbeMap.get(devId);
        for (let mac of probeMacList) {
            if(!probeInfo.has(mac)){
                probeInfo.set(mac, getUnixTime());
                newProbeMacs.push(mac);
            }
        }
        log.debug(`devProbeMap:  ${devProbeMap}`);
        log.debug(`newProbeMacs: ${newProbeMacs}`);
        return newProbeMacs
    }catch (e) {
        log.error(`probeDeWeight error ${e.message}`)
        return newProbeMacs
    }
}


