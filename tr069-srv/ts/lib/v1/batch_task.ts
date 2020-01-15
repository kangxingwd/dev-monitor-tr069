import daoDev = require("../../dao/v1/dev")
import daoBtask = require("../../dao/v1/btasks")
import daoTask = require("../../dao/v1/task")
import daoFile = require("../../dao/v1/file");
import daoTaskObj = require("../../dao/v1/task_obj");



import task = require("../../lib/v1/task");

import util = require("../../lib/v1/utils")
import nbiFile = require("../../lib/v1/nbi/file");
import nbiTask = require("../../lib/v1/nbi/task");
import {Dev} from "../../models/v1/dev";
import {getDev} from "../../dao/v1/dev";
import {NbiFileType} from "../../config/nbi";
import {ErrCode} from "./utils";
import {log_dev as log} from "../log";

async function checkNewBtask(username: string, btaskName: string, btaskType: string, devsId: string[], args: any): Promise<any> {
    if (devsId.length === 0)
        throw Error(`[${util.ErrCode.BtaskOPError}]  无可升级设备`)
    if (await daoBtask.isExistBtask(null, btaskName))
        throw Error(`[${util.ErrCode.BtaskOPError}]  已存在同名批量任务 '${btaskName}'`)

    let errIds: string[] = []
    let devs: Dev[] = []
    for (let id of devsId) {
        try {
            devs.push(await getDev(id))
        }catch (e) {
            errIds.push(id)
        }
    }
    if (errIds.length > 0) {
        throw Error(`[${util.ErrCode.BtaskOPError}]  请检查设备 ['${errIds.join('\',\'')}'] 是否有误！`)
    }

    if (btaskType === "upgrade") {
        let isErr = false
        let errStr: string = `[${util.ErrCode.BtaskOPError}]`
        let fileName: string = args.fileName?args.fileName:""
        let file: any = await daoFile.getExistFile(fileName, username)
        if (!file)
            throw Error(`[${util.ErrCode.BtaskOPError}]  文件 '${fileName}' 不存在`)
        if (!(file.filetype === "1 Firmware Upgrade Image"))
            throw Error(`[${util.ErrCode.BtaskOPError}]  请选择固件文件进行升级`)
        /*      校验固件名格式
        let fileVersion: any = file.soft_version.match(/^V\d+(\.\d+)+-(\d{12})$/)
        if (!fileVersion)
            throw Error(`[${util.ErrCode.BtaskOPError}]  升级固件基本信息有误,软件版本格式应为 'Vx.x-yyyyMMddhhmm'`)

        let fileVersionTime: number = Number(fileVersion[2])
        */
        let pcErrIds: string[] = []
        // let versionErrIds: string[] = []     //固件版本与设备版本校验
        for (let dev of devs){
            /*      固件版本与设备版本校验
            if (!(dev.getSoftVersion()
                && dev.getSoftVersion().match(/^V\d+(\.\d+)+-(\d{12})$/)
                && Number(dev.getSoftVersion().match(/^V\d+(\.\d+)+-(\d{12})$/)[2]) <= fileVersionTime)){
                versionErrIds.push(dev.getDevId())
            }
            */
            if (!(file.product_class === dev.getDevProductclass())){
                pcErrIds.push(dev.getDevId())
            }
        }
        if (pcErrIds.length > 0) {
            isErr = true
            errStr = errStr + ` 升级固件与设备 ['${pcErrIds.join('\',\'')}'] 的设备型号不匹配`
        }
        /*      //固件版本与设备版本校验
        if (versionErrIds.length > 0) {
            errStr = errStr + `, 升级固件的软件版本须比设备的软件版本高,请检查设备 ['${versionErrIds.join('\',\'')}'] 的软件版本`
        }
        */
        if (isErr)
            throw Error(errStr)
    } else if (btaskType === "custom"){
        let fileName: string = args.fileName?args.fileName:""
        let file: any = await daoFile.getExistFile(fileName, username)
        if (!file)
            throw Error(`[${util.ErrCode.BtaskOPError}]  文件 '${fileName}' 不存在`)
    }
}

