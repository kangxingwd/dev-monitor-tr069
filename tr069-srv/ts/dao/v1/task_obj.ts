import {getConnectionAsync} from "../../lib/mysqlpool";

export async function isExistTaskObj(objName: string, username: string): Promise<number> {
    let sql = `select id from task_obj where name = '${objName}' and username = '${username}'`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length > 0)
        return rows[0].id
    else
        return null
}

export async function isExistTaskObjById(id: number): Promise<boolean> {
    let sql = `select id from task_obj where id = ${id}`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length > 0)
        return rows[0].id
    else
        return null
}

export async function createTaskObj(objName: string, desc: string, username: string, taskType: string, date: string, upgradeFile?: string, url?: string, customFile?: string): Promise<number> {
    let sqlHead: string = `insert into task_obj(name,description,username,task_type,date`;
    let sqlTail: string = `) values('${objName}','${desc}','${username}','${taskType}','${date}'`
    if (upgradeFile){
        sqlHead = sqlHead + `,upgrade_file`
        sqlTail = sqlTail + `,'${upgradeFile}'`
    }else if (url){
        sqlHead = sqlHead + `,url`
        sqlTail = sqlTail + `,'${url}'`
    }else if (customFile){
        sqlHead = sqlHead + `,custom_file`
        sqlTail = sqlTail + `,'${customFile}'`
    }
    let sql: string = sqlHead + sqlTail + ')'
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if(ret && ret.insertId) {
        return ret.insertId
    }
    return -1
}

export async function updateTaskObj(id: number, objName: string, desc: string, taskType: string, upgradeFile?: string, url?: string, customFile?: string): Promise<number> {
    let sql = `update task_obj set name='${objName}',description='${desc}',task_type='${taskType}'`
    if (upgradeFile){
        sql = sql + `,upgrade_file='${upgradeFile}'`
    }else if (url){
        sql = sql + `,url='${url}'`
    }else if (customFile){
        sql = sql + `,custom_file='${customFile}'`
    }
    sql = sql + ` where id=${id}`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any
    return ret.affectedRows
}

export async function countTaskObj(username: string): Promise<any> {
    let sql = `select count(*) as objcount from task_obj where username = '${username}'`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret[0].objcount
}

export async function retrieveTaskObj(username: string, objName?: string, start?: number, limit?: number): Promise<any> {
    let sql = `select * from task_obj where username = '${username}'`
    if (objName)
        sql = sql + ` and name = '${objName}'`
    if (start && limit)
        sql = sql + ` limit ${start},${limit}`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows
}

export async function deleteTaskObj(delIds: number[]): Promise<number> {
    let sql = `delete from task_obj where id in ('${delIds.join("\',\'")}')`;
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}

