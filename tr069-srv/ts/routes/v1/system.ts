import express = require('express');
import {sendOk, getCpuUse, getSysMem} from "../../lib/v1/utils";
import { CommonConfig } from '../../config/common'

export const router: express.Router = express.Router();
var fs = require('fs');
const os = require('os');

router.get('/', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    let data = fs.readFileSync(CommonConfig.SystemInfoPath, 'utf8');
    let system_info = JSON.parse(data.toString());

    system_info.cpu = await getCpuUse();
    
    let memInfo = await getSysMem();
    // let memAvailable:number = Number((memInfo.MemAvailable/1024/1024).toFixed(1));
    let memTotal:number = Number((memInfo.MemTotal/1024/1024).toFixed(1));
    let memFree: number = Number(((memInfo.MemFree + memInfo.Buffers + memInfo.Cached + memInfo.Slab)/1024/1024).toFixed(1));
    let memUse:number = Number((memTotal - memFree).toFixed(1));
    let usePercent: string = parseInt(String(100 * memUse/memTotal)).toString() + "%";

    system_info.mem = `${memUse}/${memTotal} GB(使用率: ${usePercent})`;

    /*    system_info.mem = ((os.totalmem() - os.freemem())/1024/1024/1024).toFixed(1) +  "/" +
            (os.totalmem()/1024/1024/1024).toFixed(1) + " GB (" +
            parseInt(String(100 * (os.totalmem() - os.freemem())/os.totalmem())) + "%)";
    */
    return sendOk(res, {system_info: system_info})
});

router.get('/soft_version', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var data = fs.readFileSync(CommonConfig.SystemInfoPath, 'utf8');
    let system_info = JSON.parse(data.toString());
    return sendOk(res, {soft_version: system_info.soft_version})
});


