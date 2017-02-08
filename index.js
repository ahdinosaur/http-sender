const finalHandler = require('finalhandler')
const HttpError = require('http-errors')
const isNodeStream = require('is-stream')
const isPull = require('is-pull-stream')
const stringToNodeStream = require('from2-string')
const jsonStringify = require('fast-safe-stringify')
const toNodeStream = require('pull-stream-to-stream')
const pump = require('pump')
const serverSink = require('server-sink')

module.exports = respond

function respond (options = {}) {
  const {
    value: valueResponder = defaultValueResponder,
    error: errorResponder = defaultErrorResponder,
    notFound: notFoundResponder = defaultNotFoundResponder,
    log = defaultLog
  } = options

  return function httpFinalResponder (req, res) {
    return (err, value) => {
      if (err) errorResponder(req, res, err)
      else if (value) valueResponder(req, res, value)
      else notFoundResponder(req, res)
    }
  }

  function defaultValueResponder (req, res, value) {
    var stream = null
    if (isNodeStream.readable(value)) {
      stream = value
    } else if (isPull.isSource(value)) {
      stream = toNodeStream.source(value)
    } else if (isObject(value)) {
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'application/json')
      }
      stream = stringToNodeStream(jsonStringify(value))
    } else if (isString(value)) {
      stream = stringToNodeStream(value)
    }
    var sink = serverSink(req, res, msg => log.info(msg))
    if (stream) {
      pump(stream, sink, err => {
        if (err) errorResponder(req, res, err)
      })
    } else {
      res.end()
    }
  }

  function defaultErrorResponder (req, res, err) {
    finalHandler(req, res, { onerror: onError })(err)
  }

  function defaultNotFoundResponder (req, res) {
    const err = HttpError.NotFound()
    defaultErrorResponder(req, res, err)
  }

  function onError (err, req, res) {
    if (res.statusCode === 500) {
      log.warn(err)
    }
  }
}

const defaultLog = {
  info: console.log.bind(console),
  warn: console.error.bind(console)
}

function isObject (o) { return typeof o === 'object' }
function isString (o) { return typeof o === 'string' }
