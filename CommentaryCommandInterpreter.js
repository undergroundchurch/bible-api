const cmm = require('./CommentaryMedium')
const constants = require('./BibleConstants')
const cmtversions = require('./CommentaryVersionEnum')
const bcv_parser =
  require('bible-passage-reference-parser/js/pt_bcv_parser').bcv_parser
const bcv = new bcv_parser()
const path = require('path')

const poole = new cmm.CommentaryMedium(
  (dbpath = path.join(__dirname, '.', 'db/poole', 'POOLE.cmt.mybible'))
)
const rwp = new cmm.CommentaryMedium(
  (dbpath = path.join(__dirname, '.', 'db/rwp', 'RWP.cmt.mybible'))
)

class CommentaryCommandInterpreter {
  parseRef(args) {
    let verses = null
    args = args.trim()

    if (RegExp(cmtversions.CommentaryVersionEnum.RWP).test(args)) {
      verses = this.getVersesParsed(args, rwp)
    } else if (RegExp(cmtversions.CommentaryVersionEnum.POOLE).test(args)) {
      verses = this.getVersesParsed(args, poole)
    }

    return verses
  }

  parseDetail(args) {
    let detail = null
    args = args.trim()

    if (RegExp(cmtversions.CommentaryVersionEnum.RWP).test(args)) {
      detail = this.getDetailParsed(rwp)
    } else if (RegExp(cmtversions.CommentaryVersionEnum.POOLE).test(args)) {
      detail = this.getDetailParsed(poole)
    }

    return detail
  }

  getDetailParsed(commentary) {
    return commentary.findDetail()
  }

  getOsis(args) {
    return bcv.parse(args).osis()
  }

  getVersesParsed(args, bible) {
    let refsSeparated = Array()
    let refsOsis = this.getOsis(args)
    let refsParsed = refsOsis.split(/[-,\/ -]/)
    let versesParsed = Array()

    if (refsParsed.length > 1) {
      for (let index = 0; index < refsParsed.length; index++) {
        const element = refsParsed[index]
        refsSeparated.push(element.split('.'))
      }
    } else {
      refsSeparated.push(refsOsis.split('.'))
    }

    for (let index = 0; index < refsSeparated.length; index++) {
      const element = refsSeparated[index]

      let book_number = constants.getBookNameById(element[0])
      let chapter_number = element[1]
      let verse_number = element[2]

      let verse = bible.findCommentaryBy(
        book_number,
        chapter_number,
        verse_number,
        verse_number
      )
      versesParsed.push(verse)
    }
    return versesParsed
  }
}

module.exports.CommentaryCommandInterpreter = CommentaryCommandInterpreter
