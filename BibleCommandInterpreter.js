const bm = require('./BibleMedium')
const constants = require('./BibleConstants')
const versions = require('./BibleVersionEnum')
const bcv_parser =
  require('bible-passage-reference-parser/js/pt_bcv_parser').bcv_parser
const bcv = new bcv_parser()
const path = require('path')

const byz = new bm.BibleMedium(
  (dbpath = path.join(__dirname, '.', 'db/byz', 'BYZ2005.bbl.mybible'))
)
const emtv = new bm.BibleMedium(
  (dbpath = path.join(__dirname, '.', 'db/emtv', 'EMTV.bbl.mybible'))
)
const wpnt = new bm.BibleMedium(
  (dbpath = path.join(__dirname, '.', 'db/wpnt', 'WPNT.bblx'))
)
const acf = new bm.BibleMedium(
  (dbpath = path.join(__dirname, '.', 'db/acf', 'ACF2007.bbl.mybible'))
)
const ita = new bm.BibleMedium(
  (dbpath = path.join(__dirname, '.', 'db/ita', 'ITARIVE.bbl.mybible'))
)
const fre = new bm.BibleMedium(
  (dbpath = path.join(__dirname, '.', 'db/fre', 'FREMRTN.bbl.mybible'))
)
const isv = new bm.BibleMedium(
  (dbpath = path.join(__dirname, '.', 'db/isv', 'ISV.bbl.mybible'))
)

class BibleCommandInterpreter {
  whichPublisher(args) {
    let bible = { source: null, label: null }

    if (RegExp(versions.BibleVersionEnum.WPNT).test(args)) {
      bible = { source: wpnt, label: versions.BibleVersionEnum.WPNT }
    } else if (RegExp(versions.BibleVersionEnum.ACF).test(args)) {
      bible = { source: acf, label: versions.BibleVersionEnum.ACF }
    } else if (RegExp(versions.BibleVersionEnum.EMTV).test(args)) {
      bible = { source: emtv, label: versions.BibleVersionEnum.EMTV }
    } else if (RegExp(versions.BibleVersionEnum.BYZ).test(args)) {
      bible = { source: byz, label: versions.BibleVersionEnum.BYZ }
    } else if (RegExp(versions.BibleVersionEnum.ITARIVE).test(args)) {
      bible = { source: ita, label: versions.BibleVersionEnum.ITARIVE }
    } else if (RegExp(versions.BibleVersionEnum.FREMRTN).test(args)) {
      bible = { source: fre, label: versions.BibleVersionEnum.FREMRTN }
    } else if (RegExp(versions.BibleVersionEnum.ISV).test(args)) {
      bible = { source: isv, label: versions.BibleVersionEnum.ISV }
    } else {
      bible = { source: acf, label: versions.BibleVersionEnum.ACF }
    }

    return bible
  }

  parseRef(citations) {
    let verses = {}
    let dividedBySemi = citations.split(';')

    for (let index = 0; index < dividedBySemi.length; index++) {
      let args = dividedBySemi[index].trim()
      let res = null
      let bible = this.whichPublisher(args)

      res = this.getVersesParsed(args, bible.source)
      verses[bible.label] = res
    }

    return verses
  }

  parseWords(args) {
    args = args.trim()
    const bible = this.whichPublisher(args)
    return this.getVersesParsed(args, bible.source)
  }

  splitArguments(args, edition_version, bible) {
    let regex = `\\b${edition_version}\\s[a-zA-ZêãíóáÊúôéÉâ0-9\s]+\\b`
    let index = args.search(regex, 'gi')
    let book = args.slice(index, args.length)
    book = book.replace(edition_version, '')
    book = book.trim()
    let book_number = constants.getSearchableBookNameById(book)
    if (book_number) {
      args = args.slice(0, index)
      args = args.trim()
      args = args.split(',')
      return this.getVersesFromSearch(args, book_number, bible)
    }
    return null
  }

  parseDetail(args) {
    let detail = null
    args = args.trim()

    if (RegExp(versions.BibleVersionEnum.WPNT).test(args)) {
      detail = this.getDetailParsed(wpnt)
    } else if (RegExp(versions.BibleVersionEnum.ACF).test(args)) {
      detail = this.getDetailParsed(acf)
    } else if (RegExp(versions.BibleVersionEnum.EMTV).test(args)) {
      detail = this.getDetailParsed(emtv)
    } else if (RegExp(versions.BibleVersionEnum.BYZ).test(args)) {
      detail = this.getDetailParsed(byz)
    }

    return detail
  }

  getDetailParsed(bible) {
    return bible.findDetail()
  }

  getOsis(args) {
    return bcv.parse(args).osis_and_indices()
  }

  getVersesFromSearch(args, book_number, bible) {
    return bible.searchTextBy(args, book_number)
  }

