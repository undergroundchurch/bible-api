const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const { ProcessingInstruction } = require('./index');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load generated swagger file
const swaggerFile = './swagger-output.json';
if (fs.existsSync(swaggerFile)) {
  const swaggerDocs = JSON.parse(fs.readFileSync(swaggerFile, 'utf-8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
} else {
  console.warn('Swagger file not found. Run "node swagger.js" first.');
}

app.post('/process', (req, res) => {
  /* 
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Process a Bible command',
      schema: { $ref: '#/definitions/ProcessRequest' }
    }
    #swagger.responses[200] = {
      description: 'Success',
      schema: { $ref: '#/definitions/ProcessResponse' }
    }
  */
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = ProcessingInstruction(message);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
