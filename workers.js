const { Worker, Queue, QueueEvents } = require('bullmq')
const { segments: handleSegments } = require('./CommandHandlers')
const ComputeStatisticsWorker = require('./ComputeStatistics')
const proxyLogger = require('./Logging')

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

const segmentsQueue = new Queue('segments', { connection })
const segmentsQueueEvents = new QueueEvents('segments', { connection })

const computeStatisticsQueue = new Queue('compute-statistics', { connection })
const computeStatisticsQueueEvents = new QueueEvents('compute-statistics', {
  connection,
})

const worker = new Worker(
  'segments',
  async (job) => {
    proxyLogger.segments(`Processing job ${job.id}: ${job.name}`)
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

const computeStatisticsWorker = new Worker(
  'compute-statistics',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`)
    const result = ComputeStatisticsWorker.perform(job.data)
    return result
  },
  { connection }
)

computeStatisticsWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result)
})

computeStatisticsWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error:`, err.message)
})

const addSegmentsJob = async (segments, options = {}) => {
  return segmentsQueue.add('process-segments', { segments }, options)
}

const addComputeStatisticsJob = async (data, options = {}) => {
  return computeStatisticsQueue.add('compute-statistics', data, options)
}

module.exports = {
  addSegmentsJob,
  segmentsQueue,
  segmentsQueueEvents,
  addComputeStatisticsJob,
  computeStatisticsQueue,
  computeStatisticsQueueEvents,
}
