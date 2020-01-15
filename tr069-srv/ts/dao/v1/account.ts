import express = require('express');
import {getConnectionAsync} from "../../lib/mysqlpool";
import { getRedisClientAsync } from "../../lib/redispool"
import {getTime, md5sum, sendError, sendOk} from "../../lib/v1/utils";
import {Account} from "../../models/v1/account";
import {ErrCode} from "../../lib/v1/utils";
import {Dev} from "../../models/v1/dev";
import { rdb } from "../../config/redis"
import { log_dev as log } from '../../lib/log'

export async function checkUser(username: string, password: string): Promise<any> {
    let sql = `select * from account where username = '${username}' `;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AuthenticationFailed}] 账号错误`)
    }
    if (rows[0].enable === 0) {
        throw Error(`[${ErrCode.AuthenticationFailed}]账号已被禁用`)
    }
    if (rows[0].password !== password) {
        throw Error(`[${ErrCode.AuthenticationFailed}] 密码错误`)
    }
    rows[0].token = md5sum(`${new Date().getTime()}_${Math.random()}`);  //getRandStr(32)
    return new Account(rows[0])
}

export async function loginCheck(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        let { token, account_id } = (req as any).cookies;
        if (!token || !account_id) {
            let authorization = req.headers.authorization;
            if(authorization == undefined || !req.headers.authorization){
                // res.writeHead(401,{
                //     'content-Type':'text/plain',
                //     'WWW-Authenticate':'Basic realm="family"'
                // });
                // res.end('');
                // return
                throw new Error(`[${ErrCode.AuthenticationFailed}] 认证失败或超时！`)
            }else{
                let str = req.headers.authorization;
                str = str.slice(6,str.length);
                console.log( "--req.headers.authorization:  " + str);

                let str1 = new Buffer(str,'base64').toString();
                let arr = str1.split(":");

                console.log(`user: ${arr[0]}  passwd: ${arr[1]}`);
                req.query['map'] = await checkUser(arr[0], arr[1]);
            }
        }else {
            let redis_data = await getLoginAsync(token);
            let map = JSON.parse(redis_data);
            req.query['map'] = map;
            if ( !map || !map.token || map.token !== token) {
                throw Error(`[${ErrCode.AuthenticationFailed}] 认证失败或超时！`)
            }
        }
        next()
    } catch (e) {
        return sendError(res, e.message)
    }
}

// export async function loginCheck(req: express.Request, res: express.Response, next: express.NextFunction) {
//     try {
//         let authorization = req.headers.authorization;
//         if(authorization == undefined || !req.headers.authorization){
//             res.writeHead(401,{
//                 'content-Type':'text/plain',
//                 'WWW-Authenticate':'Basic realm="family"'
//             });
//             res.end('');
//             return
//         }else{
//             let str = req.headers.authorization;
//             str = str.slice(6,str.length);
//             console.log( "--req.headers.authorization:  " + str);
//
//             let str1 = new Buffer(str,'base64').toString();
//             let arr = str1.split(":");
//
//             console.log(`user: ${arr[0]}  passwd: ${arr[1]}`);
//             req.query['map'] = await checkUser(arr[0], arr[1]);
//         }
//         next()
//     } catch (e) {
//         return sendError(res, e.message);
//     }
// }

const [loginDbOpt, loginTimeout] = [{ db: rdb.account[0] }, rdb.account[1]];
export async function setLoginAsync(key: string | number, values: string) {
    await getRedisClientAsync(async client => {
        await client.setAsync(key, values);
        await client.expireAsync(key, loginTimeout)
    }, loginDbOpt)
}

export async function getLoginAsync(key: string | number): Promise<any> {
    return await getRedisClientAsync(async rds => await rds.getAsync(key), loginDbOpt)
}

export async function delLoginToken(key: string): Promise<void> {
    await getRedisClientAsync(async rds => await rds.delAsync(key), loginDbOpt)
}

export async function checkAccountPermission(level: number, login_id: number, login_username:string, account: any, account_id?: number) {
    switch (level) {
        case 1:
        case 2:
            let sql:string;
            if(typeof account == "string"){
                if (account != login_username) {
                    sql = `select id from account where username = '${account}' and parent_id = ${login_id}`;
                    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
                    if (rows.length == 0) {
                        throw Error(`[${ErrCode.AccountNoPermission}]账号信息错误: ${account}`)
                    }
                } else { 
                    throw Error(`[${ErrCode.AccountNoPermission}]${account}`)
                }
            }else if(account instanceof Array){
                for (let username of account) {
                    if (username != login_username) {
                        sql = `select id from account where username = '${account}' and parent_id = ${login_id}`;
                        let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
                        if (rows.length == 0) {
                            throw Error(`[${ErrCode.AccountNoPermission}]账号信息错误: ${username}`)
                        }
                    } else { 
                        throw Error(`[${ErrCode.AccountNoPermission}]${username}`)
                    }
                }
            }else {
                throw Error(`[${ErrCode.ParameterErr}] `)
            }
            break;
        case 3:
            throw Error(`[${ErrCode.AccountNoPermission}] `);
        default:
            throw Error(`[${ErrCode.AccountInfoErr}] `)
    }
}

export async function Add(parentUserId: number,parentUserLevel: number, username: string, password: string, desc: string): Promise<any> {
    let sql = `select id from account where username = '${username}';`;
    let rows: any = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length != 0) {
        throw Error(`[${ErrCode.AccountExist}]${username}`)
    }
    sql = `insert into account (username, password, level, parent_id, enable, description, last_time, ext) 
        values('${username}', '${password}', ${parentUserLevel + 1}, ${parentUserId}, 1, '${desc}', '${getTime()}', '')`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function Update(username: string, password?: string, desc?: string): Promise<any> {
    let sql: string;
    sql = `select id from account where username = '${username}';`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountNoExist}]${username}`)
    }

    if(password && desc){
        sql = `update account set password = '${password}',description = '${desc}' where username = '${username}';`;
    }else if(password && !desc){
        sql = `update account set password = '${password}' where username = '${username}';`;
    }else if(!password && desc){
        sql = `update account set description = '${desc}' where username = '${username}';`;
    }
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

