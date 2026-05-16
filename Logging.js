const winston = require('winston')
const path = require('path')
const DailyRotateFile = require('winston-daily-rotate-file')

const { combine, timestamp, printf, json, colorize } = winston.format

const myCustomLevels = {
  levels: {
    error: 1,
    info: 2,
    debug: 4,
  },
  colors: {
    error: 'red',
    info: 'blue',
    debug: 'yellow',
  },
}

winston.addColors(myCustomLevels.colors)

const logger = winston.createLogger({
  levels: myCustomLevels.levels,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(
      (info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: './logs/combined.log',
      level: 'info',
    }),
    new winston.transports.File({
      filename: './logs/debug.log',
      level: 'debug',
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      level: 'info',
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        printf((info) => {
          return `${info.timestamp} ${info.level}: ${info.message}`
        })
      ),
    })
  )
}

const dynamicLoggers = new Map()

function getDynamicLogger(name, rotate = false) {
  const key = `${name}:${rotate}`
  if (dynamicLoggers.has(key)) return dynamicLoggers.get(key)

  const fileTransport = rotate
    ? new DailyRotateFile({
        filename: path.join('./logs', `${name}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD-HH',
        frequency: '5h',
        maxFiles: '30d',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
      })
    : new winston.transports.File({
        filename: path.join('./logs', `${name}.log`),
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
      })

  const dedicated = winston.createLogger({
    levels: myCustomLevels.levels,
    transports: [fileTransport],
  })

  dynamicLoggers.set(key, dedicated)
  return dedicated
}

const NATIVE_METHODS = new Set([
  'error',
  'info',
  'debug',
  'warn',
  'log',
  'add',
  'remove',
  'clear',
  'close',
  'on',
  'once',
  'emit',
  'write',
  'end',
  'pipe',
])

const proxyLogger = new Proxy(logger, {
  get(target, prop) {
    if (
      typeof prop !== 'string' ||
      NATIVE_METHODS.has(prop) ||
      prop in target
    ) {
      return typeof target[prop] === 'function'
        ? target[prop].bind(target)
        : target[prop]
    }

    return (data = {}, { rotate = false } = {}) => {
      const dedicated = getDynamicLogger(prop, rotate)
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      dedicated.info(message)
    }
  },
})

module.exports = proxyLogger
