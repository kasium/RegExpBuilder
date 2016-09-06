/**
 * @constructor
 * @public
 * @author Kai Mueller
 * @version 0.1.0
 */
function RegExpBuilder() {
	"use strict";
	
	//internal variables
	var _sRegExpPattern = "";
	var _aRegexCharacters = ["(", ")", "/", ".", "*", "?", "+", "$", "^", "=", "!"];
	var _validationStack = [];
	
	//internal constants
	var _OPEN_GROUP = {
			beginMissing : "Before closing a group you must open one",
			endMissing: "Missing end group statement"
	};
	var _OPEN_LOOK_AHEAD = {
			beginMissing : "Before closing a look ahead you must open one",
			endMissing: "Missing open look ahaed group statement"
	};
	
	function _add(sText) {
		_sRegExpPattern = _sRegExpPattern + sText;
	}
	
	function _popValidationCheck(sExpectetStackEntry) {
		var entry = _validationStack[_validationStack.length -1];
		if(entry !== sExpectetStackEntry) {
			throw new Error(sExpectetStackEntry.beginMissing);
		}
		_validationStack.pop();
	}
	
	function _startlookAhead(bNegate) {
		_validationStack.push(_OPEN_LOOK_AHEAD);
		var sSign = "=";
		if(bNegate) {
			sSign = "!";
		}
		_add("(?" + sSign);
	}
	
	function _endLookAhead() {
		_popValidationCheck(_OPEN_LOOK_AHEAD);
		_add(")");
	}
  
	function _escape(sText) {
		var aChars = sText.split("");
		aChars.forEach(function(sChar, iIndex) {
			if(_aRegexCharacters.indexOf(sChar) !== -1) {
				aChars[iIndex] = "\\" + sChar;
			}
		});
		return aChars.join("");
	}
	
	function _regExpToString(oRegExp) {
		if(!oRegExp || !oRegExp instanceof RegExp) {
			throw new Error("The overgiven parameter is undefined, null, or not a instance of RegExp")
		}
		return oRegExp.toString().substring(1, oRegExp.toString().length -1);
	}
  
	return {
		
		//######### matches #########
		
		/**
		 * Adds a free text to a pattern. Free means no escaping is done, so it is possible to use
		 * regex here.
		 * 
		 * @public
		 * @param {string} sText text to add
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		matchesFreeText: function(sText) {
			_add(sText);
			return this;
		},
		
		/**
		 * Adds the whole regex pattern of a RegExp to the current pattern.
		 * 
		 * @public
		 * @param {RegExp} oRegExp the RegExp to add
		 * @return {RegExpBuilder} the current instance for methode chaining
		 * @throws {Error} if oRegExp is not a instance of RegExp  
		 */
		matchesRegExp: function(oRegExp) {
			_add(_regExpToString());
			return this;
		},
		
		/**
		 * Adds a matcher for any character except the line break.
		 * This is equivalent to the regex symbol '.'
		 * 
		 * @public
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		matchesAny: function() {
			_add(".");
			return this;
		},
		
		/**
		 * Adds a matcher for a list of possible characters. It is possible to provide a range with a '-'
		 * This is equivalent to the regex function '[]'
		 * 
		 * @public
		 * @param {string} sCharacters a list of the characters to match
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		matchesFor: function(sCharacters) {
			_add("[" + sCharacters + "]");
			return this;
		},
		
		/**
		 * Adds a negative matcher for a list of possible characters. It is possible to provide a range with a '-'
		 * This is equivalent to the regex function '[^]'
		 * 
		 * @public
		 * @param {string} sCharacters a list of the characters not to match
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		matchesNotFor: function(sCharacters) {
			_add("[^" + sCharacters + "]");
			return this;
		},
		
		/**
		 * Adds a matcher for this text. All characters which are used internally by regex will be escaped
		 * 
		 * @public
		 * @param {string} sText text to match
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		matchesText: function(sText) {
			_add(_escape(sText));
			return this;
		},
		
		
		//######### How many times #########
		
		/**
		 * After a matcher this specifies how many times the matcher should match.
		 * It is possible to define a minimum and a maximum or a exact number
		 * This is equivalent to the regex function '{x,x}' or '{x}' where x is a integer
		 * 
		 * @public
		 * @param {int} iMin minumum times to match or without the parameters iMax exact how often
		 * @param {int} iMax (optional) maximum times to match
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		matchesTimes: function(iMin, iMax) {
			if(iMax) {
				_add("{" + iMin + "," + iMax + "}");
			} else {
				_add("{" + iMin + "}");
			}
			return this;
		},
		
		/**
		 * After a matcher this specifies that the matcher should match one or more times.
		 * This is equivalent to the regex function '+'
		 * 
		 * @public
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		oneOrMoreTimes: function(sText) {
			_add("+");
			return this;
		},
		
		/**
		 * After a matcher this specifies that the matcher should match zero or more times.
		 * This is equivalent to the regex function '*'
		 * 
		 * @public
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		zeroOrMoreTimes: function() {
			_add("*");
			return this;
		},
		
		/**
		 * After a matcher this specifies that the matcher should match zero or one times.
		 * This is equivalent to the regex function '?'
		 * 
		 * @public
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		zeroOrOneTimes: function(sText) {
			_add("?");
			return this;
		},
		
		
		//######### Control Signs #########

		addWordBoundary: function() {
			_add("\\b");
			return this;
		},
		
		addNotWordBoundary: function() {
			_add("\\B");
			return this;
		},
		
		beginLine: function() {
			_add("^");
			return this;
		},
    
		endLine: function() {
			_add("$");
			return this;
		},
		
		
		//######### Groups #########
		
		/**
		 * Begins a new group.
		 * This is equivalent to the regex function '('.
		 * 
		 * @return {RegExpBuilder} the current instance for methode chaining
		 */
		beginGroup: function() {
			_validationStack.push(_OPEN_GROUP);
			_add("(");
			return this;
		},
		
		/**
		 * Ends a group. A validation is done if a corresponding open group exists.
		 * This is equivalent to the regex function '('.
		 * 
		 * @return {RegExpBuilder} the current instance for methode chaining
		 * @throws {Error} if a group is closed with no open group
		 */
		endGroup: function() {
			_popValidationCheck(_OPEN_GROUP);
			_add(")");
			return this;
		},
		
		startLookAheadFor: function(sText) {
			_startlookAhead(false);
			return this;
		},
		
		endLookAhead: function() {
			_endLookAhead();
			return this;
		},
		
		startNegatedLookAhead: function() {
			_startlookAhead(true);
			return this;
		},
		
		endNegatedLookAhead: function() {
			_endLookAhead();
			return this;
		},
		
		useGroup: function(iGroupNumber) {
			_add("\\" + iGroupNumber);
			return this;
		},
		
		
		//######### Other #########
		
		withNotGreedy: function() {
			_add("?");
			return this;
		},
		
		or: function() {
			_add("|");
			return this;
		},
		
		toString: function() {
			return _sRegExpPattern;
		},
		
		clear: function() {
			_sRegExpPattern = "";
			_validationStack = [];
		},

		build: function() {
			if(_validationStack.length !== 0) {
				throw new Error(_validationStack[_validationStack.length -1].endMissing);
			}
			return new RegExp(_sRegExpPattern);
		}
  }
}