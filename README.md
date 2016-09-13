# RegExpBuilder
This little javascript class helps you to write more readable regex code in javascript.
## Installation
Just add the RegExpBuilder.js file from the js folder to your project.

##Examples

### Floating Point Numbers
```javascript
var builder = new RegExpBuilder();
builder.startLine().matchesFor("-+").zeroOrOneTimes()
 .and().matchesDigit().zeroOrMoreTimes()
 .and().matchesText(".").zeroOrOneTimes()
 .and().matchesDigit().oneOrMoreTimes()
 .beginGroup()
	.matchesFor("eE")
	.and().matchesFor("-+").zeroOrOneTimes()
	.matchesDigit().oneOrMoreTimes()
 .endGroup().oneOrMoreTimes().endLine();
 var regExp = builder.build();
```
The and() method is only optional so theoretical it could be omitting.

This is equivalent to:
```javascript
var regExp = new RegExp("^[-+]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?$");
```
Or without using a string:
```javascript
var regExp = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
```

### Name selecttion
Get the first last name with a beginning 'A'.

Text: Lewis,Amelia;Winston,Oliver;Adams,Emily;Ashton,Thomas
```javascript
var regExp = new RegExp("A[a-zA-Z]*,[a-zA-Z]+");
```
Or with the builder:
```javascript
var builder = new RegExpBuilder();
builder.matchesText("A").matchesFor("a-zA-Z").zeroOrMoreTimes().matchesText(",")
  matchesFor("a-zA-Z").oneOrMoreTimes();
var regExp = builder.build();
```

## Documentation
Refer for the documentation this [link](https://kaijanis.github.io/RegExpBuilder/jsdoc/RegExpBuilder.html).
The documentation was created with [JSDoc](https://github.com/jsdoc3/jsdoc)

## Tests
The tests are written for qUnit. You can execute them online [here](https://kaijanis.github.io/RegExpBuilder/tests/index.html).

## License
Refer for the license the [license file](../master/LICENSE)
