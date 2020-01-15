import {notify} from "../../daemon/v1/daemon";
import {IDev} from "../../models/v1/dev";
import {getDevsOnlineTimeOnDay, getDevsTime} from "../../dao/v1/day_online";
import {log_dev as log} from "../log";
import {IDayOnline} from "../../models/v1/dayOnline";
import {getUnixTime, formatTime, ErrCode} from "./utils";

export function devTimeHandle(SerialNumber: string, onlineTime: string) {
    try {
        notify("updateTime", {
            SerialNumber:   SerialNumber,
            OnlineTime:     onlineTime
        });
    }catch (e) {
        log.error(`devTimeHandle notify error ${e.message}`)
        //throw new Error("devTimeHandle notify error ")
    }
}

export async function getDevListTime(devInfoList: any[], projection: string, query: any): Promise<any>{
    if(projection &&
        (projection.match("allOnlineTime") ||
            projection.match("lastActiveTime") ||
            projection.match("OneDayOnlneTime"))) {

        let devIds: string[] = []
        for (let devInfo of devInfoList){
            devIds.push(devInfo.devId)
        }
        if(projection.match("allOnlineTime") || projection.match("lastActiveTime")) {
            let devsTime: IDev[] = await getDevsTime(devIds)
            if(projection.match("allOnlineTime") && projection.match("lastActiveTime")){
                for(let i = 0; i < devInfoList.length; i++){
                    devInfoList[i].allOnlineTime = 0
                    devInfoList[i].lastActiveTime = ""
                    for(let devTime of devsTime){
                        if (devInfoList[i].devId == devTime.dev_id) {
                            devInfoList[i].allOnlineTime = devTime.history_online_time
                            devInfoList[i].lastActiveTime = formatTime(new Date(devTime.last_inform * 1000))
                            break
                        }
                    }
                }
            }else if (projection.match("allOnlineTime")) {
                for(let i = 0; i < devInfoList.length; i++){
                    devInfoList[i].allOnlineTime = 0
                    for(let devTime of devsTime){
                        if (devInfoList[i].devId == devTime.dev_id) {
                            devInfoList[i].allOnlineTime = devTime.history_online_time
                            break
                        }
                    }
                }
            }else if (projection.match("lastActiveTime")) {
                for(let i = 0; i < devInfoList.length; i++){
                    devInfoList[i].lastActiveTime = ""
                    for(let devTime of devsTime){
                        if (devInfoList[i].devId == devTime.dev_id) {
                            devInfoList[i].lastActiveTime = formatTime(new Date(devTime.last_inform * 1000))
                            break
                        }
                    }
                }
            }
        }

        if (projection.match("OneDayOnlneTime")) {
            if(!query) {
                throw Error(`[${ErrCode.ParameterErr}] 缺少日期`);
            }else {
                let date: string = JSON.parse(query).date
                let devsDayTime: IDayOnline[] = await getDevsOnlineTimeOnDay(devIds, getUnixTime(`${date} 00:00:00`))
                for(let i = 0; i < devInfoList.length; i++){
                    devInfoList[i].OneDayOnlneTime = 0
                    for(let devTime of devsDayTime){
                        if (devInfoList[i].devId == devTime.dev_id) {
                            devInfoList[i].OneDayOnlneTime = devTime.online_time
                            break
                        }
                    }
                }
            }
        }

    }

    return devInfoList;
}