export async function taskobjBatchTaskAdd(btaskName: string, username: string, userId: number, allDevsFlag: number, devsId: string[], taskObjectName: string): Promise<any> {
    let obj = await daoTaskObj.retrieveTaskObj(username, taskObjectName)
    if (obj.length === 0)
        throw Error(`[${util.ErrCode.BtaskOPError}] 不存在此任务对象`)
    let btaskId
    switch (obj[0].task_type) {
        case "upgrade":
            btaskId = await upgradeBatchTaskAdd(btaskName, username, userId, allDevsFlag, devsId, obj[0].upgrade_file);
            break;
        case "linkAccess":
            btaskId = await linkAccessBatchTaskAdd(btaskName, username, userId, allDevsFlag, devsId, obj[0].url);
            break;
        case "custom":
            btaskId = await customBatchTaskAdd(btaskName, username, userId, allDevsFlag, devsId, obj[0].custom_file);
            break;
        default:
            throw new Error(`[${util.ErrCode.BtaskOPError}]`);
    }
    return btaskId
}

export async function upgradeBatchTaskAdd(btaskName: string, username: string, userId: number, allDevsFlag: number, devsId: string[], fileName: string): Promise<any> {
    let toDoDevsId: string[] = allDevsFlag === 1? await daoDev.getDevIdListByUserId(userId) : devsId
    let successNum: number = 0
    await checkNewBtask(username, btaskName, 'upgrade', toDoDevsId, {fileName: fileName})

    let btaskId: number = await daoBtask.addBatchTask(btaskName, username, 'upgrade', fileName, toDoDevsId.length, util.getTime())
    if (btaskId < 0)
        throw Error(`[${util.ErrCode.BtaskOPError}]  创建批量升级任务时发生错误`)
    for (let curDevId of toDoDevsId){
        try {
            await task.upgradeTaskAdd(curDevId, fileName, username, btaskId)
            successNum++
        }catch (e) {
            log.error(`批量任务[id=${btaskId}]: 为设备[devId='${curDevId}']时发生错误`)
            continue
        }
    }
    daoBtask.updateBtaskDevsNum(successNum, btaskId)
    return btaskId
}

export async function customBatchTaskAdd(btaskName: string, username: string, userId: number, allDevsFlag: number, devsId: string[], fileName: string): Promise<any> {
    let toDoDevsId: string[] = allDevsFlag === 1? await daoDev.getDevIdListByUserId(userId) : devsId
    let successNum: number = 0

    await checkNewBtask(username, btaskName, 'custom', toDoDevsId, {fileName: fileName})

    let btaskId: number = await daoBtask.addBatchTask(btaskName, username, 'custom', fileName, toDoDevsId.length, util.getTime())
    if (btaskId < 0)
        throw Error(`[${util.ErrCode.BtaskOPError}]  创建批量升级任务时发生错误`)
    for (let curDevId of toDoDevsId){
        try {
            await task.customTaskAdd(curDevId, fileName, username, btaskId)
            successNum++
        }catch (e) {
            log.error(`批量任务[id=${btaskId}]: 为设备[devId='${curDevId}']时发生错误`)
            continue
        }
    }
    daoBtask.updateBtaskDevsNum(successNum, btaskId)
    return btaskId
}

export async function linkAccessBatchTaskAdd(btaskName: string, username: string, userId: number, allDevsFlag: number, devsId: string[], url: string): Promise<any> {
    let toDoDevsId: string[] = allDevsFlag === 1? await daoDev.getDevIdListByUserId(userId) : devsId
    let successNum: number = 0

    await checkNewBtask(username, btaskName, 'linkAccess', toDoDevsId, {})

    let {fileName, content} =  task.makeLinkFile(url)
    let dev: Dev = await getDev(toDoDevsId[0])
    let ret: number = await nbiFile.uploadFile(fileName, NbiFileType.WebContentFile, dev.getOui(), dev.getDevProductclass(), dev.getSoftVersion(), content);
    if (ret < 0){
        throw Error(`[${ErrCode.BtaskOPError}] 上传链接文件失败`)
    }

    let btaskId: number = await daoBtask.addBatchTask(btaskName, username, 'linkAccess', url, toDoDevsId.length, util.getTime())
    if (btaskId < 0)
        throw Error(`[${util.ErrCode.BtaskOPError}]  创建批量升级任务时发生错误`)
    for (let curDevId of toDoDevsId){
        try {
            let taskId: string = await nbiTask.downloadTaskAdd(encodeURI((await getDev(curDevId) as Dev).getCwmpId())  , fileName);
            await daoTask.addTask(taskId, curDevId, "linkAccess", {url: url, btaskId: btaskId});
            successNum++
        }catch (e) {
            log.error(`批量任务[id=${btaskId}]: 为设备[devId='${curDevId}']时发生错误`)
            continue
        }
    }
    daoBtask.updateBtaskDevsNum(successNum, btaskId)
    return btaskId
}

