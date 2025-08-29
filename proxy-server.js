// CORS代理服务器 - 解决n8n webhook的CORS问题
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const cors = require('cors')

const app = express()
const PORT = 3001

// 启用CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true
}))

// 解析JSON
app.use(express.json())

// 创建到n8n的代理
const n8nProxy = createProxyMiddleware({
  target: 'https://ysq123.app.n8n.cloud',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('代理请求:', req.method, req.url)
    console.log('请求体:', req.body)
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('代理响应:', proxyRes.statusCode)
    // 设置CORS头
    proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With'
  }
})

// 代理所有到/webhook的请求
app.use('/webhook', n8nProxy)

// 处理OPTIONS请求
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`CORS代理服务器运行在 http://localhost:${PORT}`)
  console.log(`将请求转发到: https://ysq123.app.n8n.cloud`)
})