// 禁用账号，会禁用账号下所有子账号
export async function ChangeStatus(username: string, enable: number): Promise<any> {
    let sql = `select id from account where username = '${username}';`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountNoExist}]${username}`)
    }
    let userId = rows[0].id;
    sql = `update account set enable = ${enable} where id = ${userId} or parent_id = ${userId};`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function ResetPasswd(username: string, password: string): Promise<any> {
    let sql = `update account set password = '${password}' where username = '${username}';`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function ChangePasswd(userId: string, oldPassword: string, newPasswd: string): Promise<any> {
    let sql = `select password from account where id = ${userId} `;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountInfoErr}] 账号错误`)
    }
    if (rows[0].password !== oldPassword) {
        throw Error(`[${ErrCode.AccountInfoErr}] 密码错误`)
    }

    sql = `update account set password = '${newPasswd}' where id = ${userId};`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function Delete(parentUserId: number, parentUserLevel: number, account: string): Promise<any> {
    let userId = await getIdByUsername(account);
    let userIdList: any[] = [];
    let sql = `select id from account where id = ${userId} or parent_id = ${userId}`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let v of rows) {
        userIdList.push(v.id)
    }
    sql = `delete from account where id in (${userIdList.join(",")});`;
    await getConnectionAsync(async conn => await conn.queryAsync(sql));
}

export async function getAccountList(userId: number, pageSize?:number, pageNumber?:number): Promise<any> {
    let accountList: any[] = [];
    let sql = `select * from account where parent_id = ${userId} order by id limit ${pageSize*(pageNumber-1)},${pageSize};`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let user of rows) {
        accountList.push({
            username: user.username,
            desc: user.description,
            last_time: user.last_time,
            enable: user.enable
        });
    }
    return accountList
}

