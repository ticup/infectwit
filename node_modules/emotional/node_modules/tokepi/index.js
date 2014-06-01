var _            = require("underscore");
var _str         = require("underscore.string");
var escapeRegExp = require("escape-regexp");
var EMOTICONS    = require("emotional-emoticons");

/*
 * Constants that help capture edge-case tokens such as emoticons and abbreviations.
 */

// RegExp that captures the initial tokens
var RE_TOKEN = /(\S+)\s/g;

// Emoticon definitions in the form of
// {facial-expression : {p: sentiment-value, e: [emoticon]}}
var EMOTICONS = { 
    "love": 
      { p: +1.00,
        e: ["<3", "♥"] },
    "grin": 
      { p: +1.00,
        e: [">:D", ":-D", ":D", "=-D", "=D", "X-D", "x-D", "XD", "xD", "8-D"] },
    "taunt":
      { p: +0.75,
        e: [">:P", ":-P", ":P", ":-p", ":p", ":-b", ":b", ":c)", ":o)", ":^)"] },
    "smile": 
      { p: +0.50,
        e: [">:)", ":-)", ":)", "=)", "=]", ":]", ":}", ":>", ":3", "8)", "8-)"] },
    "wink": 
      { p: +0.25,
        e: [">;]", ";-)", ";)", ";-]", ";]", ";D", ";^)", "*-)", "*)"] },
    "gasp":
      { p: +0.05,
        e: [">:o", ":-O", ":O", ":o", ":-o", "o_O", "o.O", "°O°", "°o°"] },
    "worry":
      { p: -0.25,
        e: [">:/",  ":-/", ":/", ":\\", ">:\\", ":-.", ":-s", ":s", ":S", ":-S", ">.>"] },
    "frown": 
      { p: -0.75,
        e: [">:[", ":-(", ":(", "=(", ":-[", ":[", ":{", ":-<", ":c", ":-c", "=/"] },
    "cry":
      { p: -1.00,
        e: [":'(", ":'''(", ";'("] }
};


// RegExp that captures the emoticons as given in EMOTICONS, but allowing spaces in between the chars.
// The spaces are necessary since the tokenizer will first split the emoticons up and then join them together
// with spaces again.
var RE_EMOTICONS = [];

// for each emoticon string
_.pluck(_.values(EMOTICONS), "e").forEach(function (es) {  
  es.forEach(function (e) {
    // split up into separate characters + escape each character + join back together in a string with " ?" in between.
    // " ?" ::= optional space
    RE_EMOTICONS.push(e.split("").map(escapeRegExp).join(" ?"));
  });
});

// join all emoticons together with an "r" and create regexp
RE_EMOTICONS = new RegExp("(" + RE_EMOTICONS.join("|") + ")", "gi");


// All characters that could express punctuation
var PUNCTUATION = ".,;:!?()[]{}`'\"@#$^&*+-|=~_";

// Most of the abbreviations
var ABBREVIATIONS = [
    "a.", "adj.", "adv.", "al.", "a.m.", "art.", "c.", "capt.", "cert.", "cf.", "col.", "Col.", 
    "comp.", "conf.", "def.", "Dep.", "Dept.", "Dr.", "dr.", "ed.", "e.g.", "esp.", "etc.", "ex.", 
    "f.", "fig.", "gen.", "id.", "i.e.", "int.", "l.", "m.", "Med.", "Mil.", "Mr.", "n.", "n.q.", 
    "orig.", "pl.", "pred.", "pres.", "p.m.", "ref.", "v.", "vs.", "w/"
];

// RegExp that captures abbreviations
var RE_ABBR1 = new RegExp(/^[A-Za-z]\.$/g);      // single letter, "T. De Smedt"
var RE_ABBR2 = new RegExp(/^([A-Za-z]\.)+$/g);   // alternating letters, "U.S."
var RE_ABBR3 = new RegExp(/^[A-Z][b|c|d|f|g|h|j|k|l|m|n|p|q|r|s|t|v|w|x|z]+.$/g); // capital followed by consonants, "Mr."

// RegExp that captures the sarcasm sign: "(!)"
var RE_SARCASM = /\( ?\! ?\)/g;


// Common contractions to separate
var REPLACEMENTS = {
     "'d": " 'd",
     "'m": " 'm",
     "'s": " 's",
    "'ll": " 'll",
    "'re": " 're",
    "'ve": " 've",
    "n't": " n't"
};

// Paragraph line breaks (\n\n marks end of sentence).
var EOS = "END-OF-SENTENCE";




