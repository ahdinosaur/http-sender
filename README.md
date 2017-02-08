# http-respond

simple http final responder

```shell
npm install --save http-sender
```

inspired by [`finalhandler`](https://github.com/pillarjs/finalhandler) and [`yoshuawuyts/merry`](https://github.com/yoshuawuyts/merry)

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

### `send = sender(req, res)`

### `send(err, value)`

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
