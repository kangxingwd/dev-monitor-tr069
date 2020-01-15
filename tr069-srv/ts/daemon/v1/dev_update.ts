import { log_dev as log } from '../../lib/log'
import { CommonConfig } from '../../config/common'
import device = require("../../lib/v1/device");
import daoDev = require("../../dao/v1/dev");
import daoAccount = require("../../dao/v1/account");
import devApi = require("../../lib/v1/nbi/devapi");
import {transactionAsync} from "../../lib/mysqlpool";
import {updateNewAddr} from "./dev_addr";
import {IDev} from "../../models/v1/dev";

export async function run() {
    log.debug(`----run daemon updateDev --`);
    await device.devMapInit();
    emit("updateDev");
    setInterval(() => emit("updateDev"), CommonConfig.UpdateNewDevTime);
    setInterval(() => device.updateDevInfo(), CommonConfig.UpdateDevInfoTime);
}

export function emit(event: string, param?: any) {
    process.nextTick(async () => {
        try {
            log.debug(`----newDev check --`);
            let mysqlDevList: string[] = await daoDev.getDevIdList();
            let nbiNewDevList: IDev[] = await devApi.getNewDevList(mysqlDevList);
            if (nbiNewDevList.length != 0) {
                log.debug(`有新设备 ${nbiNewDevList.length} ` + new Date(Date.now()));
                log.debug("nbiNewDevList: " +  JSON.stringify(nbiNewDevList));
                await detail(nbiNewDevList)
            }
        } catch (e) {
            log.error(e.message);
        }
    })
}

/**
 * 处理新增的设备
 * @param newDevList  新增的设备列表
 */
async function detail(newDevList: any[]) {
    console.log(`detail new dev`);
    try {
        await transactionAsync(async conn => {
            for (let dev of newDevList) {
                // 设置tags
                if(dev.tags && dev.tags instanceof Array && dev.tags.length !== 0){
                    dev.user_id = await daoAccount.getUserIdByUsername(dev.tags[0]);
                }else {
                    let username: string = await daoAccount.getUsernameById(1);
                    await devApi.addDevTags(dev.cwmp_id, username);
                }
                // 入库
                await daoDev.devAddDefault(dev);
                // 添加内存
                device.devMapAdd(dev);
                log.info(`----------------[new dev]---:   ${dev.cwmp_id}`);
            }
        });
    } catch (e) {
        log.error(`update dev error: ${e.message}`);
        throw e;
    }
}

