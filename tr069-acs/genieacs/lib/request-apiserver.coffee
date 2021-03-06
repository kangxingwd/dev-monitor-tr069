# Generated by CoffeeScript 1.12.7
HttpUtils = undefined
getHeader = undefined
param = undefined
request = undefined
resultFunction = undefined

resultFunction = (callback, error, response, body) ->
  if !error and response.statusCode == 200
    callback
      success: true
      msg: body
    console.log 'request is success '
  else
    console.log 'request is error', error
    callback
      success: false
      msg: error
  return

getHeader = ->
  { 'Content-type': 'application/json; charset=UTF-8' }

'use strict'
HttpUtils = exports
request = require('request')
HttpUtils.eventUrl =
  cwmp_event: 'http://127.0.0.1:7577/api/v1/cwmp-event'
  devNew: 'http://127.0.0.1:7577/api/v1/cwmp-event/devNew'
  inform: 'http://127.0.0.1:7577/api/v1/cwmp-event/inform'
  rpcResponse: 'http://127.0.0.1:7577/api/v1/cwmp-event/rpcResponse'
  transferComplete: 'http://127.0.0.1:7577/api/v1/cwmp-event/transferComplete'
  doloadResponse: 'http://127.0.0.1:7577/api/v1/cwmp-event/doloadResponse'
  wifiProbe: 'http://127.0.0.1:7577/api/v1/cwmp-event/wifiProbe'

HttpUtils.postForm = (url, form, callback) ->
  header = undefined
  option = undefined
  header = getHeader()
  option =
    json: true
    header: header
    body: form
  request.post url, option, (error, response, body) ->
    resultFunction callback, error, response, body
    return
  return

HttpUtils.postFormJson = (url, form, callback) ->
  header = undefined
  option = undefined
  header = getHeader()
  option =
    url: url
    method: 'POST'
    json: true
    headers: header
    body: form
  request option, (error, response, body) ->
    resultFunction callback, error, response, body
    return
  return

param =
  user: 'username'
  pass: 'password'
HttpUtils.postForm HttpUtils.eventUrl.cwmp_event, param, (result) ->
  console.log result
  return
HttpUtils.postFormJson HttpUtils.eventUrl.cwmp_event, param, (result) ->
  console.log result
  return
