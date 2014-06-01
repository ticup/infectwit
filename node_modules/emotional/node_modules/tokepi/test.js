var tokenize = require("./index.js");
var should   = require("should");



describe("tokepi use-cases", function () {
  describe("normal sentence w punctuation", function () {
    var sentence = "This is such a boring sentence.";
    it('should return an array of length 1', function () {
      var array = tokenize(sentence);
      array.length.should.equal(1);
    });

    it('should have a string as entry', function () {
      var array = tokenize(sentence);
      array[0].should.be.a.String;
    });

    it('should be have a white-space tokenized string as entry', function () {
      var array = tokenize(sentence);
      array[0].should.equal("This is such a boring sentence .");
    });
  });

  describe("multiple sentences", function () {
    var sentences = "This is such a boring sentence. And another one. And another one? Yet, another one";
    it('should return an array of length 4', function () {
      var array = tokenize(sentences);
      array.length.should.equal(4);
    });

    it('should have strings as entry', function () {
      var array = tokenize(sentences);
      array.forEach(function (s) {
        s.should.be.a.String;
      });
    });

    it('should be have a white-space tokenized string as entry', function () {
      var array = tokenize(sentences);
      array[0].should.equal("This is such a boring sentence .");
      array[1].should.equal("And another one .");
      array[2].should.equal("And another one ?");
      array[3].should.equal("Yet , another one");
    });
  });

  describe('abbreviations', function () {
    var sentence = "This is a sentence with abbrevation, i.e. like this.";
    it('should treat it as same sentence', function () {
       var array = tokenize(sentence);
       array.length.should.equal(1);
    });

    it('should make a token of the abbreviation', function () {
       var array = tokenize(sentence);
       array[0].should.equal("This is a sentence with abbrevation , i.e. like this .");
    });
  });

  describe('multiple sentence, abbreviation, double punctuation and emoticon', function () {
    var sentences = "This is a rather boring sentence, i.e. not so interesting. Now this is already more awesome:)!?";
    it('should properly split the sentences', function () {
      var array = tokenize(sentences);
      array.length.should.equal(2);
    });

    it('should tokenize the abbreviation, emoticon and punctuation', function () {
      var array = tokenize(sentences);
      array[0].should.equal("This is a rather boring sentence , i.e. not so interesting .");
      array[1].should.equal("Now this is already more awesome :) ! ?");
    });
  });

  describe('single emoticons', function () {
    var sentence = ":)";
    it('should treat it as same sentence', function () {
       var array = tokenize(sentence);
       array.length.should.equal(1);
    });
    it('should make a token of the emoticon', function () {
       var array = tokenize(sentence);
       array[0].should.equal(":)");
    });
  });

  describe('multiple emoticons', function () {
    var sentence = ":):-):s:(";
    it('should treat it as same sentence', function () {
       var array = tokenize(sentence);
       array.length.should.equal(1);
    });
    it('should make a token of the emoticons', function () {
       var array = tokenize(sentence);
       array[0].should.equal(":) :-) :s :(");
    });
  });

  describe('emoticon attached to a word', function () {
    var sentence = "This is good:)!";
    it('should treat it as same sentence', function () {
       var array = tokenize(sentence);
       array.length.should.equal(1);
    });
    it('should make a token of the emoticons', function () {
       var array = tokenize(sentence);
       array[0].should.equal("This is good :) !");
    });
  });
});