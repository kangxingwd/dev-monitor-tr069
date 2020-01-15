import express = require('express');
import { CommonConfig } from '../../config/common'
import { Account } from '../../models/v1/account'
import daoAccount = require("../../dao/v1/account");
import daoDev = require("../../dao/v1/dev");
import dev = require("../../lib/v1/device");
import { log_dev as log } from '../../lib/log'
import {sendError, sendOk, ErrCode, md5sum} from "../../lib/v1/utils";
import {checkAccountPermission} from "../../dao/v1/account";
export const router: express.Router = express.Router();

router.post('/login', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("post /api/v1/account/login");
    const { username, password } = (req as any).body;
    log.debug(`-------------------${username} login!`);
    try {
        if(!username || !password){
            throw Error(`[${ErrCode.ParameterErr}]缺少参数`)
        }

        // 检查账号，密码
        let account_info: Account = await daoAccount.checkUser(username, password);
        let account_id: number = account_info.getAccountId();
        let account_name: string = account_info.getUserName();
        let account_level: number = account_info.getLevel();
        let token: string = account_info.getToken();

        await daoAccount.setLoginAsync(token, JSON.stringify(account_info));
        res.cookie("token", token, { maxAge: CommonConfig.TokenExpiresTime, httpOnly: false });
        res.cookie("account_id", account_id, { maxAge: CommonConfig.TokenExpiresTime, httpOnly: false });
        res.cookie("account_name", account_name, { maxAge: CommonConfig.TokenExpiresTime, httpOnly: false });
        res.cookie("account_level", account_level, { maxAge: CommonConfig.TokenExpiresTime, httpOnly: false });
        log.debug(`[login] ${username} login success!`);
        return sendOk(res, account_info)
    } catch (e) {
        log.error(`[login] ${username} login failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.post('/logout', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("post /api/account/logout");
    const { id } = req.query['map'];
    try {
        await daoAccount.delLoginToken(id);
        log.debug(`[logout] ${id} `);
        return sendOk(res, {})
    } catch (e) {
        log.error(`[logout] failed!  ${e.message}`);
        return sendError(res, e.message)
    }
});

// 账号操作： 添加，更新，删除
router.post('/', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    // TODO  get userId  from token
    const { id, username, level } = req.query['map'];
    const { option, data } = (req as any).body;
    try {
        if(!option || !data){
            throw Error(`[${ErrCode.ParameterErr}]缺少参数`)
        }

        switch (option) {
            case "add":
                if(!data.hasOwnProperty("username") || !data.hasOwnProperty("password")) {
                    throw Error(`[${ErrCode.ParameterErr}] 缺少参数`)
                }
                await daoAccount.Add(id, level, data.username, data.password, data.desc?data.desc:"");
                break;
            case "update":
                if(!data.hasOwnProperty("username") || (!data.hasOwnProperty("password") && !data.hasOwnProperty("desc"))) {
                    throw Error(`[${ErrCode.ParameterErr}] 缺少参数`)
                }
                await daoAccount.checkAccountPermission(level, id, username, data.username);
                await daoAccount.Update(data.username, data.password, data.desc);
                break;
            case "change_status":
                if(!data.hasOwnProperty("username") || !data.hasOwnProperty("enable") || (data.enable !== 0 && data.enable !== 1)) {
                    throw Error(`[${ErrCode.ParameterErr}] 缺少参数`)
                }
                await daoAccount.checkAccountPermission(level, id, username, data.username);
                await daoAccount.ChangeStatus(data.username, data.enable);
                break;
            case "reset_passwd":
                if(!data.hasOwnProperty("username")) {
                    throw Error(`[${ErrCode.ParameterErr}] 缺少参数`)
                }
                await daoAccount.checkAccountPermission(level, id, username, data.username);
                await daoAccount.ResetPasswd(data.username, CommonConfig.AccountDefaultPasswd);
                break;
            case "change_passwd":
                if(!data.hasOwnProperty("old_passwd") || !data.hasOwnProperty("new_passwd")){
                    throw Error(`[${ErrCode.ParameterErr}] 缺少参数`)
                }
                await daoAccount.ChangePasswd(id, data.old_passwd, data.new_passwd);
                break;
            case "delete":
                if(!data.hasOwnProperty("accounts") || !(data.accounts instanceof Array) || data.accounts.length == 0) {
                    throw Error(`[${ErrCode.ParameterErr}] 参数错误或账号列表为空`)
                }
                await daoAccount.checkAccountPermission(level, id, username, data.accounts);
                await dev.changeDevUser(username, [], data.accounts);
                await daoAccount.Delete(id, level, data.accounts);
                break;
            default:
                throw Error(`[${ErrCode.ParameterErr}]option类型无效`)
        }
        return sendOk(res, {})
    }catch (e) {
        log.error(`[account] get /api/account failed! ${e.message}`);
        console.log(e.message);
        return sendError(res, e.message)
    }
});

// 获取账号列表
router.get('/', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/account");
    const { id } = req.query['map'];
    try {
        // 参数检查
        if( (req.query.pageSize && ((isNaN(req.query.pageSize) || Number(req.query.pageSize) < 1 || !Number.isInteger(Number(req.query.pageSize)) ))) ||
            (req.query.pageNumber && ((isNaN(req.query.pageNumber) || Number(req.query.pageNumber) < 1 || !Number.isInteger(Number(req.query.pageNumber))) ))){
            throw new Error(`[${ErrCode.ParameterErr}]  pageSize或pageNumber 不正确`);
        }
        let pageSize: number = (req.query.pageSize)?Math.floor(Number(req.query.pageSize)):CommonConfig.NbiDefaultPageSize;
        let pageNumber: number = (req.query.pageNumber)?Math.floor(Number(req.query.pageNumber)):CommonConfig.NbiDefaultPageNum;

        let accountList: any[];
        accountList = await daoAccount.getAccountList(id, pageSize, pageNumber);
        log.debug(`[account] login_id(${id}) get /api/account success!`);
        return sendOk(res, {accounts: accountList})
    }catch (e) {
        log.error(`[account] get /api/account failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

// 获取代理商
router.get('/proxy_user', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/account/proxy_user");
    const { id, username, level } = req.query['map'];
    try {
        let proxyUserNameList: string[] = await daoAccount.getProxyUserNameList(id, level);
        log.debug(`[get_proxy_user] login_account(${username}) get_proxy_user success! ${proxyUserNameList}`);
        return sendOk(res, {proxy_user: proxyUserNameList} )
    } catch (e) {
        log.debug(`[get_proxy_user] login_account(${username}) get_proxy_user failed! ${e.message}`);
        return sendError(res,"获取代理商失败!")
    }
});

// 设备分配
router.post('/dev_alloc', daoAccount.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("post /api/v1/account/dev_alloc");
    const {  id, level, username } = req.query['map'];
    let { account, devices } = (req as any).body;
    try {
        if(!account || !devices || !(devices instanceof Array) || devices.length == 0){
            throw Error(`[${ErrCode.ParameterErr}] 参数错误或设备列表为空`)
        }
        // 检查账号权限
        await daoAccount.checkAccountPermission(level, id, username, account);
        // 检查设备操作权限
        await dev.checkDevPermission(level, id, devices);
        // 分配设备
        await dev.changeDevUser(account, devices);
        log.debug(`[dev_alloc] login_account(${username}) dev_alloc account(${account}) success! ${JSON.stringify(devices)}`);
        return sendOk(res, {} )
    } catch (e) {
        log.error(`[dev_alloc] login_account(${username}) dev_alloc account(${account}) failed! ${e.message} ${JSON.stringify(devices)}`);
        return sendError(res, e.message)
    }
});


