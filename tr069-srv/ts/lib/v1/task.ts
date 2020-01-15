import daoTask = require("../../dao/v1/task");
import daoDev = require("../../dao/v1/dev");
import nbiTask = require("../../lib/v1/nbi/task");
import nbiFile = require("../../lib/v1/nbi/file");
import {haveEvent} from "../../daemon/v1/user_event";
import {notify} from "../../daemon/v1/daemon";
import {ITask, Task} from "../../models/v1/tasks";
import {ErrCode, getUnixTime, md5sum} from "./utils";
import {Dev} from "../../models/v1/dev";
import {getDev} from "../../dao/v1/dev";
import {NbiFileType} from "../../config/nbi";
import { log_dev as log } from '../log'

import callfile = require('child_process');
import {CommonConfig} from "../../config/common";
import fs = require("fs");


//数据库task_status:  1 成功，2 失败，3 已获取，4未获取

// req_body = {
//     event: RebootResponse,
//     data: {
//         deviceId: MC119-MC119-78D38DC38456,
//         channel: task_5c8a3aa9c06a180b690256d7
//     }
// };
// req_body = {
//     event: DownloadResponse,
//     data: {
//          status： 1;
//         deviceId: MC119-MC119-78D38DC38456,
//         channel: task_5c8a3aa9c06a180b690256d7
//     }
// };
export async function rebootResponseHandle(req_body: any) {
    let taskId: string = req_body.data.channel.slice(5);
    let devId: string = req_body.data.deviceId.slice(req_body.data.deviceId.lastIndexOf("-")+1);
    let status: number = daoTask.TaskStatus.TASK_STATUS_SUCCESS;
    let username: string = await daoDev.getUsernameByDevid(devId);

    // 更新数据库任务状态
    await daoTask.updateTaskStatus(taskId, status);

    // 发送通知
    if(CommonConfig.EventNotifyEnable && haveEvent(username, "taskStatus")) {
        log.debug("-----------send rebootResponse notify-----------------1");
        notify("userEvent", {
            username:   username,
            event:  "taskStatus",
            devId:  devId,
            data: {
                taskName:   "reboot",
                taskId:     taskId,
                taskResult: daoTask.TaskStatus.TASK_STATUS_SUCCESS
            }
        });
    }
}

export async function factoryResetResponseHandle(req_body: any) {
    let taskId: string = req_body.data.channel.slice(5);
    let devId: string = req_body.data.deviceId.slice(req_body.data.deviceId.lastIndexOf("-")+1);
    let status: number = daoTask.TaskStatus.TASK_STATUS_SUCCESS;
    let username: string = await daoDev.getUsernameByDevid(devId);

    // 更新数据库任务状态
    await daoTask.updateTaskStatus(taskId, status);

    // 发送通知
    if(CommonConfig.EventNotifyEnable && haveEvent(username, "taskStatus")) {
        notify("userEvent", {
            username:   username,
            event:  "taskStatus",
            devId:  devId,
            data: {
                taskName:   "factoryReset",
                taskId:     taskId,
                taskResult: daoTask.TaskStatus.TASK_STATUS_SUCCESS
            }
        });
    }
}

export async function downloadResponseHandle(req_body: any) {
    let taskId: string = req_body.data.channel.slice(5);
    let devId: string = req_body.data.deviceId.slice(req_body.data.deviceId.lastIndexOf("-")+1);
    let status: number = daoTask.TaskStatus.TASK_STATUS_NO_GET;
    let username: string = await daoDev.getUsernameByDevid(devId);

    // 目前按客户端都上传的是 1
    if(req_body.data.status == 1) {
        status = daoTask.TaskStatus.TASK_STATUS_GET;
    }else {
        status = daoTask.TaskStatus.TASK_STATUS_GET;
    }
    // 更新数据库任务状态
    await daoTask.updateTaskStatus(taskId, status);
}

