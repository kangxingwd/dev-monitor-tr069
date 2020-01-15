import {run as updateDevTimeRun, emit as updateDevTime} from "./dev_time";
import {run as userEventRun, emit as addUserEvent} from "./user_event";
import {run as updateDevRun, emit as updateDev} from "./dev_update";
import {run as wifiProbeRun} from "./wifi_probe";
import {run as clearAgelongRun} from "./clear_agelong"
import {run as updateDevAddrRun, emit as updateDevAddr} from "./dev_addr"

let eventMap: Map<string, any>;
export function notify(event: string, param?: any) {
    let emit = eventMap.get(event);
    if (!emit) {
        throw new Error("invalid event " + event)
    }

    emit(event, param)
}

export async function run() {
    eventMap = new Map<string, any>();
    eventMap.set("updateTime", updateDevTime);
    eventMap.set("userEvent", addUserEvent);
	eventMap.set("updateDev", updateDev);
	eventMap.set("updateDevAddr", updateDevAddr);
    updateDevTimeRun();
    userEventRun();
    updateDevRun();
    wifiProbeRun();
    clearAgelongRun();
    updateDevAddrRun();
}


