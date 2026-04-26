const commandsMeta = require('./CommandHandlers')

function ProcessingInstruction(msg) {
  const command = msg.split(' ')[0]
  const args = msg.split(' ').slice(1).join(' ')
  return commandsMeta[command](args)
}

function ProcessingSegments(segments) {
  return commandsMeta['segments'](segments)
}

module.exports.ProcessingInstruction = ProcessingInstruction
module.exports.ProcessingSegments = ProcessingSegments
