// Generated by CoffeeScript 1.12.7

/*
 * Copyright 2013-2017  Zaid Abdulla
 *
 * This file is part of GenieACS.
 *
 * GenieACS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * GenieACS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with GenieACS.  If not, see <http://www.gnu.org/licenses/>.
 *
 * This file incorporates work covered by the following copyright and
 * permission notice:
 *
 * Copyright 2013 Fanoos Telecom
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var DELETE_DEVICE_REGEX, DEVICE_TASKS_REGEX, FAULTS_REGEX, FILES_REGEX, OBJECTS_REGEX, PING_REGEX, PRESETS_REGEX, PROVISIONS_REGEX, QUERY_REGEX, TAGS_REGEX, TASKS_REGEX, VERSION, VIRTUAL_PARAMETERS_REGEX, apiFunctions, cache, common, config, db, listener, mongodb, query, querystring, throwError, url, vm;

url = require('url');

mongodb = require('mongodb');

querystring = require('querystring');

vm = require('vm');

config = require('./config');

common = require('./common');

db = require('./db');

query = require('./query');

apiFunctions = require('./api-functions');

cache = require('./cache');

VERSION = require('../package.json').version;

DEVICE_TASKS_REGEX = /^\/devices\/([a-zA-Z0-9\-\_\%]+)\/tasks\/?$/;

TASKS_REGEX = /^\/tasks\/([a-zA-Z0-9\-\_\%]+)(\/[a-zA-Z_]*)?$/;

TAGS_REGEX = /^\/devices\/([a-zA-Z0-9\-\_\%]+)\/tags\/([a-zA-Z0-9\-\_\%]+)\/?$/;

PRESETS_REGEX = /^\/presets\/([a-zA-Z0-9\-\_\%]+)\/?$/;

OBJECTS_REGEX = /^\/objects\/([a-zA-Z0-9\-\_\%]+)\/?$/;

FILES_REGEX = /^\/files\/([a-zA-Z0-9\%\!\*\'\(\)\;\:\@\&\=\+\$\,\?\#\[\]\-\_\.\~]+)\/?$/;

PING_REGEX = /^\/ping\/([a-zA-Z0-9\-\_\.\:]+)\/?$/;

QUERY_REGEX = /^\/([a-zA-Z0-9_]+)\/?$/;

DELETE_DEVICE_REGEX = /^\/devices\/([a-zA-Z0-9\-\_\%]+)\/?$/;

PROVISIONS_REGEX = /^\/provisions\/([a-zA-Z0-9\-\_\%]+)\/?$/;

VIRTUAL_PARAMETERS_REGEX = /^\/virtual_parameters\/([a-zA-Z0-9\-\_\%]+)\/?$/;

FAULTS_REGEX = /^\/faults\/([a-zA-Z0-9\-\_\%\:]+)\/?$/;

throwError = function(err, httpResponse) {
  if (httpResponse) {
    httpResponse.writeHead(500, {
      'Connection': 'close'
    });
    httpResponse.end(err.name + ": " + err.message);
  }
  throw err;
};

listener = function(request, response) {
  var bytes, chunks;
  chunks = [];
  bytes = 0;
  response.setHeader('GenieACS-Version', VERSION);
  request.addListener('data', function(chunk) {
    chunks.push(chunk);
    return bytes += chunk.length;
  });
  request.getBody = function() {
    var body, offset;
    body = new Buffer(bytes);
    offset = 0;
    chunks.forEach(function(chunk) {
      chunk.copy(body, offset, 0, chunk.length);
      return offset += chunk.length;
    });
    return body;
  };
  return request.addListener('end', function() {
    var action, body, channel, collection, collectionName, cur, deviceId, err, faultId, filename, gs, host, i, j, k, len, limit, metadata, object, objectName, p, preset, presetName, projection, provisionName, q, r, ref, ref1, s, sort, tag, task, taskId, up, urlParts, v, virtualParameterName;
    body = request.getBody();

    urlParts = url.parse(request.url, true);
    if (PRESETS_REGEX.test(urlParts.pathname)) {
      presetName = querystring.unescape(PRESETS_REGEX.exec(urlParts.pathname)[1]);
      if (request.method === 'PUT') {
        preset = JSON.parse(body);
        preset._id = presetName;
        return db.presetsCollection.save(preset, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else if (request.method === 'DELETE') {
        return db.presetsCollection.remove({
          '_id': presetName
        }, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else {
        response.writeHead(405, {
          'Allow': 'PUT, DELETE'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (OBJECTS_REGEX.test(urlParts.pathname)) {
      objectName = querystring.unescape(OBJECTS_REGEX.exec(urlParts.pathname)[1]);
      if (request.method === 'PUT') {
        object = JSON.parse(body);
        object._id = objectName;
        return db.objectsCollection.save(object, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else if (request.method === 'DELETE') {
        return db.objectsCollection.remove({
          '_id': objectName
        }, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else {
        response.writeHead(405, {
          'Allow': 'PUT, DELETE'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (PROVISIONS_REGEX.test(urlParts.pathname)) {
      provisionName = querystring.unescape(PROVISIONS_REGEX.exec(urlParts.pathname)[1]);
      if (request.method === 'PUT') {
        object = {
          _id: provisionName,
          script: body.toString()
        };
        try {
          new vm.Script("\"use strict\";(function(){\n" + object.script + "\n})();");
        } catch (error) {
          err = error;
          response.writeHead(400);
          response.end(err.name + ": " + err.message);
          return;
        }
        return db.provisionsCollection.save(object, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else if (request.method === 'DELETE') {
        return db.provisionsCollection.remove({
          '_id': provisionName
        }, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else {
        response.writeHead(405, {
          'Allow': 'PUT, DELETE'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (VIRTUAL_PARAMETERS_REGEX.test(urlParts.pathname)) {
      virtualParameterName = querystring.unescape(VIRTUAL_PARAMETERS_REGEX.exec(urlParts.pathname)[1]);
      if (request.method === 'PUT') {
        object = {
          _id: virtualParameterName,
          script: body.toString()
        };
        try {
          new vm.Script("\"use strict\";(function(){\n" + object.script + "\n})();");
        } catch (error) {
          err = error;
          response.writeHead(400);
          response.end(err.name + ": " + err.message);
          return;
        }
        return db.virtualParametersCollection.save(object, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else if (request.method === 'DELETE') {
        return db.virtualParametersCollection.remove({
          '_id': virtualParameterName
        }, function(err) {
          if (err) {
            return throwError(err, response);
          }
          return cache.del('presets_hash', function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else {
        response.writeHead(405, {
          'Allow': 'PUT, DELETE'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (TAGS_REGEX.test(urlParts.pathname)) {
      r = TAGS_REGEX.exec(urlParts.pathname);
      deviceId = querystring.unescape(r[1]);
      tag = querystring.unescape(r[2]);
      if (request.method === 'POST') {
        return db.devicesCollection.update({
          '_id': deviceId
        }, {
          '$addToSet': {
            '_tags': tag
          }
        }, {
          safe: true
        }, function(err) {
          if (err) {
            return throwError(err, response);
          }
          response.writeHead(200);
          return response.end();
        });
      } else if (request.method === 'DELETE') {
        return db.devicesCollection.update({
          '_id': deviceId
        }, {
          '$pull': {
            '_tags': tag
          }
        }, {
          safe: true
        }, function(err) {
          if (err) {
            return throwError(err, response);
          }
          response.writeHead(200);
          return response.end();
        });
      } else {
        response.writeHead(405, {
          'Allow': 'POST, DELETE'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (FAULTS_REGEX.test(urlParts.pathname)) {
      if (request.method === 'DELETE') {
        faultId = querystring.unescape(FAULTS_REGEX.exec(urlParts.pathname)[1]);
        deviceId = faultId.split(':', 1)[0];
        channel = faultId.slice(deviceId.length + 1);
        return db.faultsCollection.remove({
          _id: faultId
        }, function(err) {
          if (err) {
            return throwError(err, response);
          }
          if (channel.startsWith('task_')) {
            return db.tasksCollection.remove({
              _id: new mongodb.ObjectID(channel.slice(5))
            }, function(err) {
              if (err) {
                return throwError(err, response);
              }
              return cache.del(deviceId + "_tasks_faults_operations", function(err) {
                if (err) {
                  return throwError(err, response);
                }
                response.writeHead(200);
                return response.end();
              });
            });
          }
          return cache.del(deviceId + "_tasks_faults_operations", function(err) {
            if (err) {
              return throwError(err, response);
            }
            response.writeHead(200);
            return response.end();
          });
        });
      } else {
        response.writeHead(405, {
          'Allow': 'DELETE'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (DEVICE_TASKS_REGEX.test(urlParts.pathname)) {
      if (request.method === 'POST') {
        deviceId = querystring.unescape(DEVICE_TASKS_REGEX.exec(urlParts.pathname)[1]);
        if (body.length) {
          task = JSON.parse(body);
          task.device = deviceId;
          return apiFunctions.insertTasks(task, function(err) {
            if (err) {
              return throwError(err, response);
            }
            return cache.del(deviceId + "_tasks_faults_operations", function(err) {
              if (err) {
                return throwError(err, response);
              }
              if (urlParts.query.connection_request != null) {
                return apiFunctions.connectionRequest(deviceId, function(err) {
                  var taskTimeout;
                  if (err) {
                    response.writeHead(202, err.message, {
                      'Content-Type': 'application/json',
					  'task_id':task._id
                    });
                    return response.end(JSON.stringify(task));
                  } else {
                    taskTimeout = (urlParts.query.timeout != null) && parseInt(urlParts.query.timeout) || config.get('DEVICE_ONLINE_THRESHOLD', deviceId);
                    return apiFunctions.watchTask(deviceId, task._id, taskTimeout, function(err, status) {
                      if (err) {
                        return throwError(err, response);
                      }
                      if (status === 'timeout') {
                        response.writeHead(202, 'Task queued but not processed', {
                          'Content-Type': 'application/json',
						'task_id':task._id
                        });
                        return response.end(JSON.stringify(task));
                      } else if (status === 'fault') {
                        return db.tasksCollection.findOne({
                          _id: task._id
                        }, function(err, task) {
                          if (err) {
                            return throwError(err, response);
                          }
                          response.writeHead(202, 'Task faulted', {
                            'Content-Type': 'application/json',
						'task_id':task._id
                          });
                          return response.end(JSON.stringify(task));
                        });
                      } else {
                        response.writeHead(200, {
                          'Content-Type': 'application/json',
						'task_id':task._id
                        });
                        return response.end(JSON.stringify(task));
                      }
                    });
                  }
                });
              } else {
                response.writeHead(202, {
					'Content-Type': 'application/json',
					'task_id':task._id
                });
                return response.end(JSON.stringify(task));
              }
            });
          });
        } else if (urlParts.query.connection_request != null) {
          return apiFunctions.connectionRequest(deviceId, function(err) {
            if (err) {
              response.writeHead(504);
              response.end(err.name + ": " + err.message);
              return;
            }
            response.writeHead(200);
            return response.end();
          });
        } else {
          response.writeHead(400);
          return response.end();
        }
      } else {
        response.writeHead(405, {
          'Allow': 'POST'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (TASKS_REGEX.test(urlParts.pathname)) {
      r = TASKS_REGEX.exec(urlParts.pathname);
      taskId = new mongodb.ObjectID(querystring.unescape(r[1]));
      action = r[2];
      if ((action == null) || action === '/') {
        if (request.method === 'DELETE') {
          return db.tasksCollection.findOne({
            '_id': taskId
          }, {
            'device': 1
          }, function(err, task) {
            if (err) {
              return throwError(err, response);
            }
            if (task == null) {
              response.writeHead(404);
              response.end("Task not found");
              return;
            }
            deviceId = task.device;
            return db.tasksCollection.remove({
              '_id': taskId
            }, function(err) {
              if (err) {
                return throwError(err, response);
              }
              return db.faultsCollection.remove({
                _id: deviceId + ":task_" + (String(taskId))
              }, function(err) {
                if (err) {
                  return throwError(err, response);
                }
                return cache.del(deviceId + "_tasks_faults_operations", function(err) {
                  if (err) {
                    return throwError(err, response);
                  }
                  response.writeHead(200);
                  return response.end();
                });
              });
            });
          });
        } else {
          response.writeHead(405, {
            'Allow': 'PUT DELETE'
          });
          return response.end('405 Method Not Allowed');
        }
      } else if (action === '/retry') {
        if (request.method === 'POST') {
          return db.tasksCollection.findOne({
            '_id': taskId
          }, {
            'device': 1
          }, function(err, task) {
            if (err) {
              return throwError(err, response);
            }
			if (task == null) {
              response.writeHead(404);
              response.end("Task not found");
              return;
            }
            deviceId = task.device;
            return db.faultsCollection.remove({
              _id: deviceId + ":task_" + (String(taskId))
            }, function(err) {
              if (err) {
                return throwError(err, response);
              }
              return cache.del(deviceId + "_tasks_faults_operations", function(err) {
                if (err) {
                  return throwError(err, response);
                }
                response.writeHead(200);
                return response.end();
              });
            });
          });
        } else {
          response.writeHead(405, {
            'Allow': 'POST'
          });
          return response.end('405 Method Not Allowed');
        }
      } else {
        response.writeHead(404);
        return response.end();
      }
    } else if (FILES_REGEX.test(urlParts.pathname)) {
      filename = querystring.unescape(FILES_REGEX.exec(urlParts.pathname)[1]);
      if (request.method === 'PUT') {
        metadata = {
          fileType: request.headers.filetype,
          oui: request.headers.oui,
          productClass: request.headers.productclass,
          version: request.headers.version
        };
        gs = new mongodb.GridStore(db.mongoDb, filename, filename, 'w', {
          metadata: metadata
        });
        return gs.open(function(err, gs) {
          return gs.write(body, function(err, res) {
            if (err) {
              return throwError(err, response);
            }
            return gs.close(function(err) {
              if (err) {
                return throwError(err, response);
              }
              response.writeHead(201);
              return response.end();
            });
          });
        });
      } else if (request.method === 'DELETE') {
        return mongodb.GridStore.unlink(db.mongoDb, filename, function(err) {
          response.writeHead(200);
          return response.end();
        });
      } else {
        response.writeHead(405, {
          'Allow': 'PUT, DELETE'
        });
        return response.end('405 Method Not Allowed');
      }
    } else if (PING_REGEX.test(urlParts.pathname)) {
      host = querystring.unescape(PING_REGEX.exec(urlParts.pathname)[1]);
      return require('child_process').exec("ping -w 1 -i 0.2 -c 3 " + host, function(err, stdout, stderr) {
        if (err) {
          response.writeHead(404, {
            'Cache-Control': 'no-cache'
          });
          response.end(err.name + ": " + err.message);
          return;
        }
        response.writeHead(200, {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache'
        });
        return response.end(stdout);
      });
    } else if (DELETE_DEVICE_REGEX.test(urlParts.pathname)) {
      if (request.method !== 'DELETE') {
        response.writeHead(405, {
          'Allow': 'DELETE'
        });
        response.end('405 Method Not Allowed');
        return;
      }
      deviceId = querystring.unescape(DELETE_DEVICE_REGEX.exec(urlParts.pathname)[1]);
      return apiFunctions.deleteDevice(deviceId, function(err) {
        if (err) {
          return throwError(err, response);
        }
        response.writeHead(200);
        return response.end();
      });
    } else if (QUERY_REGEX.test(urlParts.pathname)) {
      collectionName = QUERY_REGEX.exec(urlParts.pathname)[1];
      i = collectionName.indexOf('_');
      while (i >= 0) {
        ++i;
        up = i < collectionName.length ? collectionName[i].toUpperCase() : '';
        collectionName = collectionName.slice(0, i - 1) + up + collectionName.slice(i + 1);
        i = collectionName.indexOf('_', i);
      }
      if ((ref = request.method) !== 'GET' && ref !== 'HEAD') {
        response.writeHead(405, {
          'Allow': 'GET, HEAD'
        });
        response.end('405 Method Not Allowed');
        return;
      }
      collection = db[collectionName + "Collection"];
      if (collection == null) {
        response.writeHead(404);
        response.end('404 Not Found');
        return;
      }
      if (urlParts.query.query != null) {
        try {
          q = JSON.parse(urlParts.query.query);
        } catch (error) {
          err = error;
          response.writeHead(400);
          response.end(err.name + ": " + err.message);
          return;
        }
      } else {
        q = {};
      }
      switch (collectionName) {
        case 'devices':
          q = query.expand(q);
          break;
        case 'tasks':
          q = query.sanitizeQueryTypes(q, {
            _id: (function(v) {
              return new mongodb.ObjectID(v);
            }),
            timestamp: (function(v) {
              return new Date(v);
            }),
            retries: Number
          });
          break;
        case 'faults':
          q = query.sanitizeQueryTypes(q, {
            timestamp: (function(v) {
              return new Date(v);
            }),
            retries: Number
          });
      }
      if (urlParts.query.projection != null) {
        projection = {};
        ref1 = urlParts.query.projection.split(',');
        for (j = 0, len = ref1.length; j < len; j++) {
          p = ref1[j];
          p = p.trim();
          projection[p] = 1;
        }
      }
      cur = collection.find(q, projection, {
        batchSize: 50
      });
      if (urlParts.query.sort != null) {
        s = JSON.parse(urlParts.query.sort);
        sort = {};
        for (k in s) {
          v = s[k];
          if (k[k.lastIndexOf('.') + 1] !== '_' && collectionName === 'devices') {
            sort[k + "._value"] = v;
          } else {
            sort[k] = v;
          }
        }
        cur.sort(sort);
      }
      if (urlParts.query.skip != null) {
        cur.skip(parseInt(urlParts.query.skip));
      }
      if (urlParts.query.limit != null) {
        cur.limit(limit = parseInt(urlParts.query.limit));
      }
      return cur.count(false, function(err, total) {
        response.writeHead(200, {
          'Content-Type': 'application/json',
          'total': total
        });
        if (request.method === 'HEAD') {
          response.end();
          return;
        }
        response.write("[\n");
        i = 0;
        return cur.each(function(err, item) {
          if (err) {
            throwError(err);
            return false;
          }
          if (item != null) {
            if (i++) {
              response.write(",\n");
            }
            response.write(JSON.stringify(item));
          }
          if ((item == null) || ((limit != null) && i >= limit)) {
            return response.end("\n]");
          }
        });
      });
    } else {
      response.writeHead(404);
      return response.end('404 Not Found');
    }
  });
};

exports.listener = listener;
