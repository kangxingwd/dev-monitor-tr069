import express = require('express');
import {Account} from "../../models/v1/account";
import {sendError, sendOk, ErrCode, md5sum} from "../../lib/v1/utils";
import accounts = require("../../dao/v1/account");
import { log_dev as log } from '../../lib/log'
import {devExist} from "../../dao/v1/dev";

export const router: express.Router = express.Router();

router.get('/:sn', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/devCheck");
    let sn = req.params.sn;
    try {
        if(sn.length !== 32) {
            throw Error(`[${ErrCode.DevCheckFailed}] 设备标识码格式不正确！`);
        }
        let check: string = sn.slice(28);
        let devInfoStr: string = sn.slice(0,28);
        let mac: string = devInfoStr.slice(-12);
        
        if( check == md5sum(devInfoStr).slice(-4)) {
            if(await devExist(sn)) {
                return sendOk(res, {sn: sn})
            }else {
                throw Error(`[${ErrCode.DevCheckFailed}] 设备信息未注册或已失效`);
            }
        }else {
            throw Error(`[${ErrCode.DevCheckFailed}] `);
        }
    } catch (e) {
        log.error(`[devCheck]  devCheck err! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/sn/getSn', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/devCheck/sn/getSn");
    const { vendorid, model, mac } = req.query;
    let sn: string;
    try {
        if(vendorid.length !== 4 ||  mac.length !== 12) {
            return sendError(res, `[${ErrCode.ParameterErr}] `)
        }

        let devInfoStr: string = vendorid + md5sum(model).slice(-12) + mac;
        sn = devInfoStr + md5sum(devInfoStr).slice(-4);

        return sendOk(res, {sn: sn})
    } catch (e) {
        log.error(`[devCheck]  devCheck err! ${e.message}`);
        return sendError(res, e.message)
    }
});


