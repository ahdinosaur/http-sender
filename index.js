const finalHandler = require('finalhandler')
const HttpError = require('http-errors')
const isNodeStream = require('is-stream')
const isPull = require('is-pull-stream')
const codeToNodeStream = require('from2-encoding')
const jsonStringify = require('fast-safe-stringify')
const toNodeStream = require('pull-stream-to-stream')
const pump = require('pump')
const serverSink = require('server-sink')
const typeofIs = require('typeof-is')

module.exports = Sender

function Sender (options = {}) {
  const {
    value: valueResponder = defaultValueResponder,
    error: errorResponder = defaultErrorResponder,
    notFound: notFoundResponder = defaultNotFoundResponder,
    log = defaultLog
  } = options

  return function sender (req, res) {
    return function send (err, value) {
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
    } else if (Buffer.isBuffer(value)) {
      stream = codeToNodeStream(value, 'binary')
    } else if (typeofIs.string(value)) {
      stream = codeToNodeStream(value, 'utf8')
    } else if (typeofIs.object(value)) {
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'application/json')
      }
      stream = codeToNodeStream(jsonStringify(value), 'utf8')
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
  info: console.log,
  warn: console.warn
}
