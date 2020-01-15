import express = require('express');
import {getTime} from "../lib/v1/utils";
import {getUnixTime, sendOk} from "../lib/v1/utils";
import fs = require("fs");
import { log_dev as log } from '../lib/log'

import commonConfig = require("../config/common");
import { devIpQueue } from '../daemon/v1/dev_addr';
export const router: express.Router = express.Router();

router.get('/makeip', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    
	try {
		for (let i = 1; i < 255; i++){
			devIpQueue.push({devId:"00"+i, ip:"113.87.161."+i})
		}
        return sendOk(res, {})
    }catch (e) {
        log.error(`get config error: ${e.message}`)
    }
});