export async function batchTaskGet(username: string, pageSize: number, pageNumber: number): Promise<any> {
    let retBtasks: any[] = []
    let recordsTotal: number = await daoBtask.countBtasks(username)
    // if (pageNumber !== 1 && ((pageNumber - 1)*pageSize -1) > recordsTotal)
    //     throw Error(`[${ErrCode.FileOPError}] 页码超出当前数据范围`)
    let btasks: any[] = await daoBtask.getBtaskInfo(username, (pageNumber-1)*pageSize, pageSize)
    for(let btask of btasks){
        let finished: number = await daoTask.countByStatus(btask.id, [daoTask.TaskStatus.TASK_STATUS_SUCCESS])
        let failed: number = await daoTask.countByStatus(btask.id, [daoTask.TaskStatus.TASK_STATUS_FAILED])
        let unfinished: number = await daoTask.countByStatus(btask.id, [daoTask.TaskStatus.TASK_STATUS_GET,daoTask.TaskStatus.TASK_STATUS_NO_GET])
        let total: number = finished+failed+unfinished
        retBtasks.push({batchTaskId: btask.id, batchTaskName: btask.btask_name, taskType: btask.task_type, taskArgs: btask.task_args,
            finished: finished, failed: failed, unfinished: unfinished, total: total, createTime: btask.time})
        await daoBtask.updateBtaskDevsNum(total, btask.id)
    }
    return {recordsTotal: recordsTotal, totalPages: Math.floor((recordsTotal+pageSize-1)/pageSize), curPage: pageNumber, batchTasks: retBtasks}
}

export async function batchTaskDelete(btaskId: number): Promise<any> {
    if (!(await daoBtask.isExistBtask(btaskId)))
        throw Error(`[${util.ErrCode.BtaskOPError}]  此批量任务(id:${btaskId})不存在`)
    let tasks: any[] = await daoTask.getTaskByBtask(btaskId, 0, 9999999)
    for (let deltask of tasks){
        await task.deleteTask(deltask.task_id)
    }
    return await daoBtask.removeBtask(btaskId)
}

export async function tasksGet(btaskId: number, pageSize: number, pageNumber: number, taskStatus: number): Promise<any> {
    let tasks: any[] = []
    let recordsTotal: number = await daoTask.countTasks(null, btaskId)
    // if (pageNumber !== 1 && ((pageNumber - 1)*pageSize -1) > recordsTotal)
    //     throw Error(`[${ErrCode.FileOPError}] 页码超出当前数据范围`)
    let rows: any[] = await daoTask.getTaskByBtask(btaskId, (pageNumber-1)*pageSize, pageSize, taskStatus)
    for(let row of rows){
        let task: any = {}
        task.taskId         =   row.task_id
        task.devId          =   row.dev_id
        task.taskName       =   row.task_name
        task.taskStatus     =   row.task_status
        task.taskArgs       =   row.file_name ? row.file_name : row.url
        task.faultCode      =   row.fault_code ? row.fault_code : 0
        task.faultMessage   =   row.fault_msg ? row.fault_msg : ""
        task.faultDetail    =   row.fault_detail ? row.fault_detail : ""
        task.time           =   row.date
        task.retries        =   row.retries ? row.retries : 0
        tasks.push(task)
    }
    return {totalPages: Math.floor((recordsTotal+pageSize-1)/pageSize), curPage: pageNumber, tasks: tasks}
}