  /**
   * @todo to be used later for a arch based on tasks for each verse
   * @param {*} osis
   * @returns {Array<String>}
   */
  allVersesExtended(osis) {
    let res = []
    if (!osis) return res

    let parts = osis.split(',')
    parts.forEach((part) => {
      if (part.includes('-')) {
        let rangeParts = part.split('-')
        let start = rangeParts[0].split('.')
        let end = rangeParts[1].split('.')

        let bookStart = start[part.includes('.') ? 0 : -1] // Basic check
        if (start.length < 3 || end.length < 3) {
          res.push(part)
          return
        }

        let bStart = start[0]
        let cStart = parseInt(start[1])
        let vStart = parseInt(start[2])

        let bEnd = end[0]
        let cEnd = parseInt(end[1])
        let vEnd = parseInt(end[2])

        let bookNumber = constants.getBookNameById(bStart)
        if (!bookNumber) {
          res.push(rangeParts[0])
          res.push(rangeParts[1])
          return
        }

        let chapterCounts = constants.chapters[bookNumber]

        if (bStart === bEnd) {
          if (cStart === cEnd) {
            for (let v = vStart; v <= vEnd; v++) {
              res.push(`${bStart}.${cStart}.${v}`)
            }
          } else {
            // First chapter
            for (let v = vStart; v <= chapterCounts[cStart - 1]; v++) {
              res.push(`${bStart}.${cStart}.${v}`)
            }
            // Middle chapters
            for (let c = cStart + 1; c < cEnd; c++) {
              for (let v = 1; v <= chapterCounts[c - 1]; v++) {
                res.push(`${bStart}.${c}.${v}`)
              }
            }
            // Last chapter
            for (let v = 1; v <= vEnd; v++) {
              res.push(`${bStart}.${cEnd}.${v}`)
            }
          }
        } else {
          // Different books - handle if needed, but usually not in same range
          res.push(rangeParts[0])
          res.push(rangeParts[1])
        }
      } else {
        res.push(part)
      }
    })
    return res
  }

  /**
   * @param {*} osis
   * @returns {Array<Object>}
   */
  getRanges(osis) {
    let ranges = []
    if (!osis) return ranges

    let parts = osis.split(',')
    parts.forEach((part) => {
      if (part.includes('-')) {
        let rangeParts = part.split('-')
        let start = rangeParts[0].split('.')
        let end = rangeParts[1].split('.')

        if (start.length < 3 || end.length < 3) return

        let bStart = start[0]
        let cStart = parseInt(start[1])
        let vStart = parseInt(start[2])

        let bEnd = end[0]
        let cEnd = parseInt(end[1])
        let vEnd = parseInt(end[2])

        let bookNumber = constants.getBookNameById(bStart)
        if (!bookNumber) return
        let chapterCounts = constants.chapters[bookNumber]

        if (bStart === bEnd) {
          if (cStart === cEnd) {
            ranges.push({
              book: bStart,
              chapter: cStart,
              from: vStart,
              to: vEnd,
            })
          } else {
            // First chapter
            ranges.push({
              book: bStart,
              chapter: cStart,
              from: vStart,
              to: chapterCounts[cStart - 1],
            })
            // Middle chapters
            for (let c = cStart + 1; c < cEnd; c++) {
              ranges.push({
                book: bStart,
                chapter: c,
                from: 1,
                to: chapterCounts[c - 1],
              })
            }
            // Last chapter
            ranges.push({
              book: bStart,
              chapter: cEnd,
              from: 1,
              to: vEnd,
            })
          }
        }
      } else {
        let verseParts = part.split('.')
        if (verseParts.length >= 3) {
          ranges.push({
            book: verseParts[0],
            chapter: parseInt(verseParts[1]),
            from: parseInt(verseParts[2]),
            to: parseInt(verseParts[2]),
          })
        }
      }
    })
    return ranges
  }

  getVersesParsed(shortCitation, bible) {
    let versesParsed = Array()

    let refsOsis = this.getOsis(shortCitation)
    if (!refsOsis || refsOsis.length === 0) return []

    // Use the first parsed reference group
    let osisString = refsOsis[0].osis
    let ranges = this.getRanges(osisString)

    for (let index = 0; index < ranges.length; index++) {
      const range = ranges[index]

      let book_number = constants.getBookNameById(range.book)
      let chapter_number = range.chapter
      let verse_number_start = range.from
      let verse_number_end = range.to

      let verses = bible.findScriptureByRange(
        book_number,
        chapter_number,
        verse_number_start,
        verse_number_end
      )

      versesParsed = versesParsed.concat(verses)
    }

    return versesParsed
  }
}

module.exports.BibleCommandInterpreter = BibleCommandInterpreter
