const Database = require('better-sqlite3')
const commentarylib = require('./BibleCommentary')

class CommentaryMedium {
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
  findCommentaryBy(book_number, chapter_number, from_verse, to_verse) {
    let sql = `SELECT * FROM commentary WHERE Book=${book_number} AND Chapter=${chapter_number} AND FromVerse=${from_verse} AND ToVerse=${to_verse};`
    let row = this.processSQL(sql)
    if (row) {
      return new commentarylib.Commentary(
        row.book,
        row.chapter,
        row.fromverse,
        row.toverse,
        row.data
      )
    } else {
      return new commentarylib.Commentary(0, 0, 0, 0, 'Commentary Not Found')
    }
  }

  findDetail() {
    let sql = `SELECT * FROM details;`
    let row = this.processSQL(sql)
    return new commentarylib.CommentaryDetail(
      row.title,
      row.abbreviation,
      row.description,
      row.author,
      row.version,
      row.versiondate,
      row.publishdate,
      row.publisher,
      row.creator,
      row.source,
      row.language
    )
  }

  processSQL(sql) {
    const db = new Database(this.dbpath, { readonly: true })
    let row = null

    try {
      let stmt = db.prepare(sql)
      row = stmt.get()
    } catch (error) {
      console.log(error)
    }

    db.close()
    return row
  }
}

module.exports.CommentaryMedium = CommentaryMedium
