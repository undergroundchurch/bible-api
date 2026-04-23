const viterp = require('./BibleCommandInterpreter')
const citerp = require('./CommentaryCommandInterpreter')

const bci = new viterp.BibleCommandInterpreter()
const cci = new citerp.CommentaryCommandInterpreter()

const versions = require('./BibleVersionEnum')
const cmtversions = require('./CommentaryVersionEnum')

const constants = require('./BibleConstants')

const handleBv = (args) => {
  let versesParsed = bci.parseRef(args)
  let osis = cci.getOsis(args)
  let embed = buildVerseRichEmbed(versesParsed)
  return embed
}

const handleOsis = (args) => {
  return cci.getOsis(args)
}

const handleBd = (args) => {
  let detail = bci.parseDetail(args).getEditionDescrition()
  let embed = formatText(detail)
  return embed
}

const handleBc = (args) => {
  let versesParsed = cci.parseRef(args)
  let embed = buildCommentaryRichEmbed(versesParsed)
  return embed
}

const handleCd = (args) => {
  let detail = cci.parseDetail(args).getEditionDescrition()
  let embed = formatText(detail)
  return embed
}

const handleBs = (args) => {
  let versesParses = bci.parseWords(args)
  let embed = buildSearchRichEmbed(versesParses)
  return embed
}

const handleHen = (args) => {
  return bch.config.HELP.en
}

const handleA = (args) => {
  return getAllVersionsAndCmt()
}

const handleRefs = (args) => {
  return getAllRefPtBrFormat()
}

function getAllRefPtBrFormat() {
  let aux = '**Refs Bíblicas // Biblical Refs (PT-BR FORMAT)**\n\n'

  Object.keys(constants.refs.ptbr).forEach((key) => {
    aux += `${String(key)} `
  })

  return aux
}

function getAllVersionsAndCmt() {
  let aux = '**Versões Bíblicas // Biblical Verses**\n\n'

  Object.keys(versions.BibleVersionEnum).forEach((key) => {
    aux += `${String(key)}\n`
  })

  aux += '**\nComentários Bíblicos // Biblical Commentaries**\n\n'

  Object.keys(cmtversions.CommentaryVersionEnum).forEach((key) => {
    aux += `${String(key)}\n`
  })

  return aux
}

function buildSearchRichEmbed(versesParsed) {
  let aux = []
  if (versesParsed) {
    for (let index = 0; index < versesParsed.length; index++) {
      const element = versesParsed[index]
      aux.push({
        name: element.getVerseRef(),
        value: element.getScripture(),
      })
    }
    return aux
  } else {
    return formatText(
      'Something went wrong, maybe you have to change the parameters.'
    )
  }
}

function buildCommentaryRichEmbed(commentariesParsed) {
  let aux = []
  if (commentariesParsed) {
    for (let index = 0; index < commentariesParsed.length; index++) {
      const element = commentariesParsed[index]
      aux.push({
        name: element.getVerseRef(),
        value: element.getData(),
      })
    }
    return aux
  } else {
    return formatText(
      'Something went wrong, maybe you have to change the parameters.\n' +
        'Algo de errado ocorreu, talvéz tente melhorar os argumentos ou muda-los.'
    )
  }
}

function buildVerseRichEmbed(versesParsed) {
  let aux = []
  if (versesParsed) {
    for (let index = 0; index < versesParsed.length; index++) {
      const element = versesParsed[index]
      aux.push({
        name: element.getVerseRef(),
        value: element.getScripture(),
      })
    }
    return aux
  } else {
    return formatText(
      'Something went wrong, maybe you have to change the parameters.\n' +
        'Algo de errado ocorreu, talvéz tente melhorar os argumentos ou muda-los.'
    )
  }
}

const commandsMeta = {
  bv: handleBv,
  bd: handleBd,
  bc: handleBc,
  cd: handleCd,
  bs: handleBs,
  hen: handleHen,
  a: handleA,
  o: handleOsis,
  refs: handleRefs,
}

module.exports = { ...commandsMeta }
