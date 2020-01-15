import express = require('express');
import accounts = require('../../dao/v1/account');
import daoUserEvent = require('../../dao/v1/event');
import {ErrCode, sendError, sendOk} from "../../lib/v1/utils";
import { log_dev as log } from '../../lib/log'
import {userEventDelete, userEventRegister} from "../../daemon/v1/user_event";

export const router: express.Router = express.Router();

// 事件通知注册
router.post('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/event");
    console.log("post /api/v1/event");

    const { id, username } = req.query['map'];
    const {event, url} = (req as any).body;

    try {
        if(!event || !url){
            throw Error(`[${ErrCode.ParameterErr}]缺少参数`)
        }
        await daoUserEvent.userEventAdd(username, event, url);  // 添加到数据库
        userEventRegister(username, event, url); // 添加到内存映射

        return sendOk(res, {});
    }catch (e) {
        log.error(`[event]  event add err! ${e.message}`);
        return sendError(res, e.message)
    }
});

// 事件通知获取
router.get('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/event");
    const { username } = req.query['map'];

    try {
        let userEventList:any[] = await daoUserEvent.getAllUserEventByUsername(username);  // 添加到数据库

        return sendOk(res, {userEventList: userEventList});
    }catch (e) {
        log.error(`[event]  event get err! ${e.message}`);
        return sendError(res, e.message)
    }
});

// 事件通知修改
router.post('/:eventName', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/event");
    const { id, username } = req.query['map'];
    const { eventName } = req.params;
    const { url } = (req as any).body;

    try {
        if(!url){
            throw Error(`[${ErrCode.ParameterErr}]缺少url`)
        }
        await daoUserEvent.userEventUpdate(username, eventName, url);  // 更新到数据库
        userEventRegister(username, eventName, url); // 更新到内存映射

        return sendOk(res, {});
    }catch (e) {
        log.error(`[event]  event add err! ${e.message}`);
        return sendError(res, e.message)
    }
});

// 事件删除
router.delete('/:eventName', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("delete /api/v1/event");

    const { id, username } = req.query['map'];
    const { eventName } = req.params;
    try {
        await daoUserEvent.userEventDel(username, eventName);  // 删除数据库
        userEventDelete(username, eventName); // 删除事件内存映射

        return sendOk(res, {});
    }catch (e) {
        log.error(`[event]  event add err! ${e.message}`);
        return sendError(res, e.message)
    }
});


