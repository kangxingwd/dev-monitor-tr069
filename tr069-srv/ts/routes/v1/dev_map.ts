import express = require('express');
import {log_dev as log} from "../../lib/log";
import {ErrCode, sendError, sendOk} from "../../lib/v1/utils";
import accounts = require("../../dao/v1/account");
import libMap = require("../../lib/v1/dev_map");


export const router: express.Router = express.Router();

router.get('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const { id } = req.query['map'];
    try{
        let retChunk: any = await libMap.getMaps(id)
        return sendOk(res, {address: retChunk})
    }catch (e) {
        log.error(e.message);
        return sendError(res, '')
    }
})