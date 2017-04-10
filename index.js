const typeofIs = require('typeof-is')
const jsonStringify = require('fast-safe-stringify')
const HttpError = require('http-errors')
const finalHandler = require('finalhandler')
const pull = require('pull-stream/pull')
const { source: isSourcePullStream } = require('is-pull-stream')
const { sink: toSinkPullStream } = require('stream-to-pull-stream')
const pump = require('pump')

module.exports = Sender

function Sender (options = {}) {
  const {
    value: valueResponder = defaultValueResponder,
    error: errorResponder = defaultErrorResponder,
    notFound: notFoundResponder = defaultNotFoundResponder,
    logger
  } = options

  return function sender (req, res) {
    if (logger) logger(req, res)
    return function send (err, value) {
      if (err) errorResponder(req, res, err)
      else if (value) valueResponder(req, res, value)
      else notFoundResponder(req, res)
    }
  }

  function defaultValueResponder (req, res, value) {
    const errorHandler = ifError(err => errorResponder(req, res, err))

    if (isReadableNodeStream(value)) {
      pump(value, res, errorHandler)
    } else if (isSourcePullStream(value)) {
      pull(value, toSinkPullStream(res, errorHandler))
    } else if (Buffer.isBuffer(value)) {
      res.end(value)
    } else if (typeofIs.string(value)) {
      res.end(value)
    } else if (typeofIs.object(value)) {
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'application/json')
      }
      res.end(jsonStringify(value))
    } else {
      res.end()
    }
  }

  function defaultErrorResponder (req, res, err) {
    finalHandler(req, res)(err)
  }

  function defaultNotFoundResponder (req, res) {
    const err = HttpError.NotFound()
    defaultErrorResponder(req, res, err)
  }
}

function ifError (cb) {
  return (err) => err && cb(err)
}

function isReadableNodeStream (value) {
  return value && !typeofIs.undefined(value.pipe)
}
