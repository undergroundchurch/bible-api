const constants = require("./BibleConstants");
const dateformatter = require("./MomentUtil");
const TurndownService = require('turndown');
const turndownService = new TurndownService();

class CommentaryDetail {
  constructor(cmtTitle, abbreviation, cmtDescription,
              author, cmtVersion, versionDate,
              publishDate, publisher, creator,
              cmtSource, cmtLanguage) {
    this.cmtTitle = cmtTitle;
    this.abbreviation = abbreviation.toUpperCase();
    this.cmtDescription = cmtDescription;
    this.author = author;
    this.cmtVersion = cmtVersion;
    this.versionDate = versionDate;
    this.publishDate = publishDate;
    this.publisher = publisher;
    this.creator = creator;
    this.cmtSource = cmtSource;
    this.cmtLanguage = cmtLanguage;
  }

  getEditionDescrition() {
    return `
    Title: ${this.cmtTitle}.\n
    Abbreviation: ${this.abbreviation}.\n
    Description: ${this.cmtDescription.slice(0, 800)}...\n
    Author: ${this.author}.
    `;
  }
}

class Commentary {
  constructor(book, chapter, fromVerse, toVerse, data) {
    this.book = book;
    this.chapter = chapter;
    this.fromVerse = fromVerse;
    this.toVerse = toVerse;
    this.data = `${turndownService.turndown(data).slice(0, 800)}...`;
  }

  getVerseRef() {
    let aux = constants.getBookTitleById(this.book);
    return `${aux} ${this.chapter}:${this.fromVerse}-${this.toVerse}.`;
  }

  getData() {
    return this.data;
  }
}

module.exports.Commentary = Commentary;
module.exports.CommentaryDetail = CommentaryDetail;
