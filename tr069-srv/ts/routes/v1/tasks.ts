import express = require('express');
import accounts = require("../../dao/v1/account");
import { log_dev as log } from '../../lib/log'
import {ErrCode, sendError, sendOk} from "../../lib/v1/utils";
import task = require("../../lib/v1/task");

export const router: express.Router = express.Router();

router.delete('/:taskId', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("delete /api/v1/tasks/:teskId");
    const { id, level } = req.query['map'];
    try {
        let taskId = req.params.taskId
        if (!taskId) {
            throw new Error(`[${ErrCode.ParameterErr} `)
        }
        let taskid: string = await task.deleteTask(taskId)
        log.debug(`delete task('${taskid} success')`);
        return sendOk(res, {})
    } catch (e) {
        log.error(`[delete task]  delete task failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.post('/:taskId/retry', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("post /api/v1/tasks/:taskId/retry");
    const { username } = req.query['map'];
    try {
        let taskId = req.params.taskId
        if (!taskId) {
            throw new Error(`[${ErrCode.ParameterErr} `)
        }
        let taskid: string = await task.retryTask(taskId, username)
        log.debug(`retry task('${taskid}') success`);
        return sendOk(res, {taskId: taskid})
    } catch (e) {
        log.error(`[retry task]  retry task failed! ${e.message}`);
        return sendError(res, e.message)
    }
});


