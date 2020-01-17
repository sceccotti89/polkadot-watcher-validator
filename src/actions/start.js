const express = require('express')
const winston = require('winston')

const { Config } = require('../config')
const { Subscriber } = require('../subscriber')
const { Prometheus } = require('../prometheus')


module.exports = {
  do: async (cmd) => {
    const cfg = Config.parse(cmd.config)

    const server = new express()
    server.get('/healthcheck', async(req, res) => {
      res.status(200).send('OK!')
    })
    server.listen(cfg.port)

    const prometheus = new Prometheus()
    prometheus.injectMetricsRoute(server)
    prometheus.startCollection()

    const logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
      transports: [
        new winston.transports.Console()
      ]
    })

    const subscriberCfg = {
      endpoint: cfg.endpoint,
      subscribe: cfg.subscribe,
      prometheus,
      logger
    }
    const subscriber = new Subscriber(subscriberCfg)
    await subscriber.start()
  }
}
