import {BatchTask, IBatchTask} from "../../models/v1/batchTask";
import {getTime} from "../../lib/v1/utils";
import {getConnectionAsync} from "../../lib/mysqlpool";

export async function addBatchTask(btaskName: string, username: string, taskType: string, taskArgs: string, devsNum: number, time: string): Promise<any> {
    let sql: string = `insert into btask(btask_name, username, task_type, task_args, devs_num, time) values('${btaskName}', '${username}', '${taskType}', '${taskArgs}', ${devsNum}, '${time}')`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql))
    if(ret && ret.insertId) {
        return ret.insertId
    }
    return -1
}

export async function updateBtaskDevsNum(devsNum: number, btaskId: number): Promise<any> {
    let sql: string = `update btask set devs_num = ${devsNum} where id = ${btaskId}`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql))
    if(ret && ret.affectedRows) {
        return ret.affectedRows
    }
    return -1
}

export async function getBtaskInfo(username: string, start: number, limit: number): Promise<any> {
    let sql: string = `select id, btask_name, task_type, task_args, devs_num, time from btask where username = '${username}' limit ${start},${limit}`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql))
    return rows
}

export async function countBtasks(username: string): Promise<any> {
    let sql: string = `select count(*) as btaskcount from btask where username = '${username}'`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql))
    return rows[0].btaskcount
}

export async function isExistBtask(btaskId?: number, btaskName?: string): Promise<boolean> {
    let sql: string = `select id from btask where 1=1`
    if (btaskId)
        sql = sql + ` and id = ${btaskId}`
    if (btaskName)
        sql = sql + ` and btask_name = '${btaskName}'`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql))
    return rows.length > 0 ? true : false
}

export async function removeBtask(btaskId: number): Promise<any> {
    let sql: string = `delete from btask where id = ${btaskId}`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql))
    return ret.affectedRows
}