const Database = require('better-sqlite3')
const verselib = require('./BibleVerse')
const versions = require('./BibleVersionEnum')

class BibleMedium {
  /**
   * Build a medium to get bible verses from a sqlite db.
   * @param {str} dbpath DB Absolute Path (recommended).
   */
  constructor(dbpath) {
    this.dbpath = dbpath
  }

  /**
   * This method access a sqlite database to get a verse of the Bible using Book Number, Chapter Number, Verse Number.
   * Chapter number and Verse number follow the classic numbering for the New Testament.
   * @param {int} book_number Old Testament goes from 1 to 39 New Testament goes from 40 to 66.
   * @param {int} chapter_number Chapter number goes from 1 to n and Verse from 1 to n.
   * @param {int} verse_number Verse number goes from 1 to n and Verse from 1 to m.
   */
  findScriptureBy(book_number, chapter_number, verse_number) {
    let sql = `SELECT * FROM bible WHERE Book=${book_number} AND Chapter=${chapter_number} AND Verse=${verse_number};`
    let row = this.processSQL(sql)
    console.log(sql)

    if (row) {
      return new verselib.Verse(row.Book, row.Chapter, row.Verse, row.Scripture)
    } else {
      return new verselib.Verse(0, 0, 0, 'Scripture Not Found')
    }
  }

  selectMethod() {
    if (method == versions.BibleSearchTypeEnum.BOOK) {
      return searchTextByBook(words, book)
    }
  }

  searchTextBy(words, book_number) {
    let aux = '('
    let sql_injection_barrier = RegExp(
      /\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|UPDATE|UNION( +ALL){0,1})\b/gim
    )

    if (words instanceof Array) {
      for (let index = 0; index < words.length - 1; index++) {
        const element = words[index]
        // Just a simple barrier against some types of injection, nothing too much sophisticated.
        if (sql_injection_barrier.test(element)) {
          return null
        }
        aux += `Scripture LIKE \"%${element}%\" OR `
      }
      aux += `Scripture LIKE \"%${words[words.length - 1]}%\")`
    } else {
      if (sql_injection_barrier.test(words)) {
        return null
      }
      aux += `(Scripture LIKE \"%${words}%\")`
    }

    let sql = `SELECT * FROM bible WHERE Book=${book_number} AND ${aux} LIMIT 7;`
    console.log(sql)

    let rows = this.processSQL(sql, 'ALL')

    if (rows) {
      let listOfVerses = Array()
      for (let index = 0; index < rows.length; index++) {
        const element = rows[index]
        listOfVerses.push(
          new verselib.Verse(
            element.Book,
            element.Chapter,
            element.Verse,
            element.Scripture
          )
        )
      }
      return listOfVerses
    } else {
      return [new verselib.Verse(0, 0, 0, 'Scripture Not Found')]
    }
  }

  findDetail() {
    let sql = `SELECT * FROM details;`
    let row = this.processSQL(sql)
    return new verselib.EditionDetail(
      row.Description,
      row.Abbreviation,
      row.Comments,
      row.Version,
      row.VersionDate,
      row.PublishDate,
      row.RightToLeft,
      row.OT,
      row.NT,
      row.Strong
    )
  }

  processSQL(sql, order = 'GET') {
    let db = null
    try {
      db = new Database(this.dbpath, { readonly: true })
    } catch (error) {
      console.log(error)
      return null
    }
    let row = null

    try {
      let stmt = db.prepare(sql)
      if (order === 'GET') {
        row = stmt.get()
      } else if (order === 'ALL') {
        row = stmt.all()
      }
    } catch (error) {
      console.log(error)
    }

    db.close()
    return row
  }
}

module.exports.BibleMedium = BibleMedium

// var path = require('path');
// const dbpath = path.join(__dirname, '.', 'db/wpnt', 'wpnt.bblx');
// let bibleMedium = new BibleMedium(dbpath);
// console.log(bibleMedium.getVerse(45, 1, 1));
