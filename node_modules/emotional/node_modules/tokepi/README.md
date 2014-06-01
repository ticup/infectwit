tokepi
======

Node.js tokenizer that transforms a string of sentences into an array of white-space separated strings of tokens. Partial port from the [pattern.en library of CLIPS (University of Antwerp)](http://www.clips.ua.ac.be/pages/pattern-en), so all credits go to the original author [Tom De Smedt](http://organisms.be).

Includes following features and lack thereof is main reason for not using existing node tokenizers:

* Abbreviation recognition
* Emoticon recognition
* Contraction separation
* No listeners: give a string, get your array of sentences-tokens


Usage
-----
Download the library with the npm package manager


    npm install tokepi


Import and start using

```javascript
  var tokepi = require("tokepi");

  var tokens = tokepi("This is a rather boring sentence, i.e. not so interesting. Now this is already more awesome:)!?");
  // tokens = [ "This is a rather boring sentence, i.e. not so interesting .",
  //            "Now this is already more awesome :) ! ?"];

  tokens.map(function (s) { return s.split(" "); });
  // = [["This", "is", "a", "rather", "boring", "sentence", ",", "i.e.", "not", "so", "interesting", "."],
  //    ["Now", "this", "is", "already", "more", "awesome", ":)", "!", "?"]];
```

Supported
---------
* Emoticons: the supported emoticons can be found in the [Emotional-emoticons](https://github.com/ticup/emotional-emoticons.git) package.

* Abbreviations
```javascript
[ "a.", "adj.", "adv.", "al.", "a.m.", "art.", "c.", "capt.", "cert.", "cf.", "col.", "Col.", 
  "comp.", "conf.", "def.", "Dep.", "Dept.", "Dr.", "dr.", "ed.", "e.g.", "esp.", "etc.", "ex.", 
  "f.", "fig.", "gen.", "id.", "i.e.", "int.", "l.", "m.", "Med.", "Mil.", "Mr.", "n.", "n.q.", 
  "orig.", "pl.", "pred.", "pres.", "p.m.", "ref.", "v.", "vs.", "w/" ]
```

and patterns matched by following regular expressions

```
/^[A-Za-z]\.$/g      // single letter, "T. De Smedt"
/^([A-Za-z]\.)+$/g   // alternating letters, "U.S."
/^[A-Z][b|c|d|f|g|h|j|k|l|m|n|p|q|r|s|t|v|w|x|z]+.$/g // capital followed by consonants, "Mr."
```

* Contractions
```
["'d", "'m", 's","'ll", "'re", "'ve", "n't"]
```

Feel free to request additions.


Test
----
In order to run the test, make sure all dependencies are installed with
    npm install

and then simply run with

    npm test


License (BSD)
-------------
Copyright (c) 2011-2013 University of Antwerp, Belgium
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright 
    notice, this list of conditions and the following disclaimer in
    the documentation and/or other materials provided with the
    distribution.
  * Neither the name of Pattern nor the names of its
    contributors may be used to endorse or promote products
    derived from this software without specific prior written
    permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
