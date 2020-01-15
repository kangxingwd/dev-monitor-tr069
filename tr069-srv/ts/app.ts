// import path = require('path')
import logger = require('morgan');
import express = require('express');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');

import fs = require("fs");

// init conf
import commonConfig = require("./config/common");
commonConfig.initCommonConfig(require('../.tr069-config.json'));

//mysql
import mysqlPool = require('./lib/mysqlpool');
import mysqlConfig = require('./config/mysql');
mysqlPool.initPool(mysqlConfig.poolOpt);

//redis
import redisPool = require('./lib/redispool');
import redisConfig = require('./config/redis');
redisPool.init(redisConfig.opt);

// import api
import account = require('./routes/v1/account');
import devices = require("./routes/v1/devices");
import dev_check = require("./routes/v1/dev_check");
import cwmp_event = require("./routes/v1/cwmp_event");
import user_event = require("./routes/v1/user_event");
import files = require("./routes/v1/files");
import tasks = require("./routes/v1/tasks");
import btask = require("./routes/v1/batch_task");
import taskObj = require("./routes/v1/task_obj");
import system = require("./routes/v1/system");
import devMap = require("./routes/v1/dev_map");

const app = express();
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json({ limit:"100000kb"}));  //据需求更改limit大小
app.use(bodyParser.urlencoded({ extended: false, limit:"100000kb"})); //根据需求更改limit大小
app.use(bodyParser.raw({ limit:"100000kb"}))
app.use(bodyParser.text({ limit:"100000kb"}))

import test = require('./routes/test')
import config = require('./routes/config');
app.use('/api/v1/config', config.router);

//  api-server 接口
app.use('/api/v1/test', test.router);
app.use('/api/v1/account', account.router);
app.use('/api/v1/devices', devices.router);
app.use('/api/v1/devCheck', dev_check.router);
app.use('/api/v1/event', user_event.router);
app.use('/api/v1/files', files.router);
app.use('/api/v1/tasks', tasks.router);
app.use('/api/v1/batchTasks', btask.router);
app.use('/api/v1/taskObjects', taskObj.router);
app.use('/api/v1/system', system.router);
app.use('/api/v1/devMap', devMap.router)

// cwmp 交互接口
app.use('/api/v1/cwmp-event', cwmp_event.router);

// catch 404 and forward to error handler
app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.locals.message = '';
    let err = new Error('Not Found');
    next(err)
});

// error handler
app.use(function (err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end()
});

module.exports = app;
require('./daemon/v1/daemon').run();


