import { log_dev as log } from '../../lib/log'
import { reqAddress, DevIpQueue, initMap } from "../../lib/v1/dev_map";
import { CommonConfig } from "../../config/common";
import { sleepMs } from "../../lib/v1/utils"

export let devAddrMap: Map<string, any>;
export let devIpQueue: DevIpQueue = null;

export async function run() {
    log.debug(`----run daemon updateDevIP --`);
	devAddrMap = new Map<string, any>();
	devIpQueue = new DevIpQueue()
	sleepMs(CommonConfig.DevMapDelayTime)
	await initMap()
    setInterval(() => updateNewAddr(CommonConfig.UpdateMapNum), CommonConfig.UpdateMapIntervalTime)
}

export function emit(event: string, param?: any) {
	log.debug(param)
	if (!CommonConfig.DevAddrMapEnable  || !devIpQueue)
		return
    process.nextTick(async () => {
		try {
            if(param && (param instanceof Array) && param.length != 0){
				for (let devIpObj of param) {
					devIpQueue.push({
						devId: devIpObj.id,
						ip: devIpObj.ip
					})
				}
            }
        } catch (e) {
            log.error(e.message);
        }
    })
}

export async function updateNewAddr(devNum: number) {
	try {
		if (!CommonConfig.DevAddrMapEnable || !(devIpQueue.length > 0))
				return
		for (let i = 0; i < devNum; i++){
			let devIpObj: any = devIpQueue.pop()
			if (!devIpObj)	return
			await reqAddress(devIpObj.devId, devIpObj.ip)
			sleepMs(200)
		}
    } catch (e) {
        log.info(e.message);
    }
}


