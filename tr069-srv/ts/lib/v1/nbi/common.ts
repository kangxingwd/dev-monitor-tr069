import request = require("request");
import { log_dev as log } from '../../log'

export interface RespStruct {
    error?: any;
    total?: number;
    statusCode?: number;
    body?: any;
}

function requestCommon(methodFun: Function, opts: any) {
    return new Promise ((resolve, reject) => {
        methodFun(opts,function(error: any, response: request.Response, body: any){
            let ret: any = {};
            if(error) {
                resolve(ret);
            }
            if(response){
                if (response.headers ) {
                    ret.total = response.headers.total;
                }else {
                    ret.total = undefined;
                }
                ret.statusCode = response.statusCode;
                ret.statusCode = response.statusCode;
            }
            ret.body = body;
            log.info("");
            log.debug(`[request]:  ${JSON.stringify(opts)}`);
            log.debug(`[ret]:  ${JSON.stringify(ret)}`);
            resolve(ret);
        });
    });
}

export async function getAsync(opts: any): Promise<any> {
    return await requestCommon(request.get, opts)
}

export async function postAsync(opts: any): Promise<any> {
    return await requestCommon(request.post, opts)
}

export async function delAsync(opts: any): Promise<any> {
    return await requestCommon(request.delete, opts)
}

export async function putAsync(opts: any): Promise<any> {
    return await requestCommon(request.put, opts)
}

