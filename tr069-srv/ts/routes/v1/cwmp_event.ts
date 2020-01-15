import express = require('express');
import {getTime, getUnixTime, sendOk} from "../../lib/v1/utils";
import CWMP = require("../../lib/v1/cwmp/cwmp");
import {devTimeHandle} from "../../lib/v1/dev_time_handle";
import device = require("../../lib/v1/device");
import task = require("../../lib/v1/task");
import {devMapUpdate, eventAddrChange, eventWifiProbe} from "../../lib/v1/device";
import daoDev = require("../../dao/v1/dev");
import {probeDeWeight} from "../../daemon/v1/wifi_probe";
import { log_dev as log } from '../../lib/log'
import {CommonConfig} from "../../config/common";

export const router: express.Router = express.Router();

router.post('/', async function (req: express.Request, res: express.Response, next: express.NextFunction) {

    let time = getTime();
    //console.log(`cwmp hello world! ${time}`);

    const req_body = (req as any).body;
    //console.log(req_body);

    res.send(`cwmp hello world! ${time}`)

});

// 新设备上报
router.post('/devNew', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        //console.log("[cwmp request] -------------  devNew------------");
        const req_body = (req as any).body;
        let devParams: any = CWMP.parseCwmpParams(req_body.data.parameterList);
        //console.log(devParams);

        await device.newDevHandle(req_body, devParams);
        sendOk(res, {msg: `cwmp devNew succcess!`})
    }catch (e) {
	    log.error(`devNew error ${e.message}`);
        sendOk(res, {msg: `cwmp devNew hello world!`})
    }
});

//  inform上报
// req_body = {
//     event: 'newDev',
//     data: {
//         id: MC119-MC119-78D38DC38456,
//         deviceId: {
//              Manufacturer: 'PTPT52',
//              OUI: 'AC7628',
//              ProductClass: 'PTPT52-Router',
//              SerialNumber: 'FFFFFF123456'
//         },
//         parameterList: [ [ 'InternetGatewayDevice.DeviceInfo.SpecVersion',
//                          '1.0',
//                           'xsd:string' ],
//                         [ 'InternetGatewayDevice.DeviceInfo.ProvisioningCode',
//                           '',
//                           'xsd:string' ],
//                         [ 'InternetGatewayDevice.DeviceInfo.Manufacturer',
//                           'PTPT52',
//                           'xsd:string' ],
//                         [ 'InternetGatewayDevice.DeviceInfo.ManufacturerOUI',
//                           'AC7628',
//                           'xsd:string' ],
//                         [ 'InternetGatewayDevice.DeviceInfo.ProductClass',
//                           'PTPT52-Router',
//                          'xsd:string' ],
//                         [ 'InternetGatewayDevice.DeviceInfo.SerialNumber',
//                           '00990bd4c56370561472583697416528',
//                           'xsd:string' ],],
//         requestHeaders:  { host: '192.168.2.121',
//                           'x-forwarded-for': '192.168.2.127',
//                           connection: 'close',
//                           'content-length': '3266',
//                           'user-agent': 'easycwmp',
//                           'content-type': 'text/xml; charset="utf-8"'}
//     }
// };
router.post('/inform', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        log.debug("[cwmp request] -------------  inform------------");
        const req_body = (req as any).body;
        let devId: string = req_body.data.deviceId.SerialNumber;
        let devParams: any = CWMP.parseCwmpParams(req_body.data.parameterList);
        let username: string = await daoDev.getUsernameByDevid(devId);
        //console.log(devParams);
        //console.log(req_body.data.deviceId);

        if(devId == undefined){
            throw new Error('no SerialNumber');
        }
        //console.log("----[" + devId + "  " + devParams.Ip + " " + req_body.data.requestHeaders['x-forwarded-for'] + "]----");
        log.debug("----[" + devId + "  " + devParams.Ip + " " + req_body.data.requestHeaders['x-forwarded-for'] + "]----");
        if(!device.getDevInfoFromMap(devId)){
            await device.newDevHandle(req_body, devParams);
        }

        // 时间状态处理
        devTimeHandle(req_body.data.deviceId.SerialNumber, devParams.OnlineTime);
        
        // 事件通知
        if(CommonConfig.EventNotifyEnable){
            // 设备ip地址变更处理
            if(devParams.Ip && devParams.Ip != device.getDevInfoFromMap(devId).ip){
                await eventAddrChange(username, devId, devParams.Ip, device.getDevInfoFromMap(devId).ip);
            }

            // wifi 探针处理
            if(CommonConfig.WifiProbeEnable && devParams.ProbeMac && devParams.ProbeMac != ""){
                let newDevMacs: string[] = await probeDeWeight(devId, devParams.ProbeMac);  //去重
                eventWifiProbe(username, devId, newDevMacs);
            }
        }

        devMapUpdate({
            dev_id:     devId,
            cwmp_id:    req_body.data.id,
            ip: (devParams.Ip)?devParams.Ip:"",
            soft_version:   (devParams.SoftwareVersion)?devParams.SoftwareVersion:"",
            connect_ip:     (req_body.data.requestHeaders['x-forwarded-for'])?req_body.data.requestHeaders['x-forwarded-for']:""
        });
        sendOk(res, {msg: `cwmp inform succcess!`})
    }catch (e) {
        log.error(`inform error: ${e.message}`);
        sendOk(res, {msg: `cwmp inform! ${e.message}`})
    }
});

