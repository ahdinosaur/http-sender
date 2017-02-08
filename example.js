const http = require('http')
const respond = require('./')()

http.createServer((req, res) => {
  const send = respond(req, res)
  console.log(req.url)
  switch (req.url) {
    case '/': return send(null, 'home')
    case '/json': return send(null, { a: 1 })
    case '/error': return send(new Error('error!'))
    default: return send()
  }
}).listen(5000)
