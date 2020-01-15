import {ITask, Task} from "../../models/v1/tasks";
import {getConnectionAsync} from "../../lib/mysqlpool";
import {Dev} from "../../models/v1/dev";
import {ErrCode, getTime} from "../../lib/v1/utils";
import { log_dev as log } from '../../lib/log'

export const TaskStatus = {
    TASK_STATUS_SUCCESS:        0,  //  成功
    TASK_STATUS_FAILED:         1,  //  失败
    TASK_STATUS_GET:            2,  //  已获取
    TASK_STATUS_NO_GET:         3   //  未获取
};

interface taskOptionalParam {
    fileName?: string,
    btaskId?: number,
    url?: string
}

export async function getTask(taskId: string): Promise<any> {
    let idList: string[] = [];
    let sql = `select * from tasks where task_id = '${taskId}' `;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.TaskNoExist}] 任务不存在`)
    }
    return rows[0]
}

export async function getTaskByDev(devId: string, start: number, limit: number): Promise<any> {
    let sql = `select * from tasks where dev_id = '${devId}' limit ${start},${limit}`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows
}

export async function countTasks(devId?: string, btaskId?: number): Promise<any> {
    let sql = `select count(*) as taskcount from tasks where`
    sql = devId? (sql + ` dev_id = '${devId}'`) : sql
    sql = btaskId? (sql + ` btask_id = ${btaskId}`) : sql
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows[0].taskcount
}

// faultInfo = {
//      fault_code = 9001,
//      fault_msg = "",
//      fault_detail = "",
// }
export async function updateTaskStatus(taskId: string, status: number, faultInfo?: any): Promise<any> {
    if(taskId == "" || isNaN(status)) {
        return
    }

    let sql: string = "";
    if(status == TaskStatus.TASK_STATUS_FAILED) {
        sql = `update tasks set task_status=${status},fault_code=${faultInfo.fault_code},
            fault_msg='${faultInfo.fault_msg}',fault_detail='${faultInfo.fault_detail}' where task_id = '${taskId}';`;
    }else {
        sql = `update tasks set task_status=${status},fault_code=0,fault_msg='',fault_detail='' where task_id = '${taskId}';`;
    }

    log.debug("--- updateTaskStatus sql: " + sql);
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function addTask(taskId: string, devId: string, taskName: string, optionalParam?: taskOptionalParam): Promise<any> {
    if(taskId == "") {
        return
    }

    let sql_head: string = `insert into tasks(task_id, dev_id, task_name, task_status, dev_exist, retries, date`
    let sql_tail: string = `) values('${taskId}', '${devId}', '${taskName}', ${TaskStatus.TASK_STATUS_NO_GET}, 1, 0, '${getTime()}'`

    if (optionalParam){
        if (optionalParam.btaskId){
            sql_head = sql_head + ', btask_id'
            sql_tail = sql_tail + `, ${optionalParam.btaskId}`
        }
        if (optionalParam.fileName){
            sql_head = sql_head + ', file_name'
            sql_tail = sql_tail + `, '${optionalParam.fileName}'`
        }
        if (optionalParam.url){
            sql_head = sql_head + ', url'
            sql_tail = sql_tail + `, '${optionalParam.url}'`
        }
    }

    let sql: string = sql_head + sql_tail + ')'

    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql))
    return ret.affectedRows
}

export async function removeTask(taskId: string): Promise<any> {
    if(taskId == "") {
        return 0
    }
    let sql = `delete from tasks where task_id = '${taskId}'`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}

export async function countByStatus(btaskId: number, status: number[]): Promise<any> {
    let statusStr: string = `${status.join(",")}`
    let sql = `select count(*) as num from tasks where btask_id = ${btaskId} and task_status in (${statusStr})`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret[0].num
}

export async function getTaskByBtask(btaskId: number, start: number, limit: number, taskStatus?: number): Promise<any> {
    let sql_head = `select * from tasks where btask_id = ${btaskId}`
    let sql_tail = ` limit ${start},${limit}`
    if (taskStatus != null){
        if (taskStatus == 0)
            sql_head = sql_head + ` and task_status = ${TaskStatus.TASK_STATUS_SUCCESS}`
        if (taskStatus == 1)
            sql_head = sql_head + ` and task_status = ${TaskStatus.TASK_STATUS_FAILED}`
        if (taskStatus == 2)
            sql_head = sql_head + ` and task_status in (${TaskStatus.TASK_STATUS_GET},${TaskStatus.TASK_STATUS_NO_GET})`
    }
    let sql = sql_head + sql_tail
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows
}

export async function checkTask(taskId: string): Promise<any> {
    let sql = `select task_id, dev_id, task_name, btask_id, file_name, url, task_status, retries, date from tasks where task_id = '${taskId}'`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows[0]
}

export async function restoreTask(taskId: string, retries: number): Promise<any> {
    let sql: string = `update tasks set channel = NULL, task_status = ${TaskStatus.TASK_STATUS_NO_GET}, fault_code = NULL, fault_msg = NULL, fault_detail = NULL, retries = ${retries} where task_id = '${taskId}'`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}

export async function restoreNewTask(taskId: string, date: string, retries: number, btaskId?: number): Promise<any> {
    let sql_head: string = `update tasks set date = '${date}', retries = ${retries}`
    let sql_tail: string = ` where task_id = '${taskId}'`
    if (typeof btaskId == 'number')
        sql_head = sql_head + `, btask_id = ${btaskId}`
    let sql: string = sql_head + sql_tail
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}





