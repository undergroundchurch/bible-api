const swaggerAutogen = require('swagger-autogen')()

const doc = {
  info: {
    title: 'Bible API',
    version: '1.0.0',
    description:
      'API for processing Bible commands using ProcessingInstruction',
  },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http'],
  definitions: {
    ProcessRequest: {
      message: 'bv Mateus 2:2 ACF;Mateus 2:2 BYZ',
    },
    ProcessResponse: {
      ACF: [
        {
          name: 'matthew 2:2.',
          value: 'verse...',
        },
      ],
      BYZ: [
        {
          name: 'matthew 2:2.',
          value: 'verse...',
        },
      ],
    },
  },
}

const outputFile = './swagger-output.json'
const endpointsFiles = ['./server.js']

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger file generated')
})
