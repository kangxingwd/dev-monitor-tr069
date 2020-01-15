import express = require('express');
import {getTime} from "../lib/v1/utils";
import {getUnixTime, sendOk} from "../lib/v1/utils";
import fs = require("fs");
import { log_dev as log } from '../lib/log'

import commonConfig = require("../config/common");

export const router: express.Router = express.Router();

router.get('/', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    let time = getTime();
    let time1 = getUnixTime();
    log.info(`---------------------------get config------- access  ip : ${req.ip}`);
    try {
        return sendOk(res, {time: time, unixTime: time1, config: commonConfig.CommonConfig})
    }catch (e) {
        log.error(`get config error: ${e.message}`)
        return sendOk(res, {time: time, unixTime: time1, error: e.message})
    }
});

router.post('/', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    let time = getTime();
    let time1 = getUnixTime();

    try {
        const req_body = (req as any).body;
        log.info(`---------------------------config change------- access  ip : ${req.ip}`);
        log.info(JSON.stringify(req_body));
        if(!req_body.cmd){
            throw Error(`缺少参数`)
        }

        switch (req_body.cmd) {
            case "reload":
                let config: any = JSON.parse(fs.readFileSync('./.tr069-config.json').toString());
                commonConfig.initCommonConfig(config);
                break;
            default:
                break;
        }

        log.info(`${JSON.stringify(commonConfig.CommonConfig)}`);
        return sendOk(res, {time: time, unixTime: time1})
    }catch (e) {
        return sendOk(res, {time: time, unixTime: time1, err: e.message})
    }
});