// req_body = {
//             event: 'transferComplete',
//             data: {
//                 channel:  task_5c8a3aa9c06a180b690256d7,
//                 status:  1,
//                 deviceId: MC119-MC119-78D38DC38456,
//                 fault:    { code: 'cwmp.9001',
//                              message: 'Request denied',
//                              detail: { faultCode: '9001', faultString: 'Request denied' },
//                              timestamp: 1552564275641 }
//             }
//         };
export async function transferCompleteHandle(req_body: any) {
    let taskId: string = req_body.data.channel.slice(5);
    let devId: string = req_body.data.deviceId.slice(req_body.data.deviceId.lastIndexOf("-")+1);
    let status: number = daoTask.TaskStatus.TASK_STATUS_GET;
    let task: ITask = await daoTask.getTask(taskId);
    let username: string = await daoDev.getUsernameByDevid(devId);
    let fault: any = {};

    log.debug(`transferCompleteHandle:  taskId: ${taskId}, devId : ${devId} status: ${req_body.data.status}`);
    if(req_body.data.status == 0) {
        status = daoTask.TaskStatus.TASK_STATUS_SUCCESS;
    }else {
        status = daoTask.TaskStatus.TASK_STATUS_FAILED;
        fault.fault_code = parseInt(req_body.data.fault.detail.faultCode);
        fault.fault_msg = req_body.data.fault.message;
        fault.fault_detail = JSON.stringify(req_body.data.fault.detail);
    }
    // 更新数据库任务状态
    await daoTask.updateTaskStatus(taskId, status, fault);

    log.debug(`------ taskId: ${taskId}, retries: ${req_body.data.retries}-------------`);
    if(req_body.data.retries && req_body.data.retries >= 1) {
        return;
    }
    
    // 发送通知
    if(CommonConfig.EventNotifyEnable && haveEvent(username, "taskStatus")) {
        if(status == daoTask.TaskStatus.TASK_STATUS_SUCCESS){
            notify("userEvent", {
                username:   username,
                event:  "taskStatus",
                devId:  devId,
                data: {
                    taskName:   task.task_name,
                    taskId:     taskId,
                    taskResult: daoTask.TaskStatus.TASK_STATUS_SUCCESS
                }
            });
        }else {
            notify("userEvent", {
                username:   username,
                event:  "taskStatus",
                devId:  devId,
                data: {
                    taskName:   task.task_name,
                    taskId:     taskId,
                    taskResult: daoTask.TaskStatus.TASK_STATUS_FAILED,
                    errCode:    fault.fault_code,
                    errMsg:     fault.fault_msg
                }
            });
        }
    }
}

export async function getTaskByDev(devId: string, pageSize: number, pageNumber: number): Promise<any> {
    let tasks: any[] = []
    let recordsTotal: number = await daoTask.countTasks(devId)
    // if (pageNumber !== 1 && ((pageNumber - 1)*pageSize -1) > recordsTotal)
    //     throw Error(`[${ErrCode.FileOPError}] 页码超出当前数据范围`)
    let rows: any[] = await daoTask.getTaskByDev(devId, (pageNumber-1)*pageSize, pageSize)
    for(let row of rows){
        let task: any = {}
        task.taskId         =   row.task_id
        task.taskName       =   row.task_name
        if (row.btask_id)
            task.btaskId = row.btask_id
        task.taskStatus     =   row.task_status
        if (row.file_name || row.url)
            task.taskArgs = row.file_name ? row.file_name : row.url
        task.faultCode      =   row.fault_code ? row.fault_code : 0
        task.faultMessage   =   row.fault_msg ? row.fault_msg : ""
        task.faultDetail    =   row.fault_detail ? row.fault_detail : ""
        task.time           =   row.date
        task.retries        =   row.retries ? row.retries : 0
        tasks.push(task)
    }
    return {totalPages: Math.floor((recordsTotal+pageSize-1)/pageSize), curPage: pageNumber, tasks: tasks}
}

export async function retryTask(taskId: string, username: string): Promise<any> {
    let ret: any = await daoTask.checkTask(taskId)
    if (!ret)
        throw Error(`[${ErrCode.TaskNoExist}]`)
    if (ret.task_status != daoTask.TaskStatus.TASK_STATUS_FAILED)
        throw Error(`[${ErrCode.TaskOPError}] 任务并未执行失败，无法重试`)
    
    ret.retries = ret.retries == null? 0 : ret.retries
    let resStatusCode: number = await nbiTask.taskRetry(taskId)
    if (resStatusCode < 0)
        throw Error(`[${ErrCode.TaskOPError}] 任务重试出错`)
    else if (resStatusCode === 404){
        log.debug("Task not found! Rebuild new task..")
        let newTaskId: string = ""
        switch (ret.task_name) {
            case "reboot":
                newTaskId = await rebootTaskAdd(ret.dev_id);
                break;
            case "factoryReset":
                newTaskId = await factoryResetTaskAdd(ret.dev_id);
                break;
            case "upgrade":
                newTaskId = await upgradeTaskAdd(ret.dev_id, ret.file_name, username);
                break;
            case "linkAccess":
                newTaskId = await linkAccessTaskAdd(ret.dev_id, ret.url);
                break;
        }
        await deleteTask(taskId)
        await daoTask.restoreNewTask(newTaskId, ret.date, ret.retries+1, ret.btask_id?ret.btask_id:null)
        return newTaskId
    }
    await daoTask.restoreTask(taskId, ret.retries+1)
    return taskId
}

