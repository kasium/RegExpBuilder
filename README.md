# RegExpBuilder
This little javascript class helps you to write more readable regex code in javascript.
## Installation
Just add the RegExpBuilder.js file from the js folder to your project.
##Usage

### Installation
```javascript
var builder = new RegExpBuilder();
```
### Build your regex
All methods except some special ones allow chaining.
```javascript
builder.beginGroup().matchesText("foo").endGroup().oneOrMoreTimes().or().matchesFor("0-9").oneOrMoreTimes();
//equivalent to /(foo)+|[0-9]+/
```
### Convert to a RegExp object
Finally with the *build()* method you can convert the builder to a RegExp object
```javascript
var regExp = builder.build();
regExp.exec("foo");
```
## Documentation
Refer for the documentation this [link](http://htmlpreview.github.io/?https://github.com/KaiJanis/RegExpBuilder/blob/master/jsdoc/RegExpBuilder.html).

The documentation was created with [JSDoc](https://github.com/jsdoc3/jsdoc)

## License
Refer for the license the [license file](../master/LICENSE)
