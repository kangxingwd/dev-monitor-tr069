import { log_dev as log } from '../../lib/log'
import { CommonConfig } from '../../config/common'
import {
    addOnlineTimeOnDay, getAllDevsbyStatus, getDevsTime,
    getOnlineTimeOnDay,
    getSingleDevTime, setDevsStatus, updateDevStatus,
    updateDevTime,
    updateOnlineTimeOnDay
} from "../../dao/v1/day_online";
import {IDev} from "../../models/v1/dev";
import {ErrCode, getDate, getTime, getUnixTime} from '../../lib/v1/utils';
import {IDayOnline} from "../../models/v1/dayOnline";
import {eventStatusChange} from "../../lib/v1/device";

export async function run() {
    log.debug(`----run daemon update time --`);
    setInterval(() => checkDevTime(), CommonConfig.CheckDevTime)
}

// 检测设备是否离线
async function checkDevTime() {
    try {
        let currentTime: number = getUnixTime()
        let devs: IDev[] = await getAllDevsbyStatus(1)
        let offlineList: string[] = []
        for(let dev of devs){
            if (dev.last_inform + (CommonConfig.OnlineTime/1000) < currentTime) {
                offlineList.push(dev.dev_id)
            }
        }
        setDevsStatus(offlineList, 0)

        // event_ 事件通知： 下线通知
        eventStatusChange(offlineList, 0);
    }catch (e) {
        log.error(`checkDevTime error:  ${e.message}`);
    }
}

// 更新在线
export function emit(event: string, param?: any) {
    process.nextTick(async () => {
		try {
			if(CommonConfig.OnlineTimeEnable){	
				let reg = /^\d+,[1-9]\d*$/
				let lastDayOnlineTime: number = 99999
				let thisDayOnlineTime: number = 99999
				log.debug(`${param.SerialNumber}: ${param.OnlineTime}`);
				if (reg.test(param.OnlineTime)) {
					lastDayOnlineTime = Number(param.OnlineTime.split(',')[0])
					thisDayOnlineTime = Number(param.OnlineTime.split(',')[1])
				} else {
					log.debug(`dev inform onlineTime error[devid: ${param.SerialNumber}, onloneTime: ${param.OnlineTime}]`);
				}
				
				let devTime: IDev = await getSingleDevTime(param.SerialNumber) as IDev
				if (!devTime)
					throw Error(`[${ErrCode.DevInfoError}] 设备不存在`)
				//获取设备的时间相关信息
				let totalOnlineTime: number = devTime.history_online_time
				let status: number = devTime.status
				let lastInformTime: number = devTime.last_inform
				let devId: string = devTime.dev_id
				//获取时间戳
				let currentTime: number = getUnixTime()
				let thisDate: number = getUnixTime(`${getDate()} 00:00:00`)
				let lastDate: number = thisDate - 24 * 60 * 60
				//获取在线时长记录
				let {tid: thisDayId, onlineTime: thisDayRecord} = await getOneDayOnlineTime(devId, thisDate)
				let {tid: lastDayId, onlineTime: lastDayRecord} = await getOneDayOnlineTime(devId, lastDate)
				//判断设备上报的在线时长的合理性
				if (1 === status){
					if (thisDate < lastInformTime) {            //在线……单日
						thisDayOnlineTime = (thisDayOnlineTime <= currentTime-lastInformTime)? thisDayOnlineTime : currentTime-lastInformTime
						lastDayOnlineTime = 0
					} else {                                    //在线……隔日
						thisDayOnlineTime = thisDayOnlineTime <= currentTime-thisDate? thisDayOnlineTime : currentTime-thisDate
						lastDayOnlineTime = lastDayOnlineTime <= thisDate-lastInformTime? lastDayOnlineTime : thisDate-lastInformTime
					}
				} else {
					if (thisDate < lastInformTime) {            //离线……单日
						thisDayOnlineTime = thisDayOnlineTime <= currentTime-lastInformTime? thisDayOnlineTime : 0
						lastDayOnlineTime = 0
					} else {                                    //离线……隔日
						thisDayOnlineTime = thisDayOnlineTime <= currentTime-thisDate? thisDayOnlineTime : 0
						lastDayOnlineTime = lastDayOnlineTime <= thisDate-lastInformTime? lastDayOnlineTime : 0
					}
					//更新设备状态
					updateDevStatus(devId, 1)
					// event_ 事件通知： 上线通知
					eventStatusChange([devId], 1)
				}
				lastDayOnlineTime = lastDayOnlineTime <= 24 * 60 * 60? lastDayOnlineTime : 0
				thisDayOnlineTime = thisDayOnlineTime <= 24 * 60 * 60? thisDayOnlineTime : 0

				log.debug(`lastDayOnlineTime: ${lastDayOnlineTime}`);
				log.debug(`thisDayOnlineTime: ${thisDayOnlineTime}`);
				//更新数据库在线时长数据
				addOrUpdateADayOnlineTime(thisDayId, thisDayOnlineTime+thisDayRecord, devId, thisDate)
				addOrUpdateADayOnlineTime(lastDayId, lastDayOnlineTime+lastDayRecord, devId, lastDate)
				updateDevTime(devId, currentTime, totalOnlineTime + thisDayOnlineTime + lastDayOnlineTime)
			} else {
				let devTime: IDev = await getSingleDevTime(param.SerialNumber) as IDev
				if (!devTime){
					throw Error(`[${ErrCode.DevInfoError}] 设备不存在`)
				}
				let status: number = devTime.status
				let devId: string = devTime.dev_id
				if (0 === status) {
					updateDevStatus(devId, 1)
					eventStatusChange([devId], 1)
				}
			}
        } catch (e) {
            log.error(`update dev time error! ${e.message}`);
        }
    })
}

async function getOneDayOnlineTime(devId: string, date: number): Promise<any>{
    let ret: any = await getOnlineTimeOnDay(devId, date)
    if (ret){
        return {tid: ret.id, onlineTime: ret.online_time}
    }else{
        return {tid: -1, onlineTime: 0}
    }
}

async function addOrUpdateADayOnlineTime(tid: number, onlineTime: number, devId: string, date: number): Promise<any>{
    if (tid < 0){
        addOnlineTimeOnDay(devId, date, onlineTime)
    }else{
        updateOnlineTimeOnDay(tid, onlineTime)
    }
}
