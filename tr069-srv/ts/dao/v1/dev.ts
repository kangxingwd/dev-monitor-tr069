import {IDev, Dev, getDefaultDev} from "../../models/v1/dev";
import {getConnectionAsync, transactionAsync} from "../../lib/mysqlpool";
import {ErrCode, getTime, getUnixTime, md5sum} from "../../lib/v1/utils";
import {Account} from "../../models/v1/account";
import daoAccount = require("../../dao/v1/account");
import {log_dev as log} from "../../lib/log";
import {IEvent} from "../../models/v1/event";
import {getNbiDevInfoFunMap} from "../../lib/v1/device";

export async function getAllDev(): Promise<any> {
    let sql = `select * from dev;`;
    let rows: any = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    return rows
}

export async function getDev(devId: string): Promise<any> {
    let sql = `select * from dev where dev_id = '${devId}' `;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.DevInfoError}] 设备不存在 ${devId}`)
    }
    return new Dev(rows[0])
}

export async function getDevIdList(): Promise<any> {
    let idList: string[] = [];
    let sql = `select dev_id,cwmp_id from dev;`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let v of rows) {
        idList.push(v.dev_id)
    }
    return idList
}

export async function getDevIdListByUserId(userId: number): Promise<any> {
    let idList: string[] = [];
    let sql = `select dev_id from dev where user_id = ${userId};`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let v of rows) {
        idList.push(v.dev_id)
    }
    return idList
}

export async function getAllDevIdListByUserId(userId: number): Promise<any> {
    let devIdList: string[] = [];
    let userIdList:number[] = await daoAccount.getAllSubUserIdList(userId);
    let sql = `select dev_id from dev where user_id in (${userIdList.join(",")});`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let v of rows) {
        devIdList.push(v.dev_id)
    }
    return devIdList
}

export async function getUsernameByDevid(devId: string): Promise<any> {
    let dev: Dev = await getDev(devId);
    let sql = `select username from account where id = ${dev.getUserId()}`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.DevAccountInfoErr}] 设备账号信息不对应！`)
    }
    return rows[0].username;
}

export async function devExist(devId: string): Promise<any> {
    let sql = `select * from dev where dev_id = '${devId}' `;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows.length != 0;
}

// dev_id  user_id cwmp_id manufacturer oui soft_version dev_productclass ip connect_ip assign_time assign_userid status lastInform history_online_time ext
export async function devAdd(dev: IDev) {
    let sql = `select * from dev where dev_id = '${dev.dev_id}' `;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if( rows.length == 0 ) {
        sql = `INSERT INTO dev(dev_id, user_id, cwmp_id, manufacturer, oui, soft_version, dev_productclass, ip, connect_ip, 
              assign_time, assign_userid, status, last_inform, history_online_time, ext) 
              values('${dev.dev_id}', 
              1, 
              '${dev.cwmp_id}',
              '${dev.manufacturer}',
              '${dev.oui}',
              '${dev.soft_version}', 
              '${dev.dev_productclass}', 
              '${dev.ip}',
              '${dev.connect_ip}',
              '${dev.assign_time}',
              ${dev.assign_userid},
              ${dev.status},
              ${dev.last_inform}, 
              ${dev.history_online_time},
              '${dev.ext}')`;
        log.debug("--- insert new dev sql: " + sql);
        await getConnectionAsync(async conn => await conn.queryAsync(sql));
    }
}

export async function devAddDefault(dev: IDev) {
   let sql = `INSERT INTO dev(dev_id, user_id, cwmp_id, manufacturer, oui, soft_version, dev_productclass, ip, connect_ip, 
          assign_time, assign_userid, status, last_inform, history_online_time, ext) 
          values('${dev.dev_id}', 
          1, 
          '${dev.cwmp_id}',
          '${dev.manufacturer}',
          '${dev.oui}',
          '${dev.soft_version}', 
          '${dev.dev_productclass}', 
          '${dev.ip}',
          '${dev.connect_ip}',
          '${getTime()}',
          1,
          ${dev.status},
          ${dev.last_inform}, 
          0,
          '')`;
    log.debug("--- insert new dev sql: " + sql);
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function updateDevsInfo(devs: IDev[]) {
    let sqlList: string[] = [];
    await transactionAsync(async conn => {
        for (let dev of devs){
            let sql = `update dev set cwmp_id='${dev.cwmp_id}',soft_version = '${dev.soft_version}',ip = '${dev.ip}',connect_ip = '${dev.connect_ip}' where dev_id = '${dev.dev_id}'`;
            await conn.queryAsync(sql);
        }
    });
}

export async function changeUserId(userId: number, devices: string[]): Promise<any> {
    let sql:string;
    // 修改设备的 parent_id
    if (devices.length !== 0) {
        sql = `update dev set user_id = ${userId},assign_userid = ${userId},assign_time = '${getTime()}' where dev_id in ('${devices.join("\',\'")}')`;
        await getConnectionAsync(async conn => await conn.queryAsync(sql));
    }
    // TODO 修改设备的代理商后对于任务的处理
}

export async function getDevProductclassList(userId: number, level: number): Promise<any> {
    let devProductclassList: string[] = [];
    let sql: string;
    switch (level) {
        case 1:
            sql = `select distinct dev_productclass from dev;`;
            break;
        case 2:
            let userIdList: string[] = await daoAccount.getAllSubUserIdList(userId);
            sql = `select distinct dev_productclass from dev where user_id in (${userIdList.join(",")});`;
            break;
        case 3:
            sql = `select distinct dev_productclass from dev where user_id = ${userId};`;
            break;
        default:
            throw Error("非法操作，您的账号出现问题，请联系上级代理商。");
    }
    log.debug("getDevProductclassList sql: " + sql);
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let v of rows) {
        devProductclassList.push(v.dev_productclass);
    }
    return devProductclassList
}

export async function getSoftVersionList(userId: number, level: number): Promise<any> {
    let softVersionList: string[] = [];
    let sql: string;
    switch (level) {
        case 1:
            sql = `select distinct soft_version from dev;`;
            break;
        case 2:
            let userIdList: string[] = await daoAccount.getAllSubUserIdList(userId);
            sql = `select distinct soft_version from dev where user_id in (${userIdList.join(",")});`;
            break;
        case 3:
            sql = `select distinct soft_version from dev where user_id = ${userId};`;
            break;
        default:
            throw Error("非法操作，您的账号出现问题，请联系上级代理商。");
    }
    log.debug("getSoftVersionList sql: " + sql);
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let v of rows) {
        softVersionList.push(v.soft_version);
    }
    return softVersionList
}

export async function delDev(devId: string): Promise<any> {
    try {
        // 删除设备
        let sql = `delete from dev where dev_id = '${devId}';`;
        log.debug("delDev from dev_user sql: " + sql);
        await getConnectionAsync(async conn => await conn.queryAsync(sql));

        // 删除非批量任务
        sql = `select btask_id from tasks where dev_id = '${devId}' and ISNULL(btask_id)`;
        let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
        if (rows.length != 0) {
            sql = `delete from tasks where dev_id = '${devId}';`;
            await getConnectionAsync(async conn => await conn.queryAsync(sql));
        }

        //更新批量任务设备状态
        sql = `update tasks set dev_exist = 0 where dev_id = '${devId}';`;
        await getConnectionAsync(async conn => await conn.queryAsync(sql));
    }catch (e) {
        throw Error("删除设备失败! 设备ID：" + devId + e.message)
    }
}


