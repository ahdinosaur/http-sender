const test = require('tape')

const httpRespond = require('../')

test('http-respond', function (t) {
  t.ok(httpRespond, 'module is require-able')
  t.end()
})
