(function(window) {

	"use strict";

	var _aRegexCharacters = ["(", ")", "/", ".", "*", "?", "+", "$", "^", "=", "!"];
	var _oDefaultValues = {
		groupValidation: [true, _isBool, "boolean"],
		wrapInsideGroup: [false, _isBool, "boolean"],
		wrapTextInsideGroup: [false, _isBool, "boolean"],
		flags: [[], _isArray, "Array"]
	};
	var _OPEN_GROUP = {
		beginMissing: "Before closing a group you must open one",
		endMissing: "Missing end group statement"
	};
	var _OPEN_LOOK_AHEAD = {
		beginMissing: "Before closing a look ahead you must open one",
		endMissing: "Missing open look ahaed group statement"
	};

	var _oConstants = {
		FLAG_GLOBAL: "g",
		FLAG_CASE_INSENITIVE: "i",
		FLAG_MULTI_LINE: "m",
		FLAG_STICKY: "y",
	};

	function _loadConfiguration(oConfiguration, oStandardValues) {
		if (!oConfiguration) {
			oConfiguration = {};
		}
		oConfiguration = _clone(oConfiguration);
		var oNewConfig = {};
		Object.keys(oStandardValues).forEach(function(sAttributeName) {
			var vAttributeValue = oConfiguration[sAttributeName];
			var aDefault = oStandardValues[sAttributeName];
			if(aDefault[1](vAttributeValue)) {
				oNewConfig[sAttributeName] = vAttributeValue;
			} else {
				oNewConfig[sAttributeName] = aDefault[0];
				if(vAttributeValue !== undefined && vAttributeValue !== null) {
					window.console.warn("Found wrong type for property " + sAttributeName + ". Expected " + aDefault[2] + " but found " + typeof(vAttributeValue));
				}
			}
			delete oConfiguration[sAttributeName];

		});
		if(Object.keys(oConfiguration).length !== 0) {
			Object.keys(oConfiguration).forEach(function(sPropertyName) {
				window.console.warn("Found illegal propertry " + sPropertyName + " inside the configuration object");
			});
		}
		return oNewConfig;
	}

	function _isBool(value) {
		return typeof (value) == "boolean";
	}

	function _isArray(value) {
		return value instanceof Array;
	}

	function _regExpToString(oRegExp) {
		if (!oRegExp || oRegExp instanceof RegExp === false) {
			throw new RegExpBuilderException("The overgiven parameter is undefined, null, or not a instance of RegExp");
		}
		return oRegExp.toString().substring(1, oRegExp.toString().length - 1);
	}

	// Array Remove - By John Resig (MIT Licensed)
	// Modified by Kai Mueller (MIT Licensed)
	function _removeFromArray(aArray, iFrom, iTo) {
		var rest = aArray.slice((iTo || iFrom) + 1 || aArray.length);
		aArray.length = iFrom < 0 ? aArray.length + iFrom : iFrom;
		return aArray.push.apply(aArray, rest);
	}

	function _escape(sText) {
		var aChars = sText.split("");
		aChars.forEach(function(sChar, iIndex) {
			if (_aRegexCharacters.indexOf(sChar) !== -1) {
				aChars[iIndex] = "\\" + sChar;
			}
		});
		return aChars.join("");
	}

	function _convertFlags(vFlags, aFlags) {
		var sFlags = aFlags.join("");
		var aNewFlags = [];
		if ( typeof (vFlags) === "string") {
			aNewFlags = vFlags.split("");
		} else if ( vFlags instanceof Array) {
			aNewFlags = vFlags;
		}

		aNewFlags.forEach(function(sChar) {
			if (sFlags.indexOf(sChar) === -1) {
				sFlags += sChar;
			}
		});
		return sFlags;
	}

	function _clone(vAny) {
		if ( typeof (vAny) === 'function')
			return vAny;
		if ( vAny instanceof Array) {
			return vAny.slice(0);
		}
		if (vAny == null || typeof (vAny) !== "object")
			return vAny;
		function tempConstructor() {
		};
		tempConstructor.prototype = vAny;
		var oTempObject = new tempConstructor;
		for (var key in vAny)
		oTempObject[key] = _clone(vAny[key]);
		return oTempObject;
	}

	/**
	 * A simple helper class which wraps all regex symbols into methods. Because of method chaining it is possible to
	 * generate more robust and better readable regex code
	 *
	 * @constructor RegExpBuilder
	 * @public
	 * @param {object}
	 *            [oConfig] a config object which configures this instance
	 * @param {boolean}[oConfig.groupValidation=true]
	 *            turns the validation on or off. If true then it's validated that all groups (regex groups and lookaheads )
	 *            are closed. It also validates that no endGroup statement can exist without an openGroup statement
	 * @param {boolean}[oConfig.wrapInsideGroup=false]
	 *            wraps the whole generated regex pattern inside a group
	 * @param {boolean}[oConfig.wrapTextInsideGroup=false]
	 *            wraps the output of the {@link RegExpBuilder#matchesText|matchesText method} everytime inside a group
	 * @param {array}[oConfig.flags=[]]
	 *            Adds {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-backspace|regex flags} to the builder.
	 * 			  No validation is done
	 * @author Kai Mueller
	 * @version 0.6.0
	 */
	window.RegExpBuilder = function(oConfig) {
		if (!(this instanceof RegExpBuilder)) {
			throw new Error("please call with new");
		}
		this._sRegExpPattern = "";
		this._validationStack = [];
		this._aAliasList = [];
		this._oConfig = _loadConfiguration(oConfig, _oDefaultValues);
		return this;
	};

	//TODO jsdoc
	Object.keys(_oConstants).forEach(function(sConstantName) {
		Object.defineProperty(window.RegExpBuilder, sConstantName, {
			value: _oConstants[sConstantName],
			writable: false,
			enumerable: false,
			configurable: false
		});
	});

	RegExpBuilder.prototype = {

		/**
		 * Adds a text to the internal pattern
		 *
		 * @private
		 * @since 0.1.0
		 * @param {string} sText the text to add to the internal patterm
		 */
		_add: function(sText) {
			this._sRegExpPattern += sText;
		},

		/**
		 * Pops an object from the validation stack. Before it performs a check if the entry to pop is the expected entry. If not, an error is thrown.
		 *
		 * @private
		 * @since 0.1.0
		 * @param {object} oExpectetStackEntry the expected entry
		 * @throws {RegExpBuilderException} if the current top of the stack doesn't match the expected entry
		 */
		_popValidationCheck: function(oExpectetStackEntry) {
			var entry = this._validationStack[this._validationStack.length - 1];
			if (entry !== oExpectetStackEntry) {
				if (this._oConfig.groupValidation) {
					throw new RegExpBuilderException(oExpectetStackEntry.beginMissing);
				}
			}
			this._validationStack.pop();
		},

		/**
		 * Begins a look ahwad
		 *
		 * @private
		 * @since 0.1.0
		 * @param {boolean} specifies if a positiv or negative look ahead
		 */
		_startLookAhead: function(bNegate) {
			var sSign = "=";
			this._validationStack.push(_OPEN_LOOK_AHEAD);
			if (bNegate) {
				sSign = "!";
			}
			this._add("(?" + sSign);
		},

		/**
		 * Ends a look ahead
		 *
		 * @private
		 * @since 0.1.0
		 */
		_endLookAhead: function() {
			this._popValidationCheck(_OPEN_LOOK_AHEAD);
			this._add(")");
		},

		/**
		 * Starts a group
		 *
		 * @private
		 * @since 0.1.0
		 * @param {boolean} specifies if a captures or not
		 */
		_startGroup: function(bCaptured) {
			var sSign = "";
			this._validationStack.push(_OPEN_GROUP);
			if (!bCaptured) {
				sSign = "?:";
			}
			this._add("(" + sSign);
		},

		/**
		 * Ends a group
		 *
		 * @private
		 * @since 0.1.0
		 */
		_endGroup: function() {
			this._popValidationCheck(_OPEN_GROUP);
			this._add(")");
		},

		// ######### matches #########

		/**
		 * Adds a matcher to the pattern. Possible is text which will be escaped, an instance of RegExp or RegExpBuilder.
		 *
		 * @public
		 * @since 0.6.0
		 * @param {string|RegExp|RegExpBuilder}
		 *            vVar the object to add
		 * @return {RegExpBuilder} the current instance for method chaining
		 * @throws {RegExpBuilderException} if an illegal argument was overgiven
		 */
		matches: function(vVar) {
			if(vVar instanceof RegExp) {
				this.matchesRegExp(vVar);
			}
			else if(vVar instanceof RegExpBuilder) {
				this.matchesBuilder(vVar);
			}
			else if(typeof(vVar) === "string") {
				this.matchesText(vVar);
			}
			else {
				throw new RegExpBuilderException("Illegal argument of type " + typeof(vVar));
			}
			return this;
		},

		/**
		 * Adds a free text to a pattern. Free means no escaping is done, so it is possible to use regex symbols here.
		 *
		 * @public
		 * @since 0.1.0
		 * @param {string}
		 *            sText text to add
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesFreeText: function(sText) {
			this._add(sText);
			return this;
		},

		/**
		 * Adds the whole regex pattern of a RegExp to the current pattern.
		 * WARNING: this will not be wraped into a group
		 *
		 * @public
		 * @since 0.1.0
		 * @param {RegExp}
		 *            oRegExp the RegExp to add
		 * @return {RegExpBuilder} the current an instance for method chaining
		 * @throws {RegExpBuilderException}
		 *             if oRegExp is not a instance of RegExp
		 * @Deprecated use 'matches' instead
		 */
		matchesRegExp: function(oRegExp) {
			this._add(_regExpToString(oRegExp));
			return this;
		},

		/**
		 * Adds the builded regex pattern of a regExpBuilder to the current pattern. Internally the build method of the
		 * parameter is called.
		 * WARNING: this will not be wraped into a group if the build method of the parameter will not do it
		 *
		 * @public
		 * @since 0.3.0
		 * @param {RegExpBuilder}
		 *            oRegExpBuilder the RegExpBuilder instance to add
		 * @return {RegExpBuilder} the current an instance for method chaining *
		 * @throws {RegExpBuilderException}
		 *             if oRegExpBuilder is not a instance of RegExpBuilder
		 * @Deprecated use 'matches' instead
		 */
		matchesBuilder: function(oRegExpBuilder) {
			if (!oRegExpBuilder || oRegExpBuilder instanceof RegExpBuilder === false) {
				throw new RegExpBuilderException("The overgiven object is undefined, null or not an instance of RegExpBuilder");
			}
			this.matchesRegExp(oRegExpBuilder.build());
			return this;
		},

		/**
		 * Adds a matcher for any character except the line break. This is equivalent to the regex symbol '.'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-dot}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesAny: function() {
			this._add(".");
			return this;
		},

		/**
		 * Adds a matcher for a list of possible characters. It is possible to provide a range with a '-' This is equivalent
		 * to the regex function '[]'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-character-set}
		 * @param {string}
		 *            sCharacters a list of the characters to match
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesFor: function(sCharacters) {
			this._add("[" + sCharacters + "]");
			return this;
		},

		/**
		 * Alias for {@link RegExpBuilder#matchesFor|matchesFor}
		 *
		 * @since 0.5.0

		 */
		matchesOneOf: function() {
			this.matchesFor.apply(this, arguments);
			return this;
		},

		/**
		 * Adds a matcher for any digit. So it matches 0 to 9. This is equivalent to the regex function '[0-9]' or '\d'
		 *
		 * @public
		 * @since 0.4.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-character-set}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesDigit: function() {
			//here we can also use \d
			return this.matchesFor("0-9");
		},

		/**
		 * Adds a matcher for a non-digit. This is equivalent to the regex function '[^0-9]' or '\D'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-character-set}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNonDigit: function() {
			//here we can also use \D
			return this.matchesNotFor("0-9");
		},

		/**
		 * Adds a matcher for a form feed. This is equivalent to the regex function '\f'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-form-feed }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesFormFeed: function() {
			this._add("\\f");
			return this;
		},

		/**
		 * Adds a matcher for a line feed. This is equivalent to the regex function '\n'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-line-feed }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesLineFeed: function() {
			this._add("\\n");
			return this;
		},

		/**
		 * Adds a matcher for a carriage return. This is equivalent to the regex function '\r'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-carriage-return }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesCarriageReturn: function() {
			this._add("\\r");
			return this;
		},

		/**
		 * Adds a matcher for a single whitespace. This is equivalent to the regex function '\s'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-white-space }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesWhiteSpace: function() {
			this._add("\\s");
			return this;
		},

		/**
		 * Adds a matcher for non whitespace. This is equivalent to the regex function '\S'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-non-white-space }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNotWhiteSpace: function() {
			this._add("\\S");
			return this;
		},

		/**
		 * Adds a matcher for a tab. This is equivalent to the regex function '\t'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-tab }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesTab: function() {
			this._add("\\t");
			return this;
		},

		/**
		 * Adds a matcher for vertical tab. This is equivalent to the regex function '\v'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-vertical-tab }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesVerticalTab: function() {
			this._add("\\v");
			return this;
		},

		/**
		 * Adds a matcher for an alphanumeric character. This is equivalent to the regex function '\w'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-word }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesAlphanumeric: function() {
			this._add("\\w");
			return this;
		},

		/**
		 * Adds a matcher for a non alphanumeric character. This is equivalent to the regex function '\W'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-non-word }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNonAlphanumeric: function() {
			this._add("\\W");
			return this;
		},

		/**
		 * Adds a matcher for a NULL character. This is equivalent to the regex function '\0'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-null }
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNull: function() {
			this._add("\\0");
			return this;
		},

		/**
		 * Adds a matcher for any alphabetical letter. So it matches a to z and A to Z. This is equivalent to the regex
		 * function '[a-zA-Z]'
		 *
		 * @public
		 * @since 0.4.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-character-set}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesLetter: function() {
			return this.matchesFor("a-zA-Z");
		},

		/**
		 * Adds a matcher for any alphabetical uppercase letter. So it matches A to Z. This is equivalent to the regex
		 * function '[A-Z]'
		 *
		 * @public
		 * @since 0.4.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-character-set}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesUppercaseLetter: function() {
			return this.matchesFor("A-Z");
		},

		/**
		 * Adds a matcher for any alphabetical lowercase letter. So it matches a to z. This is equivalent to the regex
		 * function '[a-z]'
		 *
		 * @public
		 * @since 0.4.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-character-set}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesLowercaseLetter: function() {
			return this.matchesFor("a-z");
		},

		/**
		 * Adds a matcher for a backspace. This is equivalent to the regex function '[\b]'
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-backspace}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesBackspace: function() {
			this._add("[\\b]");
			return this;
		},

		/**
		 * Adds a negative matcher for a list of possible characters. It is possible to provide a range with a '-' This is
		 * equivalent to the regex function '[^]'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-character-set}
		 * @param {string}
		 *            sCharacters a list of the characters not to match
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNotFor: function(sCharacters) {
			this._add("[^" + sCharacters + "]");
			return this;
		},

		/**
		 * Alias for {@link RegExpBuilder#matchesNotFor|matchesNotFor}
		 *
		 * @since 0.5.0

		 */
		matchesNotOneOf: function() {
			this.matchesNotFor.apply(this, arguments);
			return this;
		},

		/**
		 * Adds a matcher for this text. All characters which are used internally by regex will be escaped. If the config
		 * attribute wrapTextInsideGroup is true than this will generare a new regex group with the text inside. Else it
		 * using non-capturing parentheses.
		 *
		 * @public
		 * @since 0.1.0
		 * @param {string}
		 *            sText text to match
		 * @param {boolean}
		 * 			  [bGroup=false] defines of the text should be group inside a captured group
		 * @return {RegExpBuilder} the current instance for method chaining
		 * @Deprecated use 'matches' instead
		 */
		matchesText: function(sText, bGroup) {
			if (sText.length !== 0) {
				if (this._oConfig.wrapTextInsideGroup || bGroup) {
					this._add("(" + _escape(sText) + ")");
				} else if (sText.length === 1) {
					this._add(_escape(sText));
				} else {
					this._add("(?:" + _escape(sText) + ")");
				}
			}
			return this;
		},

		// ######### How many times #########

		/**
		 * After a matcher, this specifies how many times the matcher should match. It is possible to define a minimum and a
		 * maximum or an exact number This is equivalent to the regex function '{x,x}' or '{x}' where x is an integer
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-quantifier-range}
		 * @param {int}
		 *            iMin minimum times to match or without the parameters iMax exact how often
		 * @param {int}
		 *            iMax (optional) maximum times to match
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesTimes: function(iMin, iMax) {
			if (iMax) {
				this._add("{" + iMin + "," + iMax + "}");
			} else {
				this._add("{" + iMin + "}");
			}
			return this;
		},

		/**
		 * Alias for {@link RegExpBuilder#matchesTimes|matchesTimes}
		 *
		 * @since 0.3.0

		 */
		withConstraint: function() {
			this.matchesTimes.apply(this, arguments);
			return this;
		},

		/**
		 * After a matcher, this specifies that the matcher should match one or more times. This is equivalent to the regex
		 * function '+'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-plus}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		oneOrMoreTimes: function() {
			this._add("+");
			return this;
		},

		/**
		 * After a matcher, this specifies that the matcher should match zero or more times. This is equivalent to the regex
		 * function '*'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-asterisk}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		zeroOrMoreTimes: function() {
			this._add("*");
			return this;
		},

		/**
		 * After a matcher, this specifies that the matcher should match zero or one times. This is equivalent to the regex
		 * function '?'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-questionmark}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		zeroOrOneTimes: function() {
			this._add("?");
			return this;
		},

		// ######### Control Signs #########

		/**
		 * Adds a matcher of a word boundary. This is equivalent to the regex function '\\b'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-word-boundary}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesWordBoundary: function() {
			this._add("\\b");
			return this;
		},

		/**
		 * Adds a matcher of a non-word boundary. This is equivalent to the regex function '\\B'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-non-word-boundary}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		matchesNotWordBoundary: function() {
			this._add("\\B");
			return this;
		},

		/**
		 * Adds a matcher for the beginning of the input. This is equivalent to the regex function '^'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-caret}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		beginLine: function() {
			this._add("^");
			return this;
		},

		/**
		 * Adds a matcher for the end of the input. This is equivalent to the regex function '$'
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-dollar}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		endLine: function() {
			this._add("$");
			return this;
		},

		// ######### Groups #########

		/**
		 * Begins a new group. This is equivalent to the regex function '('.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-capturing-parentheses}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		beginGroup: function() {
			this._startGroup(true);
			return this;
		},

		/**
		 * Ends a group. A validation is done if a corresponding open group exists if groupValidation is turned on. This is
		 * equivalent to the regex function ')'.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-capturing-parentheses}
		 * @return {RegExpBuilder} the current instance for method chaining
		 * @throws {RegExpBuilderException}
		 *             if a group is closed with no open group and the corresponding attribute in the config is set to true
		 */
		endGroup: function() {
			this._endGroup();
			return this;
		},

		/**
		 * Begins a new non captured group. This is equivalent to the regex function '(?:'.
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-non-capturing-parentheses}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		beginNonCapturedGroup: function() {
			this._startGroup(false);
			return this;
		},

		/**
		 * Ends a non captured group. A validation is done if a corresponding open group exists if groupValidation is turned
		 * on. This is equivalent to the regex function ')'.
		 *
		 * @public
		 * @since 0.5.0
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-non-capturing-parentheses}
		 * @return {RegExpBuilder} the current instance for method chaining
		 * @throws {RegExpBuilderException}
		 *             if a group is closed with no open group and the corresponding attribute in the config is set to true
		 */
		endNonCapturedGroup: function() {
			this._endGroup();
			return this;
		},

		/**
		 * Starts a look ahead. This is equivalent to the regex function '(?='.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-lookahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		startLookAheadFor: function() {
			this._startLookAhead(false);
			return this;
		},

		/**
		 * Alias for {@link RegExpBuilder#startLookAheadFor|startLookAheadFor}
		 *
		 * @since 0.2.0

		 */
		ifFollowedBy: function() {
			this.startLookAheadFor.apply(this, arguments);
			return this;
		},

		/**
		 * Ends a look ahead.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-lookahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		endLookAhead: function() {
			this._endLookAhead();
			return this;
		},

		// assuming that endLookAhead and endNegatedLookAhead doing the same
		/**
		 * Alias for {@link RegExpBuilder#endLookAhead|endLookAhead} and
		 * {@link RegExpBuilder#endNegatedLookAhead|endNegatedLookAhead}
		 *
		 * @since 0.2.0

		 */
		match: function() {
			this.endLookAhead.apply(this, arguments);
			return this;
		},

		/**
		 * Starts a negated look ahead. This is equivalent to the regex function '(?!'.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-look-ahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		startNegatedLookAhead: function() {
			this._startLookAhead(true);
			return this;
		},

		/**
		 * Alias for {@link RegExpBuilder#startNegatedLookAhead|startNegatedLookAhead}
		 * @since 0.2.0

		 */
		ifNotFollwedBy: function() {
			this.startNegatedLookAhead.apply(this, arguments);
			return this;
		},

		/**
		 * Ends a negated look ahead.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-negated-look-ahead}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		endNegatedLookAhead: function() {
			this._endLookAhead();
			return this;
		},

		/**
		 * Adds a matcher for the group with the specified group number. No validation is done if this group exists. This is
		 * equivalent to the regex function '\\x', where x is a group number
		 *
		 * @public
		 * @since 0.1.0
		 * @param {integer}
		 *            iGroupNumber the group number
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		useGroup: function(iGroupNumber) {
			this._add("\\" + iGroupNumber);
			return this;
		},

		// ######### Other #########

		/**
		 * Sets the matcher before to not greedy mode.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-questionmark}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		withNotGreedy: function() {
			this._add("?");
			return this;
		},

		/**
		 * Adds an or. This is equivalent to the regex function '|'.
		 *
		 * @public
		 * @since 0.1.0
		 * @see {@link  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-or}
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		or: function() {
			this._add("|");
			return this;
		},

		/**
		 * This method has no impact to the pattern of this instance. It is only for better readabillity. <br/>
		 * <p>
		 * <i>matchesText("abc").and().matchesText("def")</i>
		 * </p>
		 * has the same impact as
		 * <p>
		 * <i>matchesText("abc").matchesText("def")</i>
		 * </p>
		 *
		 * @public
		 * @since 0.3.0
		 * @return {RegExpBuilder} the current instance for method chaining
		 */
		and: function() {
			return this;
		},

		// ######### object methods #########

		/**
		 * Adds an alias for an existing method. This is useful to provide more readablillity-
		 *
		 * @public
		 * @since 0.3.0
		 * @param {string}
		 *            sMethodName the method name of the method of which one an alias shoule be created
		 * @param {string}
		 *            sAliasName the name of the alias method
		 * @throws {RegExpBuilderException}
		 *             if the method for the alias not exists or the name of the alias is used by somebody other
		 */
		addAlias: function(sMethodName, sAliasName) {
			if ( typeof (this[sMethodName]) !== "function") {
				throw new RegExpBuilderException("A method with the name " + sMethodName + " don't exists");
			}
			if (!sAliasName) {
				throw new RegExpBuilderException("The alias name must be defined");
			}
			if (this[sAliasName]) {
				throw new RegExpBuilderException("A " + typeof (this[sAliasName]) + " with the name " + sAliasName + " allready exists");
			}
			this[sAliasName] = this[sMethodName];
			this._aAliasList.push({
				methodName: sMethodName,
				aliasName: sAliasName
			});
		},

		/**
		 * Deletes an alias.
		 *
		 * @public
		 * @since 0.4.0
		 * @param {string}
		 *            sAliasName the name of the alias method
		 * @returns {boolean} if a method to delete was found it returns true, false if not
		 */
		deleteAlias: function(sAliasName) {
			var bFound = false;
			var iFoundElementIndex = 0;
			this._aAliasList.forEach(function(oAlias, iIndex) {
				if (oAlias.aliasName === sAliasName) {
					bFound = true;
					iFoundElementIndex = iIndex;
				}
			});
			if (bFound) {
				delete this[sAliasName];
				_removeFromArray(this._aAliasList, iFoundElementIndex);
			}
			return bFound;
		},

		/**
		 * Return all alias as an array with objects. The objects have two attributes: 'methodName',
		 * the name of the original method and 'aliasName', the name of the alias method
		 *
		 * @public
		 * @since 0.6.0
		 * @return {array} a list of all alias
		 */
		getAliasList: function() {
			return this._aAliasList;
		},

		/**
		 * Clones the actual instance including all internal fields and all 'alias' methods
		 *
		 * @public
		 * @since 0.5.0
		 * @return {RegExpBuilder} a clone of this instance
		 */
		clone: function() {
			return _clone(this);
		},

		/**
		 * Returns the internal representation of the regex pattern as a string without wrapping '/'. The config attribute
		 * 'wrapInsideGroup' has here no effect.
		 *
		 * @public
		 * @since 0.1.0
		 * @return {string} the internal regex pattern as a string
		 */
		toString: function() {
			return this._sRegExpPattern;
		},

		/**
		 * Returns the configuration of this instance. Refer for the single attributes the parameter 'oConfig' of the
		 * constructor
		 *
		 * @public
		 * @since 0.3.0
		 * @return {object} the current configuration object
		 */
		getConfiguration: function() {
			return this._oConfig;
		},

		/**
		 * Clears all internal fields so after this methods is called the regex pattern is ''.
		 *
		 * @public
		 * @since 0.1.0
		 * @return {void}
		 */
		clear: function() {
			this._sRegExpPattern = "";
			this._validationStack = [];
		},

		/**
		 * Returns a new RegExp which matches exact the regex pattern which was build with the methods of this class. A
		 * validation for not closed groups is done if the config attribute 'groupValidation' is set to true. After this
		 * method was called, this instance shouldn't be used furthermore for regex building, becuase this can produces
		 * unexpectet regex pattern.
		 *
		 * @public
		 * @since 0.1.0
		 * @param {string|array} [vFlags]
		 * 			an array or a string which specifies the flags to build. No validation is done.
		 * 			Also the flags specified in the constructor are added.
		 * @return {RegExp} a new RegExp which matches the build pattern
		 * @throws {RegExpBuilderException}
		 *             if open groups existing and the corresponding config attribute is set
		 * @throws {SytaxError}
		 *             if something is wrong with the regex. This is thrown by the RegExp object
		 */
		build: function(vFlags) {
			var sFlags = _convertFlags(vFlags, this._oConfig.flags);
			if (this._oConfig.groupValidation && this._validationStack.length !== 0) {
				throw new RegExpBuilderException(this._validationStack[this._validationStack.length - 1].endMissing);
			}
			if (this._oConfig.wrapInsideGroup) {
				this._sRegExpPattern = "(" + this._sRegExpPattern + ")";
			}
			return new RegExp(this._sRegExpPattern, sFlags);
		}
	};

})(window);

/**
 * Custom exception for the RegExpBuilder
 *
 * @public
 * @param {string}
 *            sMessage the message of the exception
 * @version 1.0.0
 * @author Kai Mueller
 * @constructor RegExpBuilderException
 */
function RegExpBuilderException(sMessage) {
	this.message = sMessage;
	this.stack = (new Error()).stack;
}

RegExpBuilderException.prototype = Object.create(Error.prototype);
RegExpBuilderException.prototype.name = "RegExpBuilderException";
RegExpBuilderException.prototype.constructor = RegExpBuilderException;