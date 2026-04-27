const commandsMeta = require('./CommandHandlers')
const { addSegmentsJob, segmentsQueueEvents } = require('./workers')

function ProcessingInstruction(msg) {
  const command = msg.split(' ')[0]
  const args = msg.split(' ').slice(1).join(' ')
  return commandsMeta[command](args)
}

async function ProcessingSegments(segments) {
  const job = await addSegmentsJob(segments)
  const result = await job.waitUntilFinished(segmentsQueueEvents)
  // result.jobId = job.id
  return result
  // return await ProcessingSegmentsAsync(segments)
}

async function ProcessingSegmentsAsync(segments) {
  return result
}

module.exports.ProcessingInstruction = ProcessingInstruction
module.exports.ProcessingSegments = ProcessingSegments
