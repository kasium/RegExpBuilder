/**
 * A simple helper class which wraps all regex symbols into methods. Because of method chaining it
 * is possible to generate more robust and better readable regex code
 * 
 * @constructor RegExpBuilder
 * @public
 * @param {object}
 *            [oConfig] a config object which configures this instance
 * @param {boolean}[oConfig.groupValidation=true]
 *            turns the validation on or off. If true then it's validated that all groups (regex
 *            groups and lookaheads ) are closed. It also validates that no endGroup statement can
 *            exist without an openGroup statement
 * @param {boolean}[oConfig.wrapInsideGroup=false]
 *            wraps the whole generated regex pattern inside a group
 * @author Kai Mueller
 * @version 0.2.0
 */

function RegExpBuilder(oConfig) {
	// internal ideas:
	// * add default not greedy attribute
	// * add pattern possiblity
	// * add simpler methods like matchesDigit

	"use strict";

	// configuration
	if (!oConfig) {
		oConfig = {};
	}
	oConfig.groupValidation = !_isNaB(oConfig.groupValidation) ? oConfig.groupValidation : true;
	oConfig.wrapInsideGroup = !_isNaB(oConfig.wrapInsideGroup) ? oConfig.wrapInsideGroup : false;

	// internal variables
	var _sRegExpPattern = "";
	var _aRegexCharacters = [ "(", ")", "/", ".", "*", "?", "+", "$", "^", "=", "!" ];
	var _validationStack = [];

	// internal constants
	var _OPEN_GROUP = {
		beginMissing : "Before closing a group you must open one",
		endMissing : "Missing end group statement"
	};
	var _OPEN_LOOK_AHEAD = {
		beginMissing : "Before closing a look ahead you must open one",
		endMissing : "Missing open look ahaed group statement"
	};

	function _isNaB(value) {
		return typeof (value) !== 'boolean';
	}

	// adds a text to the internal pattern
	function _add(sText) {
		_sRegExpPattern = _sRegExpPattern + sText;
	}

	// pops a expetctet entry from the validation stack
	function _popValidationCheck(sExpectetStackEntry) {
		var entry = _validationStack[_validationStack.length - 1];
		if (entry !== sExpectetStackEntry) {
			if (oConfig.groupValidation) {
				throw new Error(sExpectetStackEntry.beginMissing);
			}
		}
		_validationStack.pop();
	}

	// start a lookahead either negatet or not
	function _startlookAhead(bNegate) {
		_validationStack.push(_OPEN_LOOK_AHEAD);
		var sSign = "=";
		if (bNegate) {
			sSign = "!";
		}
		_add("(?" + sSign);
	}

	// ends a lookAhead
	function _endLookAhead() {
		_popValidationCheck(_OPEN_LOOK_AHEAD);
		_add(")");
	}

	// escapes all regex characters in a string
	function _escape(sText) {
		var aChars = sText.split("");
		aChars.forEach(function(sChar, iIndex) {
			if (_aRegexCharacters.indexOf(sChar) !== -1) {
				aChars[iIndex] = "\\" + sChar;
			}
		});
		return aChars.join("");
	}

	// converts a regexp to a strin without wrapping '/'
	function _regExpToString(oRegExp) {
		if (!oRegExp || !oRegExp instanceof RegExp) {
			throw new Error("The overgiven parameter is undefined, null, or not a instance of RegExp");
		}
		return oRegExp.toString().substring(1, oRegExp.toString().length - 1);
	}

	return {
		/** @lends RegExpBuilder.prototype */

		// ######### matches #########
		/**
		 * Adds a free text to a pattern. Free means no escaping is done, so it is possible to use
		 * regex symbols here.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @param {string}
		 *            sText text to add
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesFreeText : function(sText) {
			_add(sText);
			return this;
		},

		/**
		 * Adds the whole regex pattern of a RegExp to the current pattern.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @param {RegExp}
		 *            oRegExp the RegExp to add
		 * @return {RegExpBuilder} the current an instance for method chaining
		 * @throws {Error}
		 *             if oRegExp is not a instance of RegExp
		 */
		matchesRegExp : function(oRegExp) {
			_add(_regExpToString(oRegExp));
			return this;
		},

		/**
		 * Adds a matcher for any character except the line break. This is equivalent to the regex
		 * symbol '.'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-dot}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesAny : function() {
			_add(".");
			return this;
		},

		/**
		 * Adds a matcher for a list of possible characters. It is possible to provide a range with
		 * a '-' This is equivalent to the regex function '[]'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-character-set}
		 * @param {string}
		 *            sCharacters a list of the characters to match
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesFor : function(sCharacters) {
			_add("[" + sCharacters + "]");
			return this;
		},

		/**
		 * Adds a negative matcher for a list of possible characters. It is possible to provide a
		 * range with a '-' This is equivalent to the regex function '[^]'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-character-set}
		 * @param {string}
		 *            sCharacters a list of the characters not to match
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNotFor : function(sCharacters) {
			_add("[^" + sCharacters + "]");
			return this;
		},

		/**
		 * Adds a matcher for this text. All characters which are used internally by regex will be
		 * escaped
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @param {string}
		 *            sText text to match
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesText : function(sText) {
			if (sText.length < 2) {
				_add(_escape(sText));
			} else {
				_add("(" + _escape(sText) + ")");
			}
			return this;
		},

		// ######### How many times #########

		/**
		 * After a matcher, this specifies how many times the matcher should match. It is possible
		 * to define a minimum and a maximum or an exact number This is equivalent to the regex
		 * function '{x,x}' or '{x}' where x is an integer
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-quantifier-range}
		 * @param {int}
		 *            iMin minimum times to match or without the parameters iMax exact how often
		 * @param {int}
		 *            iMax (optional) maximum times to match
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesTimes : function(iMin, iMax) {
			if (iMax) {
				_add("{" + iMin + "," + iMax + "}");
			} else {
				_add("{" + iMin + "}");
			}
			return this;
		},

		/**
		 * After a matcher, this specifies that the matcher should match one or more times. This is
		 * equivalent to the regex function '+'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-plus}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		oneOrMoreTimes : function(sText) {
			_add("+");
			return this;
		},

		/**
		 * After a matcher, this specifies that the matcher should match zero or more times. This is
		 * equivalent to the regex function '*'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-asterisk}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		zeroOrMoreTimes : function() {
			_add("*");
			return this;
		},

		/**
		 * After a matcher, this specifies that the matcher should match zero or one times. This is
		 * equivalent to the regex function '?'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-questionmark}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		zeroOrOneTimes : function(sText) {
			_add("?");
			return this;
		},

		// ######### Control Signs #########

		/**
		 * Adds a matcher of a word boundary. This is equivalent to the regex function '\\b'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-word-boundary}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesWordBoundary : function() {
			_add("\\b");
			return this;
		},

		/**
		 * Adds a matcher of a non-word boundary. This is equivalent to the regex function '\\B'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-non-word-boundary}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNotWordBoundary : function() {
			_add("\\B");
			return this;
		},

		/**
		 * Adds a matcher for the beginning of the input. This is equivalent to the regex function
		 * '^'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-caret}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		beginLine : function() {
			_add("^");
			return this;
		},

		/**
		 * Adds a matcher for the end of the input. This is equivalent to the regex function '$'
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-dollar}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		endLine : function() {
			_add("$");
			return this;
		},

		// ######### Groups #########

		/**
		 * Begins a new group. This is equivalent to the regex function '('.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-capturing-parentheses}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		beginGroup : function() {
			_validationStack.push(_OPEN_GROUP);
			_add("(");
			return this;
		},

		/**
		 * Ends a group. A validation is done if a corresponding open group exists if
		 * groupValidation is turned on. This is equivalent to the regex function '('.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-capturing-parentheses}
		 * @return {RegExpBuilder} the current instance for method chaining
		 * @throws {Error}
		 *             if a group is closed with no open group and the corresponding attribute in
		 *             the config is set to true
		 */
		endGroup : function() {
			_popValidationCheck(_OPEN_GROUP);
			_add(")");
			return this;
		},

		/**
		 * Starts a look ahead. This is equivalent to the regex function '(?='.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-lookahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		startLookAheadFor : function() {
			_startlookAhead(false);
			return this;
		},

		/**
		 * Alias for {@link RegExpBuilder#startLookAheadFor|startLookAheadFor}
		 * 
		 * @function
		 * @since 0.2.0
		 * @memberof RegExpBuilder.prototype
		 */
		ifFollowedBy : function() {
			this.startLookAheadFor.apply(this, arguments);
		},

		/**
		 * Ends a look ahead.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-lookahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		endLookAhead : function() {
			_endLookAhead();
			return this;
		},

		// assuming that endLookAhead and endNegatedLookAhead doing the same
		/**
		 * Alias for {@link RegExpBuilder#endLookAhead|endLookAhead} and
		 * {@link RegExpBuilder#endNegatedLookAhead|endNegatedLookAhead}
		 * 
		 * @function
		 * @since 0.2.0
		 * @memberof RegExpBuilder.prototype
		 */
		match : function() {
			this.endLookAhead.apply(this, arguments);
		},
		/**
		 * Starts a negated look ahead. This is equivalent to the regex function '(?!'.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-look-ahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		startNegatedLookAhead : function() {
			_startlookAhead(true);
			return this;
		},

		/**
		 * Alias for {@link RegExpBuilder#startNegatedLookAhead|startNegatedLookAhead}
		 * 
		 * @function
		 * @since 0.2.0
		 * @memberof RegExpBuilder.prototype
		 */
		ifNotFollwedBy : function() {
			this.startNegatedLookAhead.apply(this, arguments);
		},

		/**
		 * Ends a negated look ahead.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-look-ahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		endNegatedLookAhead : function() {
			_endLookAhead();
			return this;
		},

		/**
		 * Adds a matcher for the group with the specified group number. No validation is done if
		 * this group exists. This is equivalent to the regex function '\\x', where x is a group
		 * number
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @param {integer}
		 *            iGroupNumber the group number
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		useGroup : function(iGroupNumber) {
			_add("\\" + iGroupNumber);
			return this;
		},

		// ######### Other #########

		/**
		 * Sets the matcher before to not greedy mode.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-questionmark}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		withNotGreedy : function() {
			_add("?");
			return this;
		},

		/**
		 * Adds an or. This is equivalent to the regex function '|'.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-or}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		or : function() {
			_add("|");
			return this;
		},

		/**
		 * Returns the internal representation of the regex pattern as a string without wrapping
		 * '/'. The config attribute 'wrapInsideGroup' has here no effect.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @return {string} the internal regex pattern as a string
		 */
		toString : function() {
			return _sRegExpPattern;
		},

		/**
		 * Clears all internal fields so after this methods is called the regex pattern is ''.
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @return {void}
		 */
		clear : function() {
			_sRegExpPattern = "";
			_validationStack = [];
		},

		/**
		 * Returns a new RegExp which matches exact the regex pattern which was build with the
		 * methods of this class. A validation for not closed groups is done if the config attribute
		 * 'groupValidation' is set to true
		 * 
		 * @public
		 * @since 0.1.0
		 * @memberof RegExpBuilder.prototype
		 * @return {RegExp} a new RegExp which matches the build pattern
		 * @throws {Error}
		 *             if open groups existing and the corresponding config attribute is set
		 */
		build : function() {
			if (oConfig.groupValidation && _validationStack.length !== 0) {
				throw new Error(_validationStack[_validationStack.length - 1].endMissing);
			}
			if (oConfig.wrapInsideGroup) {
				return new RegExp("(" + _sRegExpPattern + ")");
			}
			return new RegExp(_sRegExpPattern);
		}
	};
}