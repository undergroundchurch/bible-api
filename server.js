const fs = require('fs')
const cors = require('cors')
const express = require('express')
const logger = require('./Logging')
const swaggerUi = require('swagger-ui-express')
const { ProcessingInstruction, ProcessingSegments } = require('./index')

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

app.post('/process', (req, res) => {
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
  const { segments, message } = req.body
  logger.info(`Processing request: ${JSON.stringify(req.body)}`)
  try {
    if (segments && Array.isArray(segments)) {
      const result = ProcessingSegments(segments)
      logger.info(`Processing segments result: ${JSON.stringify(result)}`)
      return res.json(result)
    }

    if (message) {
      const result = ProcessingInstruction(message)
      logger.info(`Processing message result: ${JSON.stringify(result)}`)
      return res.json(result)
    }

    return res
      .status(400)
      .json({ error: 'Segments (array) or message (string) are required' })
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
})
