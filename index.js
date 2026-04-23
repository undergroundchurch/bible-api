const prompt = require("prompt-sync")();

const viterp = require("./BibleCommandInterpreter");
const citerp = require("./CommentaryCommandInterpreter");

const bci = new viterp.BibleCommandInterpreter();
const cci = new citerp.CommentaryCommandInterpreter();

const versions = require("./BibleVersionEnum");
const cmtversions = require("./CommentaryVersionEnum");

const constants = require("./BibleConstants");

const PREFIX = ".";

function ProcessingInstruction(msg) {
  if (!msg.startsWith(PREFIX)) return;
  const command = msg.split(" ")[0].slice(PREFIX.length);
  const args = msg.split(" ").slice(1).join(" ");

  if (command === "bv") {
    let versesParsed = bci.parseRef(args);
    let osis = cci.getOsis(args);
    let embed = buildVerseRichEmbed(versesParsed);
    return console.log(embed);
  } else if (command === "bd") {
    let detail = bci.parseDetail(args).getEditionDescrition();
    let embed = formatText(detail);
    return console.log(embed);
  } else if (command === "bc") {
    let versesParsed = cci.parseRef(args);
    let embed = buildCommentaryRichEmbed(versesParsed);
    return console.log(embed);
  } else if (command === "cd") {
    let detail = cci.parseDetail(args).getEditionDescrition();
    let embed = formatText(detail);
    return console.log(embed);
  } else if (command === "bs") {
    let versesParses = bci.parseWords(args);
    let embed = buildSearchRichEmbed(versesParses);
    return console.log(embed);
  } else if (command === "hen") return console.log(bch.config.HELP.en);
  else if (command === "hpt") return console.log(bch.config.HELP.pt);
  else if (command === "iv") return console.log(bch.config.INVITE);
  else if (command === "c") return console.log(bch.config.COMMANDS);
  else if (command === "a") return console.log(getAllVersionsAndCmt());
  else if (command === "refs") return console.log(getAllRefPtBrFormat());
  else return;
}

function init() {
  while (true) {
    let msg = prompt("Enter your message: ");
    ProcessingInstruction(msg);
  }
}

function getAllRefPtBrFormat() {
  let aux = "**Refs Bíblicas // Biblical Refs (PT-BR FORMAT)**\n\n";

  Object.keys(constants.refs.ptbr).forEach((key) => {
    aux += `${String(key)} `;
  });

  return aux;
}

function getAllVersionsAndCmt() {
  let aux = "**Versões Bíblicas // Biblical Verses**\n\n";

  Object.keys(versions.BibleVersionEnum).forEach((key) => {
    aux += `${String(key)}\n`;
  });

  aux += "**\nComentários Bíblicos // Biblical Commentaries**\n\n";

  Object.keys(cmtversions.CommentaryVersionEnum).forEach((key) => {
    aux += `${String(key)}\n`;
  });

  return aux;
}

function buildSearchRichEmbed(versesParsed) {
  let aux = [];
  if (versesParsed) {
    for (let index = 0; index < versesParsed.length; index++) {
      const element = versesParsed[index];
      aux.push({
        name: element.getVerseRef(),
        value: element.getScripture(),
      });
    }
    return aux;
  } else {
    return formatText(
      "Something went wrong, maybe you have to change the parameters.",
    );
  }
}

function buildCommentaryRichEmbed(commentariesParsed) {
  let aux = [];
  if (commentariesParsed) {
    for (let index = 0; index < commentariesParsed.length; index++) {
      const element = commentariesParsed[index];
      aux.push({
        name: element.getVerseRef(),
        value: element.getData(),
      });
    }
    return aux;
  } else {
    return formatText(
      "Something went wrong, maybe you have to change the parameters.\n" +
        "Algo de errado ocorreu, talvéz tente melhorar os argumentos ou muda-los.",
    );
  }
}

function buildVerseRichEmbed(versesParsed) {
  let aux = [];
  if (versesParsed) {
    for (let index = 0; index < versesParsed.length; index++) {
      const element = versesParsed[index];
      aux.push({
        name: element.getVerseRef(),
        value: element.getScripture(),
      });
    }
    return aux;
  } else {
    return formatText(
      "Something went wrong, maybe you have to change the parameters.\n" +
        "Algo de errado ocorreu, talvéz tente melhorar os argumentos ou muda-los.",
    );
  }
}

module.exports.ProcessingInstruction = ProcessingInstruction;
