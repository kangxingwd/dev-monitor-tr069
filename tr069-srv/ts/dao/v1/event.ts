import {IEvent, Event} from "../../models/v1/event";
import {getConnectionAsync} from "../../lib/mysqlpool";
import {ErrCode} from "../../lib/v1/utils";

export async function userEventAdd(username:string, event: string, url: string) {
    let sql = `select id from event where username = '${username}' and event = '${event}';`;
    let rows: any = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length != 0) {
        throw Error(`[${ErrCode.EventAlreadyRegistered}] `)
    }
    sql = `insert into event (username, event, url, ext) values('${username}', '${event}', '${url}', '')`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function userEventUpdate(username:string, event: string, url: string) {
    let sql = `select id from event where username = '${username}' and event = '${event}';`;
    let rows: any = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length == 0) {
        throw Error(`[${ErrCode.EventNotRegistered}] `)
    }
    sql = `update event set url = '${url}' where username = '${username}' and event = '${event}'`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function userEventDel(username:string, event: string) {
    let sql = `select id from event where username = '${username}' and event = '${event}';`;
    let rows: any = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length == 0) {
        throw Error(`[${ErrCode.EventNotRegistered}] `)
    }
    sql = `delete from event where username = '${username}' and event = '${event}';`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function getAllUserEvent(): Promise<any> {
    let userEventList: IEvent[] = [];
    let sql = `select * from event;`;
    let rows: any = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    for (let v of rows) {
        userEventList.push(v);
    }
    return userEventList
}

export async function getAllUserEventByUsername(username: string): Promise<any> {
    let userEventList: IEvent[] = [];
    let sql = `select * from event where username='${username}';`;
    let rows: any = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    for (let v of rows) {
        userEventList.push({
            event:  v.event,
            url:    v.url
        });
    }
    return userEventList
}

