import { getConnectionAsync, transactionAsync } from '../../lib/mysqlpool'
import {getTime} from '../../lib/v1/utils';
import { log_dev as log } from '../../lib/log'
import { CommonConfig } from '../../config/common'
import {NbiDev} from "../../config/nbi";
import superagent = require("superagent");
import {IEvent} from "../../models/v1/event";
import {getAllUserEvent} from "../../dao/v1/event";
import {ErrCode} from "../../lib/v1/utils";

export const EventType = {
    statusChange:       "statusChange",
    addrChange:         "addrChange",
    upgradeResult:      "upgradeResult",
    wifiProbe:          "wifiProbe",
    taskStatus:         "taskStatus"
};

export let userEventMap: Map<string, any>;  // username: {eventType1: eventUrl1, eventType2: eventUrl2}
export let userEventList: any[] = [];       // [{url: "", data: {}}, {url: "", data: {}}]

export async function run() {
    log.debug(`----run daemon user_event --`);
    userEventMap = new Map<string, any>();
    await eventMapInit();
    setInterval(() => sendNotify(), CommonConfig.SendNotifyTime);
}

async function eventMapInit() {
    try {
        let usereEventList: IEvent[] = await getAllUserEvent();
        for (let usereEvent of usereEventList) {
            userEventRegister(usereEvent.username, usereEvent.event, usereEvent.url);
        }
        // console.log(userEventMap);
    }catch (e) {
        log.error(`eventInit erro : ${e.message}`);
    }
}

// 发送通知
function sendNotify() {
    if(CommonConfig.EventNotifyEnable && userEventList.length != 0) {
        log.info("----------sendNotify---------");
        let needSendEventList: any[] = userEventList.slice(0);
        userEventList = []; // 清空通知事件列表

        for (let needSendEvent of needSendEventList) {
            //console.log(`---[[send]] ${needSendEvent.url} ${needSendEvent.data}`);
            log.debug(`---[[send]] ${needSendEvent.url} ${needSendEvent.data.toString()}`);
            sendEvent(needSendEvent.url, needSendEvent.data);
        }
    }
}

function sendEvent(url: string, data: any) {
    superagent.post(url)
        .send(data)
        .set('Content-Type', 'application/json')
        .retry(2)
        .then(function (response) {
            log.info(`---sendEvent success! url: ${url}, data: ${data}`);
        },  function (error) {
            log.error(`---sendEvent error:  ${error}`);
        })
}

// 添加通知事件 param = {username: "", event: "", devID: "", data: {}}
export function emit(event: string, param?: any) {
    process.nextTick(async () => {
        try {
            log.info(`------------add event! ${JSON.stringify(param)} ${getTime()}`);
            if(!userEventMap.get(param.username)){
                throw new Error(`-userEventMap have no ${param.username}`);
            }
            let url = userEventMap.get(param.username)[param.event];
            userEventList.push({
                url: url,
                data: {
                    event: param.event,
                    devID: param.devId,
                    data: param.data
                }
            });
        } catch (e) {
            log.error(` add event error: ${e.message}`);
        }
    })
}

export function haveEvent(username: string, event: string): boolean {
    return userEventMap.has(username) && userEventMap.get(username).hasOwnProperty(event);
}

export function getEventUrl(username: string, event: string): boolean {
    return userEventMap.get(username)[event];
}

export function userEventRegister(username: string, eventType: string, notifyUrl: string) {
    if(userEventMap.has(username)){
        userEventMap.get(username)[eventType] = notifyUrl;
    }else {
        let eventList: any = {};
        eventList[eventType] = notifyUrl;
        userEventMap.set(username, eventList);
    }
}

export function userEventDelete(username: string, eventType?: string) {
    if(userEventMap.has(username)) {
        if(eventType) {
            delete userEventMap.get(username)[eventType];
        }else {
            userEventMap.delete(username);
        }
    }
}