export async function getProxyUserNameList(userId: number, level: number): Promise<any> {
    let proxyUserNameList: string[] = [];
    let sql = `select username from account where id = '${userId}' or parent_id =  '${userId}';`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountInfoErr}] `)
    }
    for (let user of rows) {
        proxyUserNameList.push(user.username);
    }
    return proxyUserNameList
}

export async function getSubUserNameListAndSubUserIdList(parentUserIdList: number[]): Promise<any> {
    let userIdList: string[] = [];
    let userNameList: string[] = [];
    if(parentUserIdList.length !== 0){
        let sql = `select id,username from account where level <> 1 and parent_id in ('${parentUserIdList.join("\',\'")}');`;
        let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
        for (let user of rows) {
            userIdList.push(user.id);
            userNameList.push(user.username);
        }
    }

    return {
        userIdList:     userIdList,
        userNameList:   userNameList
    }
}

export async function getAllSubUserNameList(userId: number): Promise<any> {
    let subUserNameList: string[] = [];
    let account: Account = await getLevelByUserId(userId);
    if(account.getLevel() == 1 || account.getLevel() == 2){
        let { userIdList, userNameList} = await getSubUserNameListAndSubUserIdList([userId]);
        subUserNameList = subUserNameList.concat(userNameList);
        if(account.getLevel() == 1) {
            let { userNameList } = await getSubUserNameListAndSubUserIdList(userIdList);
            subUserNameList = subUserNameList.concat(userNameList);
        }
    }
    subUserNameList.push(account.getUserName());
    return subUserNameList
}

export async function getAllSubUserIdList(userId: number): Promise<any> {
    let subUserIdList: number[] = [];
    let account: Account = await getLevelByUserId(userId);
    if(account.getLevel() == 1 || account.getLevel() == 2){
        let ret:any = await getSubUserNameListAndSubUserIdList([userId]);
        subUserIdList = subUserIdList.concat(ret.userIdList);
        if(account.getLevel() == 1) {
            let { userIdList } = await getSubUserNameListAndSubUserIdList(ret.userIdList);
            subUserIdList = subUserIdList.concat(userIdList);
        }
    }
    subUserIdList.push(userId);
    return subUserIdList
}

async function getLevelByUserId(userId: number): Promise<any> {
    let sql = `select * from account where id = '${userId}';`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountInfoErr}]用户不存在${userId}`)
    }
    return new Account(rows[0]);
}

async function getIdByUsername(account: string): Promise<any> {
    let sql = `select id from account where username = '${account}';`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountNoExist}]${account}`)
    }
    return rows[0].id;
}

export async function getUserIdListByParentId(userId: number): Promise<any> {
    let idList: string[] = [];
    let sql = `select id from account where id = ${userId} or parent_id = ${userId};`;
    log.debug("getUserIdListByParentId sql: " + sql);

    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    for (let v of rows) {
        idList.push(v.id)
    }
    return idList
}

export async function getUserIdListByProxyUser(proxyUser: string, login_id: number): Promise<any> {
    let idList: string[] = [];
    let proxyUserId = await getIdByUsername(proxyUser);
    if (proxyUserId === login_id ) {    // 若是查询当前登录账号的设备，则直接查库
        let sql = `select id from account where id = ${proxyUserId};`;
        log.debug("getUserIdListByProxyUser sql: " + sql);
        let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
        for (let v of rows) {
            idList.push(v.id)
        }
    }else { // 若是查询非当前登录账号的账号的设备，则查该账号和其下账号的设备
        let sql = `select id from account where id = ${proxyUserId} or parent_id = ${proxyUserId};`;
        log.debug("getUserIdListByProxyUser sql: " + sql);
        let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
        for (let v of rows) {
            idList.push(v.id)
        }
    }
    return idList
}

export async function getUsernameByDevId(devId: string): Promise<any> {
    let sql = `select username from account where id = (select user_id from dev where dev_id = '${devId}')`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.ParameterErr}] 设备不存在 ${devId}`)
    }
    return rows[0].username
}

export async function getUserIdByUsername(account: string): Promise<any> {
    let sql = `select id from account where username = '${account}';`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountInfoErr}]账号不存在:${account}`)
    }
    return rows[0].id
}

export async function getAccountByUsername(username: string): Promise<any> {
    let sql = `select username, level, parent_id from account where username = '${username}';`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql));
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountInfoErr}] `)
    }
    return {
        username:   rows[0].username,
        level:      rows[0].level,
        parenId:    rows[0].parent_id
    }
}

export async function getUsernameById(id: number): Promise<any> {
    let sql = `select username from account where id = ${id}`;
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    if (rows.length === 0) {
        throw Error(`[${ErrCode.AccountInfoErr}] `)
    }
    return rows[0].username
}
