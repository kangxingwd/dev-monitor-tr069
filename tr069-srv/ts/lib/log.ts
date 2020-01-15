let winston = require("winston");
require('winston-daily-rotate-file');
import dateformat = require("dateformat");
import { CommonConfig } from '../config/common'
const { combine, timestamp, label, printf } = winston.format;

let log_debug = new winston.transports.DailyRotateFile({
    level: 'debug',
    filename: `debug-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    dirname: CommonConfig.LogDir,
    maxSize: '20m',
    maxFiles: '14d',
    colorize: true
});

let log_info = new winston.transports.DailyRotateFile({
    level: 'info',
    filename: `info-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    dirname: CommonConfig.LogDir,
    maxSize: '20m',
    maxFiles: '14d',
    colorize: true
});

let log_error = new winston.transports.DailyRotateFile({
    level: 'error',
    filename: `error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    dirname: CommonConfig.LogDir,
    maxSize: '20m',
    maxFiles: '14d',
    colorize: true
});

const myFormat = printf((info: any) => {
    return `${dateformat(info.timestamp, "yyyy-mm-dd HH:MM:ss")} [${info.label}] ${info.level}: ${info.message}`;
});

let log_dev_default = winston.createLogger({
    format: combine(
        label({ label: 'tr069' }),
        timestamp(),
        myFormat
    ),
    transports: [log_error,log_info]
    //transports: [log_debug, log_info, log_error]
});

export let log_dev = log_dev_default;

