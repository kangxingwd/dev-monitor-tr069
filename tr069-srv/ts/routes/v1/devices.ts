import express = require('express');
import {ErrCode, sendError, sendOk} from "../../lib/v1/utils";
import devApi = require("../../lib/v1/nbi/devapi");
import  daoDev = require("../../dao/v1/dev");
import daoAccount = require("../../dao/v1/account");
import task = require("../../lib/v1/task");
import dev = require("../../lib/v1/device");
import { log_dev as log } from '../../lib/log'
import {getDevListTime} from "../../lib/v1/dev_time_handle";
import {CommonConfig} from "../../config/common";
import {notify} from "../../daemon/v1/daemon";
import {devAddrMap} from "../../daemon/v1/dev_addr";

export const router: express.Router = express.Router();

router.get('/dev_num', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/devices/dev_num");
    const { id, username, level } = req.query['map'];

    try {
        let onlineNum: number = 0;
        let offline: number = 0;
        //let idList: string[] = await daoDev.getDevIdListByUserId(id, 0, 10000000);
        let tags: string[] = await daoAccount.getAllSubUserNameList(id);

        if (tags.length !== 0) {
            onlineNum = await devApi.getDevNumByStatus(tags, 1, CommonConfig.OnlineTime);
            offline = await devApi.getDevNumByStatus(tags, 0, CommonConfig.OnlineTime);
        }
        return sendOk(res, { dev_info:{online: onlineNum,offline: offline}})
    } catch (e) {
        log.error(`[dev list]  get dev list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/devices");
    const { id, username, level } = req.query['map'];
    let recordsTotal: number;
    let pageSize: number;
    let pageNumber: number;
    let projection: string;
    let query: any;
    let totalPages:number;

    try {
        // 参数检查
        if( (req.query.pageSize && ((isNaN(req.query.pageSize) || Number(req.query.pageSize) < 1 || !Number.isInteger(Number(req.query.pageSize)) ))) ||
            (req.query.pageNumber && ((isNaN(req.query.pageNumber) || Number(req.query.pageNumber) < 1 || !Number.isInteger(Number(req.query.pageNumber))) ))){
            throw new Error(`[${ErrCode.ParameterErr}]  pageSize或pageNumber 不正确`);
        }

        pageSize    = (req.query.pageSize)?Number(req.query.pageSize):CommonConfig.NbiDefaultPageSize;
        pageNumber  = (req.query.pageNumber)?Number(req.query.pageNumber):CommonConfig.NbiDefaultPageNum;
        projection  = (req.query.projection)?req.query.projection:CommonConfig.NbiDefaultProjection;
        query       = (req.query.query)?req.query.query:undefined;

        // 获取该用户所有设备
        let userDevIdsAll: string[] = await daoDev.getAllDevIdListByUserId(id);
        recordsTotal = userDevIdsAll.length;

        // 获取设备信息
        let {devInfoList, total} =  await dev.getDevInfoByDevIdList(req.query['map'], userDevIdsAll, pageSize,
            pageNumber, projection, query);
        totalPages = Math.floor((total + (pageSize - 1))/pageSize);

        //  时间处理(projection中有allOnlineTime, lastActiveTime, OneDayOnlneTime)
        devInfoList = await getDevListTime(devInfoList, projection, query);

        if(recordsTotal < total){
            recordsTotal = total;
            notify("updateDev");  // 触发更新设备
            log.info(`--updateDev: userDevIdsAll: ${userDevIdsAll.length},  total: ${total}`);
        }

        return sendOk(res, {
            recordsTotal:       recordsTotal,
            recordsFiltered:    total,
            totalPages:         totalPages,
            curPage:            pageNumber,
            devices:            devInfoList
        })
    } catch (e) {
        log.error(`[dev list]  get dev list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/dev_productclass', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/dev_productclass");
    const { id, level } = req.query['map'];
    try {
        let devProductclassList: string[] = await daoDev.getDevProductclassList(id, level);
        return sendOk(res, { dev_productclass_list:devProductclassList})
    } catch (e) {
        log.error(`[show dev_productclass] id(${id}) show dev_productclass  failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/soft_version', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/soft_version");
    const { id, level } = req.query['map'];
    try {
        let softVersionList: string[] = await daoDev.getSoftVersionList(id, level);
        return sendOk(res, {soft_version_list:softVersionList})
    } catch (e) {
        log.error(`[show soft_version] id(${id}) show soft_version  failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.delete('/:devId', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/device/delete");
    let devId = req.params.devId;
    try {
        let cwmp_id = dev.getDevInfoFromMap(devId).cwmp_id;
        await devApi.deleteDev(cwmp_id);     //  删除NBI 后台设备信息
        await daoDev.delDev(devId);   // 删除 dev_user表 和 置batch2dev表中设备状态
        devAddrMap.delete(devId);
        dev.devMap.delete(devId);

        log.info(`[delete dev] delete device(${devId}) success!`);
        return sendOk(res, {})
    } catch (e) {
        log.error(`[delete dev] delete device(${devId}) failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.post('/:devID/tasks', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/devices/:devId/tasks");
    const { id, level, username } = req.query['map'];
    try {
        const req_body = (req as any).body;
        let devID = req.params.devID;
        let taskId: string = "";

        // 入参检查
        if(!req_body.name || (req_body.name === 'upgrade' && (!req_body.file || req_body.file == '')) || (req_body.name === 'linkAccess' && (!req_body.url || req_body.url == '')))
            throw new Error(`[${ErrCode.ParameterErr}]  请求参数不完整`)

        switch (req_body.name) {
            case "reboot":
                taskId = await task.rebootTaskAdd(devID);
                break;
            case "factoryReset":
                taskId = await task.factoryResetTaskAdd(devID);
                break;
            case "upgrade":
                taskId = await task.upgradeTaskAdd(devID, req_body.file, username);
                break;
            case "linkAccess":
                taskId = await task.linkAccessTaskAdd(devID, req_body.url);
                break;
            default:
                throw new Error(`[${ErrCode.TaskTypeErr}]  任务类型不存在`);
        }
        return sendOk(res, {taskId: taskId})
    } catch (e) {
        log.error(`[tasks list]  get tasks list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/:devID/tasks', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/devices/:devId/tasks");
    const { id, level } = req.query['map'];
    try {
        let devID = req.params.devID;
        // 参数检查
        if( (req.query.pageSize && ((isNaN(req.query.pageSize) || Number(req.query.pageSize) < 1 || !Number.isInteger(Number(req.query.pageSize)) ))) ||
            (req.query.pageNumber && ((isNaN(req.query.pageNumber) || Number(req.query.pageNumber) < 1 || !Number.isInteger(Number(req.query.pageNumber))) ))){
            throw new Error(`[${ErrCode.ParameterErr}]  pageSize或pageNumber 不正确`);
        }
        let pageSize: number = (req.query.pageSize)?Math.floor(Number(req.query.pageSize)):10;
        let pageNumber: number = (req.query.pageNumber)?Math.floor(Number(req.query.pageNumber)):1;

        let ret = await task.getTaskByDev(devID, pageSize, pageNumber)
        return sendOk(res, ret)
    } catch (e) {
        log.error(`[tasks list]  get tasks list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});