// rpcResponse上报
// req_body = {
//     event: RebootResponse,
//     data: {
//         deviceId: MC119-MC119-78D38DC38456,
//         channel: task_5c8a3aa9c06a180b690256d7
//     }
// };
// req_body = {
//     event: DownloadResponse,
//     data: {
//          status： 1;
//         deviceId: MC119-MC119-78D38DC38456,
//         channel: task_5c8a3aa9c06a180b690256d7
//     }
// };
router.post('/rpcResponse', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        log.debug("[cwmp request] -------------  rpcResponse------------");
        const req_body = (req as any).body;
        //console.log("-- req_body-- :");
        log.info(`rpcResponse: ${JSON.stringify(req_body)}`);

        switch (req_body.event) {
            case "RebootResponse":              // 重启成功回复处理
               await task.rebootResponseHandle(req_body);
               break;
            case "FactoryResetResponse":        // 恢复出厂成功回复处理
                await task.factoryResetResponseHandle(req_body);
                break;
            case "DownloadResponse":            // 下载任务获取回复处理
                await task.downloadResponseHandle(req_body);
                break;
            default:
                break;
        }
        sendOk(res, {msg: `cwmp doloadResponse success!`})
    }catch (e) {
	    log.error(`rpcResponse error ${e.message}`);
        sendOk(res, {msg: `cwmp doloadResponse failed!`})
    }
});

// transferComplete上报
// req_body = {
//             event: 'transferComplete',
//             data: {
//                 channel:  task_5c8a3aa9c06a180b690256d7,
//                 status:  1,
//                 deviceId: MC119-MC119-78D38DC38456,
//                 fault:    { code: 'cwmp.9001',
//                              message: 'Request denied',
//                              detail: { faultCode: '9001', faultString: 'Request denied' },
//                              timestamp: 1552564275641 },
//                 retries: 0
//             },
//
//         };
router.post('/transferComplete', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        log.debug("[cwmp request] -------------  transferComplete------------");
        const req_body = (req as any).body;
        log.info(`transferComplete: ${JSON.stringify(req_body)}`);

        // 任务结果处理（升级）
        await task.transferCompleteHandle(req_body);

        sendOk(res, {msg: `cwmp transferComplete success!`})
    }catch (e) {
	    log.error(`transferComplete error ${e.message}`);
        sendOk(res, {msg: `cwmp transferComplete hello world!`})
    }
});

// wifi探针上报（目前这个接口无效，WiFi探针在inform中上报）
router.post('/wifiProbe', async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        log.debug("[cwmp request] -------------  wifiProbe------------");
        const req_body = (req as any).body;
        log.debug("-- req_body-- :");
        log.debug(req_body);
    }catch (e) {
	    log.error(`wifiProbe error ${e.message}`);
        sendOk(res, {msg: `cwmp wifiProbe hello world!`})
    }
});


