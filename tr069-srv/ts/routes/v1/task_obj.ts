import express = require('express');
import {ErrCode, sendError, sendOk} from "../../lib/v1/utils";
import accounts = require("../../dao/v1/account");
import taskObj = require("../../lib/v1/task_obj");

import {log_dev as log} from "../../lib/log";

export const router: express.Router = express.Router();

//修改任务对象
router.post('/:id', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const { username } = req.query['map']
    try {
        const { id } = req.params
        const {name, desc, taskType, upgradeFile, url, customFile} = req.body
        if (!(id && name && desc && taskType)
            || (taskType == 'upgrade' && (!upgradeFile || upgradeFile == ''))
            || (taskType == 'linkAccess' && (!url || url == ''))
            || (taskType == 'custom' && (!customFile || customFile == '')))
            throw Error(`[${ErrCode.ParameterErr}] 参数不完整`)
        let args: any = {}
        switch (taskType) {
            case 'upgrade':
                args.upgradeFile = upgradeFile
                break
            case 'linkAccess':
                args.url = url
                break
            case 'custom':
                args.customFile = customFile
                break
            default:
                throw Error(`[${ErrCode.ParameterErr}] 任务类型不存在`)
        }
        await taskObj.modifiTaskObj(id, name, username, desc, taskType, args)
        return sendOk(res, {})
    } catch (e) {
        return sendError(res, e.message)
    }
});

//创建任务对象
router.post('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const { username } = req.query['map']
    try {
        const {name, desc, taskType, upgradeFile, url, customFile} = req.body
        if (!(name && desc && taskType)
            || (taskType == 'upgrade' && (!upgradeFile || upgradeFile == ''))
            || (taskType == 'linkAccess' && (!url || url == ''))
            || (taskType == 'custom' && (!customFile || customFile == '')))
            throw Error(`[${ErrCode.ParameterErr}] 参数不完整`)
        let args: any = {}
        switch (taskType) {
            case 'upgrade':
                args.upgradeFile = upgradeFile
                break
            case 'linkAccess':
                args.url = url
                break
            case 'custom':
                args.customFile = customFile
                break
            default:
                throw Error(`[${ErrCode.ParameterErr}] 任务类型不存在`)
        }
        let objId: number = await taskObj.createTaskObj(username, name, desc, taskType, args)
        return sendOk(res, {taskObjId: objId})
    } catch (e) {
        return sendError(res, e.message)
    }
});

//查看单个任务对象
router.get('/:objName', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const { username } = req.query['map']
    try {
        const { objName } = req.params
        let ret = await taskObj.getOneTaskObj(username, objName)
        return sendOk(res, ret)
    } catch (e) {
        return sendError(res, e.message)
    }
});

//查看任务对象
router.get('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const { username } = req.query['map']
    try {
        if( (req.query.pageSize && ((isNaN(req.query.pageSize) || Number(req.query.pageSize) < 1 || !Number.isInteger(Number(req.query.pageSize)) ))) ||
            (req.query.pageNumber && ((isNaN(req.query.pageNumber) || Number(req.query.pageNumber) < 1 || !Number.isInteger(Number(req.query.pageNumber))) ))){
            throw new Error(`[${ErrCode.ParameterErr}]  pageSize或pageNumber 不正确`);
        }
        let pageSize: number = (req.query.pageSize)?Math.floor(Number(req.query.pageSize)):10;
        let pageNumber: number = (req.query.pageNumber)?Math.floor(Number(req.query.pageNumber)):1;
        let ret: any = await taskObj.getTaskObjs(username, pageSize, pageNumber)
        return sendOk(res, ret)
    } catch (e) {
        return sendError(res, e.message)
    }
});

//删除任务对象
router.delete('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const { username } = req.query['map']
    try {
        const { objIds } = req.body
        if (!objIds || typeof objIds != 'object' || objIds.length === 0)
            throw new Error(`[${ErrCode.ParameterErr}] 删除的任务对象为空`)
        let delNum: number = await taskObj.delTaskObjs(objIds)
        return sendOk(res, {delNum: delNum})
    } catch (e) {
        return sendError(res, e.message)
    }
});