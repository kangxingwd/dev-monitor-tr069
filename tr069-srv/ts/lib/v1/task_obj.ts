import daoObj = require("../../dao/v1/task_obj");
import daoFile = require("../../dao/v1/file");
import util = require("./utils")
import {ITaskObj} from "../../models/v1/taskObj";


export async function createTaskObj(username: string, objName: string, desc: string, taskType: string, args: any): Promise<number> {
    if (await daoObj.isExistTaskObj(objName,username)) {
        throw Error(`[${util.ErrCode.TaskObjError}] 已存在同名任务对象`)
    }
    if (taskType == "upgrade" && !(await daoFile.isExistFile(`${args.upgradeFile}-${username}`))) {
        throw Error(`[${util.ErrCode.TaskObjError}] 请先上传升级固件文件'${args.upgradeFile}'`)
    }
    if (taskType == "custom" && !(await daoFile.isExistFile(`${args.customFile}-${username}`))) {
        throw Error(`[${util.ErrCode.TaskObjError}] 请先上传自定义文件'${args.customFile}'`)
    }
    let time: string = util.getTime()
    let objId: number = await daoObj.createTaskObj(objName, desc, username, taskType, time, args.upgradeFile, args.url, args.customFile)
    if (objId < 0)
        throw Error(`[${util.ErrCode.TaskObjError}] 创建任务对象失败`)
    return objId
}

export async function modifiTaskObj(id: number, objName: string, username: string, desc: string, taskType: string, args: any): Promise<number> {
    if (!await daoObj.isExistTaskObjById(id)) {
        throw Error(`[${util.ErrCode.TaskObjError}] 不存在此任务对象`)
    }
    let getId: number = await daoObj.isExistTaskObj(objName,username)
    if (getId != null && id != getId) {
        throw Error(`[${util.ErrCode.TaskObjError}] 已存在同名任务对象`)
    }
    if (taskType == "upgrade" && !(await daoFile.isExistFile(`${args.upgradeFile}-${username}`))) {
        throw Error(`[${util.ErrCode.TaskObjError}] 请先上传升级固件文件'${args.upgradeFile}'`)
    }
    if (taskType == "custom" && !(await daoFile.isExistFile(`${args.customFile}-${username}`))) {
        throw Error(`[${util.ErrCode.TaskObjError}] 请先上传自定义文件'${args.customFile}'`)
    }
    let modNum: number = await daoObj.updateTaskObj(id, objName, desc, taskType, args.upgradeFile, args.url, args.customFile)
    if (modNum < 0)
        throw Error(`[${util.ErrCode.TaskObjError}] 修改任务对象失败`)
    return modNum
}

export async function getTaskObjs(username: string, pageSize: number, pageNumber: number): Promise<any> {
    let objs: any[] = []
    let recordsTotal: number = await daoObj.countTaskObj(username)
    let rows: ITaskObj[] = await daoObj.retrieveTaskObj(username, null, (pageNumber-1)*pageSize, pageSize)
    for (let row of rows){
        let obj: any = {}
        obj.taskObjId = row.id
        obj.name = row.name
        obj.desc = row.description
        obj.taskType = row.task_type
        if (obj.taskType == 'upgrade') obj.taskArgs = row.upgrade_file
        if (obj.taskType == 'linkAccess') obj.taskArgs = row.url
        if (obj.taskType == 'custom') obj.taskArgs = row.custom_file
        objs.push(obj)
    }
    return {totalPages: Math.floor((recordsTotal+pageSize-1)/pageSize), curPage: pageNumber, taskObjects: objs}
}

export async function getOneTaskObj(username: string, objName: string): Promise<any> {
    let rows: ITaskObj[] = await daoObj.retrieveTaskObj(username, objName)
    if (!(rows.length > 0))
        throw Error(`[${util.ErrCode.TaskObjError}] 不存在此任务对象`)
    let obj: any = {}
    obj.taskObjId = rows[0].id
    obj.name = rows[0].name
    obj.desc = rows[0].description
    obj.taskType = rows[0].task_type
    if (obj.taskType == 'upgrade') obj.taskArgs = rows[0].upgrade_file
    if (obj.taskType == 'linkAccess') obj.taskArgs = rows[0].url
    if (obj.taskType == 'custom') obj.taskArgs = rows[0].custom_file
    return obj
}

export async function delTaskObjs(ids: number[]): Promise<number> {
    let delNum: number = await daoObj.deleteTaskObj(ids)
    return delNum
}
