const constants = require("./BibleConstants");
const dateformatter = require("./MomentUtil");
const TurndownService = require('turndown');
const turndownService = new TurndownService();

class EditionDetail {
  constructor(editionDescription, abbreviation, comments,
    editionVersion, versionDate, publishDate,
    rightToLeft, ot, nt, strong) {
    this.editionDescription = editionDescription;
    this.abbreviation = abbreviation.toUpperCase();
    this.comments = `${turndownService.turndown(comments).slice(0, 500)}...`;
    this.editionVersion = editionVersion;
    this.versionDate = versionDate;
    this.publishDate = publishDate;
    this.rightToLeft = rightToLeft;
    this.ot = ot;
    this.nt = nt;
    this.strong = strong;
  }

  getEditionDescrition() {
    return `
    Edition Name: ${this.editionDescription}.\n
    Edition Abbreviation: ${this.abbreviation}.\n
    Description: ${this.comments.slice(0, 500)}...\n
    `;
  }
}

class Verse {
  constructor(book, chapter, verse, scripture) {
    this.book = book;
    this.chapter = chapter;
    this.verse = verse;
    this.scripture = scripture;
  }

  getVerseRef() {
    let aux = constants.getBookTitleById(this.book);
    return `${aux} ${this.chapter}:${this.verse}.`;
  }

  getScripture() {
    return this.convertMyswordTagsToDiscordMarkdown(this.removeStrongTags(this.scripture));
  }

  removeStrongTags(text) {
    text = text.replace(/<FR>/gm, '**');
    text = text.replace(/<Fr>/gm, '**');
    text = text.replace(/<CM>/gm, '');
    text = text.replace(/<PF\d+>/gm, '');
    text = text.replace(/<PI\d+>/gm, '');
    text = text.replace(/<WG[^>]+\d+>|\\n+/gm, '');
    text = text.replace(/<WH[^>]+\d+>|\\n+/gm, '');
    text = text.replace(/<WT[^>]+\w+>|\\n+/gm, '');
    text = text.replace(/.*[\\]line\s/gm, '');
    text = text.replace(/[\\]up\d+/gm, '');
    text = text.replace(/[\\]cf\d+\s\d+[\\]cf\d+/gm, '');
    text = text.replace(/[\\]b\s/gm, '**');
    text = text.replace(/[\\]b\d+\s/gm, '**');
    text = text.replace(/[\\]i\s/gm, '_');
    text = text.replace(/[\\]i\d+\s/gm, '_');
    return text;
  }

  convertMyswordTagsToDiscordMarkdown(text) {
    text = text.replace(/<FI>|<Fi>/gm, '__');
    text = text.replace(/(<TS>)|(<TS1>)/gm, '** ');
    text = text.replace(/<Ts>/gm, '**\n\n');
    return text;
  }
}

module.exports.Verse = Verse;
module.exports.EditionDetail = EditionDetail;
