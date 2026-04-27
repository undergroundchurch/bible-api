const { Worker, Queue, QueueEvents } = require('bullmq')
const { segments: handleSegments } = require('./CommandHandlers')

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
}

const segmentsQueue = new Queue('segments', { connection })
const segmentsQueueEvents = new QueueEvents('segments', { connection })

const worker = new Worker(
  'segments',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`)
    const segments = job.data.segments
    const result = handleSegments(segments)
    return result
  },
  { connection }
)

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result)
})

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error:`, err.message)
})

const addSegmentsJob = async (segments, options = {}) => {
  return segmentsQueue.add('process-segments', { segments }, options)
}

module.exports = { addSegmentsJob, segmentsQueue, segmentsQueueEvents }
