import express = require('express');
import {log_dev as log} from "../../lib/log";
import {ErrCode, sendError, sendOk} from "../../lib/v1/utils";
import accounts = require("../../dao/v1/account");
import file = require("../../lib/v1/files")

const fileTypeArr: string[] = ["1 Firmware Upgrade Image", "2 Web Content", "3 Vendor Configuration File", "4 Tone File", "5 Ringer File"]

export const router: express.Router = express.Router();

router.put('/:filename', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("put /api/v1/files/:filename")
    const { username } = req.query['map']
    try {
        const { filename } = req.params
        // const { fileType, oui, productClass, version } = req.headers
        let filetype = req.headers.filetype as string
        let oui = req.headers.oui as string
        let productclass = req.headers.productclass as string
        let version = req.headers.version as string
        let content = req.body
        if (!(filetype && oui && productclass && version && content)){
            throw Error(`[${ErrCode.ParameterErr}] 请求参数错误或格式不正确`)
        }
        if (fileTypeArr.indexOf(filetype) < 0)
            throw Error(`[${ErrCode.ParameterErr}] 文件类型错误`)
        await file.uploadFile(filename, username, filetype, oui, productclass, version, content)
        return sendOk(res, {})
    } catch (e) {
        log.error(`[file list]  get file list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.put('/upload/:filename', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("put /api/v1/files/upload")
    const { username } = req.query['map']
    try {
        const { fileType, oui, productClass, version, content } = req.body
        if (!(fileType && oui && productClass && version && content)){
            throw Error(`[${ErrCode.ParameterErr}] 请求参数错误或格式不正确`)
        }
        if (fileTypeArr.indexOf(fileType) < 0)
            throw Error(`[${ErrCode.ParameterErr}] 文件类型错误`)
        const { filename } = req.params

        await file.uploadFile(filename, username, fileType, oui, productClass, version, content)
        return sendOk(res, {})
    } catch (e) {
        log.error(`[file list]  get file list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.delete('/:filename', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("put /api/v1/files")
    const { username } = req.query['map']
    try {
        const { filename } = req.params
        await file.deleteFile(filename, username)
        return sendOk(res, {})
    } catch (e) {
        log.error(`[file list]  get file list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/:fileName', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/files/:fileName");
    const { username } = req.query['map'];
    try {
        const { fileName } = req.params;
        let ret: any = await file.getFileDetail(username, fileName)

        return sendOk(res, {fileDetail: ret})
    } catch (e) {
        log.error(`[file list]  get file list failed! ${e.message}`);
        return sendError(res, e.message)
    }
});

router.get('/', accounts.loginCheck, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    log.debug("get /api/v1/files");
    const { username } = req.query['map'];
    try {
        // 参数检查
        if( (req.query.pageSize && ((isNaN(req.query.pageSize) || Number(req.query.pageSize) < 1 || !Number.isInteger(Number(req.query.pageSize)) ))) ||
            (req.query.pageNumber && ((isNaN(req.query.pageNumber) || Number(req.query.pageNumber) < 1 || !Number.isInteger(Number(req.query.pageNumber))) ))){
            throw new Error(`[${ErrCode.ParameterErr}]  pageSize或pageNumber 不正确`);
        }
        let pageSize: number = (req.query.pageSize)?Math.floor(Number(req.query.pageSize)):10;
        let pageNumber: number = (req.query.pageNumber)?Math.floor(Number(req.query.pageNumber)):1;

        let query: any = req.query.query? req.query.query : "{}"
        const {fileType, oui, productClass, version} = JSON.parse(query)
        let ret: any = await file.getFiles(username, pageSize, pageNumber, fileType, oui, productClass, version)
        return sendOk(res, ret)
    } catch (e) {
        log.error(`[file list]  get file list failed! ${e.message}`);
        console.log(`[file list]  get file list failed! ${e.message}`)
        return sendError(res, e.message)
    }
});


