# http-sender

simple http final responder

```shell
npm install --save http-sender
```

## example

```js
const http = require('http')
const sender = require('http-sender')()

http.createServer((req, res) => {
  const send = sender(req, res)
  console.log(req.url)
  switch (req.url) {
    case '/': return send(null, 'home')
    case '/json': return send(null, { a: 1 })
    case '/error': return send(new Error('error!'))
    default: return send()
  }
}).listen(5000)
```

## usage

### `Sender = require('http-sender')`

### `sender = Sender(options)`

`options`:

- `value`: function with shape `(req, res, value)`
- `error`: function with shape `(req, res, error)`
- `notFound`: function with shape `(req, res)`
- `logger`: a [`pino-http`](https://github.com/pinojs/pino-http)-compatible http logger instance

### `send = sender(req, res)`

### `send(err, value)`

## complementary modules

- [`ahdinosaur/http-sender`](https://github.com/ahdinosaur/http-sender)
- [`ahdinosaur/http-routes`](https://github.com/ahdinosaur/http-routes)

## related modules

- [`finalhandler`](https://github.com/pillarjs/finalhandler)
- [`creationix/stack`](https://github.com/creationix/stack)
- [`yoshuawuyts/nanostack`](https://github.com/yoshuawuyts/nanostack)

## license

The Apache License

Copyright &copy; 2017 Michael Williams

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
