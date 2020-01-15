import {DayOnline, IDayOnline} from "../../models/v1/dayOnline"
import {getConnectionAsync} from "../../lib/mysqlpool"
import {IDev} from "../../models/v1/dev";

export async function addOnlineTimeOnDay(devId: string, date: number, onlineTime: number): Promise<any> {
    let sql = `insert into day_online(dev_id, date, online_time) values('${devId}', ${date}, ${onlineTime})`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}

export async function updateOnlineTimeOnDay(id: number, onlineTime: number): Promise<any> {
    let sql = `update day_online set online_time = ${onlineTime} where id = ${id}`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}

export async function getOnlineTimeOnDay(devId: string, date: number): Promise<any> {
    let sql = `select id, online_time from day_online where dev_id = '${devId}' and date = '${date}' `
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0){
        return null
    }
    let ret: IDayOnline = {id: rows[0].id, online_time: rows[0].online_time}
    return ret
}

export async function getDevsOnlineTimeOnDay(devIds: string[], date: number): Promise<any> {
    let devIdstr: string = `'${devIds.join("','")}'`
    let sql = `select dev_id, online_time from day_online where dev_id in (${devIdstr}) and date = '${date}' `
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0){
        return []
    }
    let ret: IDayOnline[] = []
    for(let i = 0; i < rows.length; i++){
        ret.push({dev_id: rows[i].dev_id, online_time: rows[i].online_time})
    }
    return ret
}

export async function getOnlineTimeInDays(devId: string, date_start: number, date_end: number): Promise<any> {
    let sql = `select sum(online_time) as totalTime from day_online where dev_id = '${devId}' and date >= ${date_start} and date <= ${date_end}`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows[0].totalTime
}

export async function getSingleDevTime(devId: string): Promise<any> {
    let sql = `select dev_id, status, last_inform, history_online_time from dev where dev_id = '${devId}'`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0){
        return null
    }
    let retDev: IDev = {dev_id: rows[0].dev_id, status: rows[0].status, last_inform: rows[0].last_inform, history_online_time: rows[0].history_online_time}
    return retDev
}

export async function getDevsTime(devIds: string[]): Promise<any> {
    let devIdstr: string = `'${devIds.join("','")}'`
    let sql = `select dev_id, status, last_inform, history_online_time from dev where dev_id in (${devIdstr})`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0){
        return []
    }
    let retDevs: IDev[] = []
    for(let i = 0; i < rows.length; i++){
        retDevs.push({dev_id: rows[i].dev_id, status: rows[i].status, last_inform: rows[i].last_inform, history_online_time: rows[i].history_online_time})
    }
    return retDevs
}

export async function updateDevTime(devId: string, lastinform: number, history_online_time: number): Promise<any> {
    let sql = `update dev set last_inform = ${lastinform}, history_online_time = ${history_online_time} where dev_id = '${devId}'`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any
    return ret.affectedRows
}

export async function updateDevStatus(devId: string, status: number): Promise<any> {
    let sql = `update dev set status = ${status} where dev_id = '${devId}'`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any
    return ret.affectedRows
}

export async function getAllDevsbyStatus(status: number): Promise<any> {
    let sql = `select dev_id, last_inform from dev where status = ${status}`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0){
        return []
    }
    let retDevs: IDev[] = []
    for(let i = 0; i < rows.length; i++){
        retDevs.push({dev_id: rows[i].dev_id, last_inform: rows[i].last_inform})
    }
    return retDevs
}

export async function setDevsStatus(devIds: string[], status: number): Promise<any> {
    let devIdstr: string = `'${devIds.join("','")}'`
    let sql = `update dev set status = ${status} where dev_id in (${devIdstr})`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any
    return ret.affectedRows
}


export async function clearBeforeTime(timeStamp: number): Promise<any> {
    let sql = `delete from day_online where date < ${timeStamp}`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any
    return ret.affectedRows
}
