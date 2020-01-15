import {NbiApi, NbiConfig} from "../../../config/nbi";
import {RespStruct, putAsync, getAsync, delAsync} from "./common";

export async function uploadFile(filename: string, fileType: string, oui: string, productClass: string, version: string, content: any): Promise<number>{
    let url: string = `${NbiConfig.nbiAddress}/files/${filename}`;
    let headers: any = {
        filetype: fileType,
        oui: oui,
        productclass: productClass,
        version: version
    };
    let body: any = content;
    let ret: RespStruct = await putAsync({url: url, headers: headers, body: body})
    if(ret.statusCode == 200 || ret.statusCode == 201)
        return 1
    return -1
}

export async function deleteFile(aliasFilename: string): Promise<number>{
    let url: string = `${NbiConfig.nbiAddress}/files/${aliasFilename}`;
    let ret: RespStruct = await delAsync(url) as any;
    if(200 === ret.statusCode){
        return 200;
    }else{
        throw Error('[50000] 删除文件失败');
    }

}

export async function getFile(aliasFilename: string): Promise<any>{
    let url: string = `${NbiConfig.nbiAddress}/files?query={"filename":"${aliasFilename}"}`;
    let ret: RespStruct = await getAsync(url) as any;
    if(200 === ret.statusCode)
        return ret.body;
    else
        return null
}