// Returns a list of sentences. Each sentence is a space-separated string of tokens (words).
// Handles common cases of abbreviations (e.g., etc., ...).
// Punctuation marks are split from other words. Periods (or ?!) mark the end of a sentence.
// Headings without an ending period are inferred by line breaks.
function find_tokens(string, punctuation, abbreviations, replace, linebreak) {
  linebreak     = def(linebreak, /n{2,}/g);
  punctuation   = def(punctuation, PUNCTUATION).replace(/\./g, "").split("");
  abbreviations = def(abbreviations, ABBREVIATIONS);
  replace       = def(replace, REPLACEMENTS);

  // Handle replacements (contractions)
  Object.keys(replace).forEach(function (r) {
    string = string.replace(new RegExp(r, "g"), replace[r]);
  });

  // Handle Unicode quotes.
  string = string.replace(new RegExp("“", "g"), " “ ");
  string = string.replace(new RegExp("”", "g"), " ” ");
  string = string.replace(new RegExp("‘", "g"), " ‘ ");
  string = string.replace(new RegExp("’", "g"), " ’ ");


  // Collapse whitespace.
  string = string.replace(new RegExp("\r\n", "g"), "\n");
  string = string.replace(new RegExp(linebreak), " " + EOS + " ");
  string = string.replace(new RegExp(/\s+/g), " ");
  var tokens = [];

  // Start parsing the tokens
  (string + " ").split(RE_TOKEN).forEach(function (t) {

    // Ignore ''
    if (t.length > 0) {
      var tail = [];

      // Handle punctuation marks: tokens will possibly have leading or trailing punctuation.
      // Also handles for example ("good:-)" -> ["good", ":-)"]
      while (startsWithAny(t, punctuation) && (! _str.include(replace, t))) {
        // Split leading punctuation.
        if (startsWithAny(t, punctuation)) {
          tokens.push(t[0]);
          t = t.slice(1);
        }
      }
      while (endsWithAny(t, punctuation.concat(["."])) && (! _str.include(replace, t))) {
        // Split trailing punctuation and make token of it by pushing onto tail.
        if (endsWithAny(t, punctuation)) {
          tail.push(t[t.length-1]);
          t = t.slice(0, t.length-1);
        }

        // Split ellipsis (...) before splitting period.
        if (_str.endsWith(t, "...")) {
          tail.push("...");
          t = _str.rstrip(t.slice(0, t.length-3), ".");
        }

        // Split period (if not an abbreviation).
        if (_str.endsWith(t, ".")) {
          if (_.include(abbreviations, t) ||
              RE_ABBR1.test(t) ||
              RE_ABBR2.test(t) ||
              RE_ABBR3.test(t)) {
            break;

          // Single period encountered at the end, split off
          } else {
            tail.push(t[t.length-1]);
            t = t.slice(0, t.length-1);
          }
        }
      }

      // After parsing all trailing punctuations, push remaining word as token
      if (t !== "") {
        tokens.push(t);
      }
      // And add the trailing punctuation as token to.
      tokens = tokens.concat(tail.reverse());
    }
  });

  // Handle sentence breaks (periods, quotes, parenthesis).
  var sentences = [[]];
  var i = 0;
  var j = 0;
  while (j < tokens.length) {
    // If end of sentence token
    if (_.include(["...", ".", "!", "?", EOS], tokens[j])) {
      // Collapse mutliple eos tokens + handle quote text " "
      while (j < tokens.length &&
             _.include(["'", "\"", "”", "’", "...", ".", "!", "?", ")", EOS], tokens[j])) {
        if (_.include(["'", "\""], tokens[j]) &&
            count(sentences[sentences.length-1], tokens[j]) % 2 === 0) {
          break;
        }
        j++;
      }

      // Push all tokens up to end of sentence onto the last sentence entry
      for (var k = i; k<j; k++) {
        if (tokens[k] !== EOS) {
          sentences[sentences.length-1] = sentences[sentences.length-1].concat(tokens[k]);
        }
      }

      // Start new sentence entry
      sentences.push([]);
      i = j;
    }
    j++;
  }

  // Push remaining tokens onto last sentence
  for (var l = i; l < j; l++) {
    sentences[sentences.length-1] = sentences[sentences.length-1].concat(tokens[l]);
  }

  // Join each sentence with white-spaces and filter out zero-length sentences. 
  sentences = _.compact(sentences.map(function (s) {
    return ((s.length > 0) ? s.join(" ") : false);
  }));

  // Join white-spaced sarcasm
  sentences = sentences.map(function (s) {
    return s.replace(RE_SARCASM, "(!)");
  });

  // Join white-spaced emoticons.
  sentences = sentences.map(function (s) {
    return s.replace(RE_EMOTICONS, function (a) {
      return a.replace(/\ /g, "");
    });
  });

  return sentences;
}


/*
 * Auxiliary Functions
 */

 // Occurrence count of element in vector
function count(vector, el) {
  var ctr = 0;
  vector.forEach(function (e) { if (el === e) { ctr++; }});
  return ctr;
}

// True if the string starts with any element of given vector
function startsWithAny(string, vector) {
  return _.any(vector.map(function (e) { return _str.startsWith(string, e); }));
}
// True if the string ends with any element of given vector
function endsWithAny(string, vector) {
  return _.any(vector.map(function (e) { return _str.endsWith(string, e); }));
}

// Returns value if value is defined, otherwise defValue.
function def(value, defValue) {
  if (_.isUndefined(value)) {
    return defValue;
  }
  return value;
}


module.exports   = find_tokens;