import express = require('express');
import accounts = require("../../dao/v1/account");
import { log_dev as log } from '../../lib/log'
import {ErrCode, sendError, sendOk} from "../../lib/v1/utils";
import btask = require("../../lib/v1/batch_task");

export const router: express.Router = express.Router();

router.post('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("post /api/v1/batch_task");
    const { username, id } = req.query['map'];
    try {
        const {btaskName, taskType, allDevs, devices, fileName, url, taskObjectName} = req.body
        //参数校验
        if ((typeof btaskName !== 'string') || (typeof taskType !== 'string') || (allDevs !== 0 && allDevs !== 1) || (typeof devices !== 'object') ||
            (fileName != null && typeof fileName !== 'string') || (url != null && typeof url !== 'string'))
            throw new Error(`[${ErrCode.ParameterErr}]  请求参数类型有误`)
        if ((taskType === 'taskObject' && !taskObjectName)||((taskType === 'upgrade' || taskType == 'custom') && (!fileName || fileName == '')) || (taskType === 'linkAccess' && (!url || url == '')))
            throw new Error(`[${ErrCode.ParameterErr}]  请求参数不完整`)
        if (allDevs === 0 && devices.length === 0)
            throw new Error(`[${ErrCode.ParameterErr}]  已选设备为 0 `)

        let btaskId: number
        switch (taskType) {
            case "upgrade":
                btaskId = await btask.upgradeBatchTaskAdd(btaskName, username, id, allDevs, devices, fileName);
                break;
            case "linkAccess":
                btaskId = await btask.linkAccessBatchTaskAdd(btaskName, username, id, allDevs, devices, url);
                break;
            case "custom":
                btaskId = await btask.customBatchTaskAdd(btaskName, username, id, allDevs, devices, fileName);
                break;
            case "taskObject":
                btaskId = await btask.taskobjBatchTaskAdd(btaskName, username, id, allDevs, devices, taskObjectName)
                break;
            default:
                throw new Error(`[${ErrCode.TaskTypeErr}]  任务类型不存在`);
        }
        return sendOk(res, {batchTaskId: btaskId})
    } catch (e) {
        log.error(`[tasks list]  create batch_task failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/:batchTaskId', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/batch_task");
    const { username } = req.query['map'];
    try {
        if (isNaN(req.params.batchTaskId))
            throw new Error(`[${ErrCode.ParameterErr}]  batchTaskId 不正确`);
        let btaskId: number = Number(req.params.batchTaskId)
        // 参数检查
        if( (req.query.pageSize && ((isNaN(req.query.pageSize) || Number(req.query.pageSize) < 1 || !Number.isInteger(Number(req.query.pageSize)) ))) ||
            (req.query.pageNumber && ((isNaN(req.query.pageNumber) || Number(req.query.pageNumber) < 1 || !Number.isInteger(Number(req.query.pageNumber))) ))){
            throw new Error(`[${ErrCode.ParameterErr}]  pageSize或pageNumber 不正确`);
        }
        let taskStatus = req.query.taskStatus
        if ((taskStatus) && (isNaN(taskStatus)|| Number(taskStatus)>2 || Number(taskStatus)<0)){
            throw new Error(`[${ErrCode.ParameterErr}]  参数'taskStatus'只能为0~2的数字`);
        }
        let pageSize: number = (req.query.pageSize)?Math.floor(Number(req.query.pageSize)):10;
        let pageNumber: number = (req.query.pageNumber)?Math.floor(Number(req.query.pageNumber)):1;
        let ret: any = await btask.tasksGet(btaskId, pageSize, pageNumber, taskStatus?Number(taskStatus):null)
        return sendOk(res, ret)
    } catch (e) {
        log.error(`[tasks list]  create batch_task failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/batch_task");
    const { username } = req.query['map'];
    try {
        // 参数检查
        if( (req.query.pageSize && ((isNaN(req.query.pageSize) || Number(req.query.pageSize) < 1 || !Number.isInteger(Number(req.query.pageSize)) ))) ||
            (req.query.pageNumber && ((isNaN(req.query.pageNumber) || Number(req.query.pageNumber) < 1 || !Number.isInteger(Number(req.query.pageNumber))) ))){
            throw new Error(`[${ErrCode.ParameterErr}]  pageSize或pageNumber 不正确`);
        }
        let pageSize: number = (req.query.pageSize)?Math.floor(Number(req.query.pageSize)):10;
        let pageNumber: number = (req.query.pageNumber)?Math.floor(Number(req.query.pageNumber)):1;

        let ret: any = await btask.batchTaskGet(username, pageSize, pageNumber)
        return sendOk(res, ret)
    } catch (e) {
        log.error(`[tasks list]  create batch_task failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.delete('/:batchTaskId', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/batch_task");
    const { username } = req.query['map'];
    try {
        let btaskId: number = Number(req.params.batchTaskId)
        let delNum: number = await btask.batchTaskDelete(btaskId)
        return sendOk(res, {})
    } catch (e) {
        log.error(`[tasks list]  create batch_task failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

// router.delete('/:taskId', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
//     log.debug("get /api/v1/tasks");
//     try {
//         let taskId = req.params.taskId
//         if (!taskId) {
//             throw new Error(`[${ErrCode.ParameterErr}]  请求参数不完整`)
//         }
//         let taskid: string = await deleteTask(taskId)
//         console.log(`delete task('${taskid} success')`)
//         return sendOk(res, {})
//     } catch (e) {
//         log.error(`[tasks list]  delete tasks list failed! ${e.message}`);
//         return sendError(res, e.message)
//     }
// });