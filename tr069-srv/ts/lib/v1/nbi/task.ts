import {NbiConfig,NbiApi} from '../../../config/nbi';
import {delAsync, getAsync, postAsync, RespStruct} from "./common";
import * as querystring from "querystring";
import {ErrCode} from "../utils";

async function commonTaskAdd(device_id: string, nbiBody: any): Promise<any> {
    let url: string = `${NbiConfig.nbiAddress}/devices/${device_id}/tasks`
    let ret: any = await postAsync({ url: url, body: JSON.stringify(nbiBody) })
    if (ret.error || ((ret.statusCode != 200) && (ret.statusCode != 202))) {
        throw Error(`[${ErrCode.TaskCreateErr}] 任务下发失败`)
    }
    let resBody: any = ret.body ? JSON.parse(ret.body) : {}
    if(!resBody._id){
        throw Error(`[${ErrCode.TaskCreateErr}] 无法获取任务id`)
    }
    let taskId: string = resBody._id
    return taskId
}

export async function rebootTaskAdd(device_id: string): Promise<any> {
    let nbiBody: any = {
        name: "reboot"
    }
    return await commonTaskAdd(device_id, nbiBody)
}

export async function factoryResetTaskAdd(device_id: string): Promise<any> {
    let nbiBody: any = {
        name: "factoryReset"
    }
    return await commonTaskAdd(device_id, nbiBody)
}

export async function downloadTaskAdd(device_id: string, filename: string): Promise<any> {
    let nbiBody: any = {
        name: "download",
        file: filename,
        filename: filename
    }
    return await commonTaskAdd(device_id, nbiBody)
}

export async function taskRetry(taskId: string): Promise<any> {
    let url: string = `${NbiConfig.nbiAddress}/tasks/${taskId}/retry`
    let ret: RespStruct = await postAsync({ url: url})
    if((!ret.error) && (ret.statusCode === 200 || ret.statusCode === 404)){
        return ret.statusCode
    }else{
        return -1
    }
}

export async function taskDelete(taskId: string): Promise<any> {
    let url: string = `${NbiConfig.nbiAddress}/tasks/${taskId}`
    let ret: RespStruct = await delAsync({url})
    console.log(ret.statusCode)
    if((!ret.error) && (ret.statusCode === 200 || ret.statusCode === 404)){
            return ret.statusCode
    }else{
        return -1
    }
}

