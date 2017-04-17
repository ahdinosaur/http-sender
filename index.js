const typeofIs = require('typeof-is')
const jsonStringify = require('fast-safe-stringify')
const HttpError = require('http-errors')
const pull = require('pull-stream/pull')
const { isSource: isSourcePullStream } = require('is-pull-stream')
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
    if (res.headersSent) return

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

  // similar to https://github.com/pillarjs/finalhandler
  // based on https://github.com/blockai/http-errors-express
  function defaultErrorResponder (req, res, err) {
    var httpError = err
    if (typeofIs.undefined(httpError.statusCode)) {
      httpError = HttpError()
    }

    if (!res.headersSent) {
      res.statusCode = httpError.statusCode
      res.statusMessage = httpError.message

      if (!typeofIs.undefined(httpError.headers)) {
        for (const headerName in httpError.headers) {
          const headerValue =  httpError.headers[headerName]
          res.setHeader(headerName, headerValue)
        }
      }

      res.setHeader('Cache-Control', null)
    }

    if (err.expose) {
      // expected errors
      var errorResponse
      for (const key in httpError) {
        if (!httpErrorKeys.includes(key)) {
          errorResponse[key] = httpError[key]
        }
      }
      valueResponder({ error: errorResponse })
    } else {
      // unexpected errors
      if (!res.finished) {
        res.write(jsonStringify({
          error: {
            name: httpError.name,
          }
        }))
      }
      // logger (pino-http) is listening to error event
       if (logger) res.emit('error', err)

      // HACK this is the only way for pino-colada to notice
      if (logger) logger.logger.fatal(err)
      res.end()
    }
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

const httpErrorKeys = [
  'expose',
  'headers',
  'status',
  'statusCode'
]
