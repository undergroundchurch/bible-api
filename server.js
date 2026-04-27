const fs = require('fs')
const cors = require('cors')
const express = require('express')
const logger = require('./Logging')
const swaggerUi = require('swagger-ui-express')
const { ProcessingInstruction, ProcessingSegments } = require('./index')
const { createBullBoard } = require('@bull-board/api')
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const { segmentsQueue } = require('./workers')

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Load generated swagger file
const swaggerFile = './swagger-output.json'
if (fs.existsSync(swaggerFile)) {
  const swaggerDocs = JSON.parse(fs.readFileSync(swaggerFile, 'utf-8'))
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
} else {
  console.warn('Swagger file not found. Run "node swagger.js" first.')
}

// BullMQ Dashboard
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [new BullMQAdapter(segmentsQueue)],
  serverAdapter: serverAdapter,
})

app.use('/admin/queues', serverAdapter.getRouter())

app.post('/process', async (req, res) => {
  /* 
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Process a Bible command or segments',
      schema: { 
        type: 'object',
        properties: {
          segments: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                book: { type: 'number' },
                chapter: { type: 'number' },
                from: { type: 'number' },
                to: { type: 'number' },
                publisher: { type: 'string' }
              }
            }
          },
          message: { type: 'string' }
        }
      }
    }
    #swagger.responses[200] = {
      description: 'Success',
      schema: { $ref: '#/definitions/ProcessResponse' }
    }
  */
  const { segments } = req.body
  logger.info(`Processing request: ${JSON.stringify(req.body, null, 2)}`)
  try {
    if (segments && Array.isArray(segments)) {
      const result = await ProcessingSegments(segments)
      if (result.error) {
        return res.status(400).json(result)
      }
      return res.json(result)
    }

    return res.status(400).json({ error: 'Segments (array) are required' })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ error: 'Internal Server Error', details: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`)
  console.log(
    `BullMQ dashboard available at http://localhost:${port}/admin/queues`
  )
})
