import {log_dev as log} from "../../lib/log";
import {CommonConfig} from "../../config/common";
import daoDayOnline = require("../../dao/v1/day_online");
import utils = require("../../lib/v1/utils")



export async function run() {
    log.debug(`----run clear dayOnline --`);
    clearDayOnline();
    setInterval(() => clearDayOnline(), CommonConfig.ClearDayOnlineTime)
}

async function clearDayOnline() {
    try {
        let currentTime = utils.getUnixTime()
        let clearTiming = currentTime - CommonConfig.KeepDayOnlineTime/1000
        await daoDayOnline.clearBeforeTime(clearTiming + 0.5)
    }catch (e) {
        log.error(`checkDevTime error:  ${e.message}`);
    }
}