import http from 'node:http'
import { Readable } from 'node:stream'

import worker from '../dist/server/index.js'

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'

function toRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const url = new URL(req.url || '/', `${protocol}://${req.headers.host || `${host}:${port}`}`)
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(key, entry)
      }
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }

  const body =
    req.method && !['GET', 'HEAD'].includes(req.method.toUpperCase())
      ? Readable.toWeb(req)
      : undefined

  return new Request(url, {
    method: req.method,
    headers,
    body,
    duplex: body ? 'half' : undefined,
  })
}

const server = http.createServer(async (req, res) => {
  try {
    const request = toRequest(req)
    const response = await worker.fetch(request, {})

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    if (!response.body) {
      res.end()
      return
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    res.end(buffer)
  } catch (error) {
    res.statusCode = 500
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    res.end(error instanceof Error ? error.stack || error.message : 'Server error')
  }
})

server.listen(port, host, () => {
  console.log(`GameSeal preview running at http://${host}:${port}`)
})
