import daoFile = require("../../dao/v1/file")
import nbiFile = require("../../lib/v1/nbi/file")
import {ErrCode} from "./utils";

export async function uploadFile(fileName: string, username: string, fileType: string, oui: string, productClass: string,
                                     version: string, content: any): Promise<any> {
    let aliasFilename: string = `${fileName}-${username}`
    let fileContent: any
    if (/;base64,/.test(content))
        fileContent = new Buffer(content.split(';base64,')[1], 'base64')
    else
        fileContent = new Buffer(content)

    if(await daoFile.isExistFile(aliasFilename)){
        throw Error(`[${ErrCode.FileOPError}] 已存在同名文件`)
    }
    let ret: any = await nbiFile.uploadFile(aliasFilename, fileType, oui, productClass, version, fileContent)
    if(ret < 0 ){
        throw Error(`[${ErrCode.FileOPError}] 上传文件失败`)
    }
    await daoFile.addFile(aliasFilename, fileName, username, oui, fileType, productClass, version)
    return aliasFilename
}

export async function deleteFile(fileName: string, username: string): Promise<any> {
    let aliasFilename: string = `${fileName}-${username}`
    if(!await daoFile.isExistFile(aliasFilename)){
        throw Error(`[${ErrCode.FileOPError}] 文件不存在`)
    }
    await daoFile.removeFile(aliasFilename)
    await nbiFile.deleteFile(aliasFilename)
    return aliasFilename
}

export async function getFiles(username: string, pageSize: number, pageNumber: number, fileType: string, oui: string, productClass: string, version: string): Promise<any> {
    let recordsTotal: number = await daoFile.countFiles(username, fileType, oui, productClass, version)
    // if (pageNumber !== 1 && ((pageNumber - 1)*pageSize -1) > recordsTotal)
    //     throw Error(`[${ErrCode.FileOPError}] 页码超出当前数据范围`)
    let rows: any[] = await daoFile.getFiles(username, (pageNumber-1)*pageSize, pageSize, fileType, oui, productClass, version)
    let files: any[] = []
    for(let row of rows){
        files.push({fileName: row.filename, fileType: row.filetype, oui: row.oui, productClass: row.product_class, version: row.soft_version})
    }
    return {totalPages: Math.floor((recordsTotal+pageSize-1)/pageSize), curPage: pageNumber, files: files}
}

export async function getFileDetail(username: string, fileName: string): Promise<any> {
    let aliasFilename: string = `${fileName}-${username}`
    let ret: any = await nbiFile.getFile(aliasFilename)
    if (!ret)
        throw Error(`[${ErrCode.FileOPError}]`)
    let infos: any[] = JSON.parse(ret)
    if (infos.length === 0)
        throw Error(`[${ErrCode.FileOPError}] 文件不存在`)
    let fileInfo: any = infos[0]
    let fileDetail: any = {fileName: fileName, fileSize: fileInfo.length, fileType: fileInfo.metadata.fileType, oui: fileInfo.metadata.oui,
        productClass: fileInfo.metadata.productClass, version: fileInfo.metadata.version, md5: fileInfo.md5}
    return fileDetail
}