export async function deleteTask(taskId: string): Promise<any> {
    await daoTask.getTask(taskId)
    let sqlDelNum: number = await daoTask.removeTask(taskId)
    if (!(sqlDelNum > 0)) {
        throw Error(`[${ErrCode.TaskOPError}] 删除任务失败`)
    }
    nbiTask.taskDelete(taskId)
    return taskId
}

export async function rebootTaskAdd(devId: string): Promise<any> {
    let dev: Dev = await getDev(devId);
    let taskId: string = await nbiTask.rebootTaskAdd(encodeURI(dev.getCwmpId()));
    await daoTask.addTask(taskId, devId, "reboot")
    return taskId
}

export async function factoryResetTaskAdd(devId: string): Promise<any> {
    let dev: Dev = await getDev(devId);
    let taskId: string = await nbiTask.factoryResetTaskAdd(encodeURI(dev.getCwmpId()))
    await daoTask.addTask(taskId, devId, "factoryReset")
    return taskId
}

export async function upgradeTaskAdd(devId: string, fileName: string, username: string, btaskId?: number): Promise<any> {
    let dev: Dev = await getDev(devId);
    let fileAliasName: string = `${fileName}-${username}`
    let taskId: string = await nbiTask.downloadTaskAdd(encodeURI(dev.getCwmpId()), fileAliasName)
    await daoTask.addTask(taskId, devId, "upgrade", {fileName: fileName, btaskId: btaskId})
    return taskId
}

export async function customTaskAdd(devId: string, fileName: string, username: string, btaskId?: number): Promise<any> {
    let dev: Dev = await getDev(devId);
    let fileAliasName: string = `${fileName}-${username}`
    let taskId: string = await nbiTask.downloadTaskAdd(encodeURI(dev.getCwmpId()), fileAliasName)
    await daoTask.addTask(taskId, devId, "custom", {fileName: fileName, btaskId: btaskId})
    return taskId
}

export async function linkAccessTaskAdd(devId: string, url: string): Promise<any> {
    let taskId: string = ""

    log.info(`linkAccessTaskAdd  url : ${url}`);
    // url 参数检查
    if(url == "") {
        throw new Error(`[${ErrCode.ParameterErr}] url参数不正确`);
    }

    // 制作链接文件
    let {fileName, content} =  makeLinkFile(url);

    // 上传文件
    let dev: Dev = await getDev(devId);
    log.info(`uploadFile  fileName: ${fileName}`);
    let ret: number = await nbiFile.uploadFile(fileName, NbiFileType.WebContentFile, dev.getOui(), dev.getDevProductclass(), dev.getSoftVersion(), content);
    if (ret < 0){
        throw Error(`[${ErrCode.TaskCreateErr}] 上传链接文件失败`)
    }

    // 下发download任务
    log.debug("encodeURI(dev.getCwmpId())----------------: " + encodeURI(dev.getCwmpId()));
    taskId = await nbiTask.downloadTaskAdd(encodeURI(dev.getCwmpId()), fileName);
    await daoTask.addTask(taskId, devId, "linkAccess", {url: url});
    return taskId
}

export function makeLinkFile(url: string): any {
    let fileName: string = md5sum(url).slice(-4) + getUnixTime().toString() + ".tar.gz";
    let filePath: string = `${CommonConfig.LinkAccessFilePath}/${fileName}`;
    let content: any;

    log.debug(`fileName: ${fileName}, filePath: ${filePath}`);

    // 调用脚本创建文件
    let stdout = callfile.execFileSync(CommonConfig.MakeLinkFileShFilePath, ['-f', fileName, '-u', url, '-p', CommonConfig.LinkAccessFilePath], {timeout: 1000 * 20});
    log.debug(`stdout: ${stdout}`);
    if(!fs.existsSync(filePath)){
        throw new Error(`[${ErrCode.ServerErr}]  链接文件创建失败`);
    }

    // 读取 content
    content = fs.readFileSync(filePath);

    // 删除文件
    fs.unlinkSync(filePath);
    
    return {
        fileName:   fileName,
        content:    content
    }
}


