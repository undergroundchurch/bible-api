const commandsMeta = require('./CommandHandlers')

const PREFIX = '.'

function ProcessingInstruction(msg) {
  const command = msg.split(' ')[0].slice(PREFIX.length)
  const args = msg.split(' ').slice(1).join(' ')
  return commandsMeta[command](args)
}

module.exports.ProcessingInstruction = ProcessingInstruction
