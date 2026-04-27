const viterp = require('./BibleCommandInterpreter')
const citerp = require('./CommentaryCommandInterpreter')

const bci = new viterp.BibleCommandInterpreter()
const cci = new citerp.CommentaryCommandInterpreter()

const versions = require('./BibleVersionEnum')
const cmtversions = require('./CommentaryVersionEnum')

const constants = require('./BibleConstants')

const handleBv = (args) => {
  let versesParsed = bci.parseRef(args)
  return versesParsed
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

function removeScriptureSupport(verses) {
  let versesMap = verses?.map((v) => ({
    ...v,
    scripture: String(v?.scripture)
      .replace(/<[^>]*>/g, '')
      .replace(/\\cf\d+\s*\\up\d+\s*\d+\s*\\cf\d+\s*\\up\d+/g, '')
      .replace(/\\[a-z]+\d*/gi, '')
      .trim(),
  }))

  return versesMap
}

const handleSegments = (segments) => {
  let result = {}
  let errors = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    let { book, chapter, from, to, publisher } = segment

    // Convert book name to number if necessary
    let bookId = parseInt(book)
    if (isNaN(bookId)) {
      bookId =
        constants.getBookNameById(book) ||
        constants.getSearchableBookNameById(book)
    }

    // Basic validation for book
    if (!bookId || !constants.chapters[bookId]) {
      errors.push(`Segment ${i}: Invalid or missing book (${book})`)
      continue
    }

    // Ensure chapter and verses are numbers
    const nChapter = parseInt(chapter)
    const nFrom = from ? parseInt(from) : 1
    const nTo = to ? parseInt(to) : null // will default later

    if (
      isNaN(nChapter) ||
      nChapter < 1 ||
      nChapter > constants.chapters[bookId].length
    ) {
      errors.push(
        `Segment ${i}: Invalid or missing chapter (${chapter}) for book ${bookId}`
      )
      continue
    }

    const maxVerses = constants.chapters[bookId][nChapter - 1]
    const finalTo = nTo === null ? maxVerses : nTo

    if (isNaN(nFrom) || nFrom < 1 || nFrom > maxVerses) {
      errors.push(
        `Segment ${i}: Invalid 'from' verse ${from} for book ${bookId} chapter ${nChapter}`
      )
      continue
    }
    if (isNaN(finalTo) || finalTo < 1 || finalTo > maxVerses) {
      errors.push(
        `Segment ${i}: Invalid 'to' verse ${to} for book ${bookId} chapter ${nChapter}`
      )
      continue
    }
    if (nFrom > finalTo) {
      errors.push(
        `Segment ${i}: 'from' verse ${nFrom} cannot be greater than 'to' verse ${finalTo}`
      )
      continue
    }

    const bible = bci.whichPublisher(publisher || '')
    const verses = removeScriptureSupport(
      bible.source.findScriptureByRange(bookId, nChapter, nFrom, finalTo)
    )

    if (!result[bible.label]) {
      result[bible.label] = []
    }
    result[bible.label] = result[bible.label].concat(verses)
  }

  if (errors.length > 0 && Object.keys(result).length === 0) {
    return { error: 'Validation failed', details: errors }
  }

  if (errors.length > 0) {
    result._errors = errors
  }

  return result
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
  segments: handleSegments,
}

module.exports = { ...commandsMeta }
