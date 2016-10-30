"use strict";

/*
 * TODO area
 * - betterbuild test
 * -the message for exceptions
 * -add result testing of build
 * -validateMethodInput
 * -configuration flags + build method
 */

var sTestTextEscapedGroups = "(?:ab\\?)";
var sTestTextGroups = "(ab?)";
var sTestText = "ab?";
var sTestTextExcaped = "ab\\?";

/**
 * 
 * @param {Object} sMethodName the method name of the console object to test
 * @param {string} sExpectedText the expected text with which the method should called
 * @param {boolean} bSupress defines, if the output should be suppresed
 */
function testConsoleOutput(sMethodName, sExpectedText, bSupress) {
	var oldMethod = console[sMethodName];
	var iCounter = 0;
	var bSuccess = false;
	console[sMethodName] = function(sText) {
		if (sText === sExpectedText) {
			bSuccess = true;
		}
		if (bSupress !== true) {
			oldMethod(sText);
		}
	};
	return new Promise(function(resolve, reject) {
		function testOutput() {
			//50 => 50*100= 5 seconds
			if (iCounter === 50 && !bSuccess) {
				reject();
			}
			if (bSuccess) {
				resolve();
			}
			iCounter++;
			setTimeout(testOutput, 100);
		}
		testOutput();
	});
}

function testWarnOutput(sExpectedText, bSupress) {
	return testConsoleOutput("warn", sExpectedText, bSupress);
}

QUnit.module("RegExpBuilder - Class associatied Tests", function() {

	QUnit.test("Test class exists", function(assert) {
		assert.ok(RegExpBuilder, "RegExpBuilder class exists");
	});

	QUnit.test("Test class instanciation", function(assert) {
		assert.ok(new RegExpBuilder(), "A new instance can created with 'new'");
		assert.raises(function() {
			RegExpBuilder();
		}, function(error) {
			return error instanceof Error;
		}, "Without 'new', the RegExpBuilder() function can't be called'");
		assert.ok(new RegExpBuilder() instanceof RegExpBuilder, "A new regexpbuilder is a instance of RegExpBuilder");
		assert.notStrictEqual(new RegExpBuilder(), new RegExpBuilder(), "Two new instances are different");
	});

	QUnit.test("Test constants of class", function(assert) {( function(oConstants) {
				Object.keys(oConstants).forEach(function(sConstantName) {
					assert.ok(RegExpBuilder[sConstantName], "Variable " + sConstantName + " exists");
					assert.strictEqual(RegExpBuilder[sConstantName], oConstants[sConstantName], "Variable " + sConstantName + " value is right");
					assert.raises(function() {
						RegExpBuilder[sConstantName] = "abc";
					}, function(error) {
						return error instanceof TypeError && RegExpBuilder[sConstantName] === oConstants[sConstantName];
					}, "Is it not possible to override the constant " + sConstantName);
				});
			}({
				FLAG_GLOBAL: "g",
				FLAG_CASE_INSENITIVE: "i",
				FLAG_MULTI_LINE: "m",
				FLAG_STICKY: "y"
			}));
	});
});

QUnit.module("RegExpBuilder - Configuration associatied Tests", function() {

	QUnit.test("getConfiguration/setConfiguration - Test the method getConfiguration and the set through the constructor", function(assert) {
		var oConfig = new RegExpBuilder().getConfiguration();
		assert.ok( typeof (oConfig) === 'object', "getConfiguration returns an object");

		var oDefaultValues = {
			flags: [],
			groupValidation: true,
			wrapInsideGroup: false,
			wrapTextInsideGroup: false,
			validateMethodInput: true
		};
		oConfig = new RegExpBuilder().getConfiguration();
		assert.deepEqual(oDefaultValues, oConfig, "The default values are the same as expectet");

		var oOtherValues = {
			flags: [RegExpBuilder.FLAG_GLOBAL],
			groupValidation: false,
			wrapInsideGroup: true,
			wrapTextInsideGroup: true,
			validateMethodInput: false
		};
		oConfig = new RegExpBuilder(oOtherValues).getConfiguration();
		assert.deepEqual(oOtherValues, oConfig, "All properties are customisable");
	});

	QUnit.test("Test wrong configuration", function(assert) {
		var done = assert.async(2);
		var oPromise = testWarnOutput("Found illegal propertry noProperty inside the configuration object").then(function() {
			assert.ok(true, "Warning for illegal property was shown");
			done();
		});
		var oPromiseTwo = testWarnOutput("Found wrong type for property wrapInsideGroup. Expected boolean but found string").then(function() {
			assert.ok(true, "Warning for wrong property type was shown");
			done();
		});
		var oRegExpBuilder = new RegExpBuilder({
			groupValidation: false,
			noProperty: 123,
			wrapInsideGroup: "wrongPropertyType"
		});
		var oExpectedConfig = {
			flags: [],
			groupValidation: false,
			wrapInsideGroup: false,
			wrapTextInsideGroup: false,
			validateMethodInput: true
		};
		assert.deepEqual(oExpectedConfig, oRegExpBuilder.getConfiguration(), "No illegal values are inside the config object");
	});

	QUnit.test("Test configuration wrapInsideGroup for true", function(assert) {
		var oRegExpBuilder = new RegExpBuilder({
			wrapInsideGroup: true
		});
		var sRegEx = oRegExpBuilder.matchesFreeText("abc").matchesFreeText("def").build().toString();
		var sResult = sRegEx.substring(1, sRegEx.length - 1);
		assert.strictEqual(sResult, "(abcdef)", "The build produces a wrapped regex");
	});

	QUnit.test("Test configuration wrapInsideGroup for false", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		// by default wrapInsideGroup is false
		var sRegEx = oRegExpBuilder.matchesFreeText("abc").matchesFreeText("def").build().toString();
		var sResult = sRegEx.substring(1, sRegEx.length - 1);
		assert.strictEqual(sResult, "abcdef", "The build produces a non wrapped regex");
	});

	QUnit.test("Test configuration flags with an empty array", function(assert) {
		var oRegExp = new RegExpBuilder().matchesText("abc").build(); ( function(aProperties) {
				aProperties.forEach(function(sPropertyName) {
					assert.strictEqual(oRegExp[sPropertyName], false, "Property " + sPropertyName + " is false");
				});

			}(["global", "ignoreCase", "multiline", "sticky"]));
	});

	QUnit.test("Test configuration wrapTextInsideGroup for false", function(assert) {
		var sPattern = new RegExpBuilder().matchesText("abc").toString();
		assert.strictEqual(sPattern, "(?:abc)");
	});

	QUnit.test("Test configuration wrapTextInsideGroup for true", function(assert) {
		var oBuilder = new RegExpBuilder({
			wrapTextInsideGroup: true
		});
		var sPattern = oBuilder.matchesText("abc").toString();
		assert.strictEqual(sPattern, "(abc)");
	});

	(function(oTests) {
		QUnit.test("Test configuration groupValidation for true", function(assert) {
			oTests.open.forEach(function(sMethodName) {
				var oRegExpBuilder = new RegExpBuilder();
				// by default groupValidation is true
				assert.raises(function() {
					oRegExpBuilder[sMethodName]().build();
				}, function(oError) {
					return oError instanceof RegExpBuilderException;
				}, "The calling of build after " + sMethodName + " was called produces an error because no close exists");
			});
			oTests.close.forEach(function(sMethodName) {
				var oRegExpBuilder = new RegExpBuilder();
				// by default groupValidation is true
				assert.raises(function() {
					oRegExpBuilder[sMethodName]();
				}, function(oError) {
					return oError instanceof RegExpBuilderException;
				}, "The calling of " + sMethodName + " produces an error because no begin exists");
			});
		});
	})({
		open: ["beginGroup", "startLookAheadFor", "ifFollowedBy", "startNegatedLookAhead", "ifNotFollwedBy"],
		close: ["endGroup", "endLookAhead", "match", "endNegatedLookAhead"]
	});

	(function(oTests) {
		QUnit.test("Test configuration groupValidation for false", function(assert) {
			Object.keys(oTests).forEach(function(sMethodName) {
				var oRegExpBuilder = new RegExpBuilder({
					groupValidation: false
				});
				var sRegEx = oRegExpBuilder[sMethodName]().toString();
				assert.strictEqual(oTests[sMethodName], sRegEx, "The method " + sMethodName + " added the expectet content");
				assert.raises(function() {
					oRegExpBuilder.build();
				}, function(oError) {
					return oError instanceof SyntaxError;
				}, "The validation is only done by the regexp while produces somethin false with " + sMethodName);
			});
		});
	})({
		beginGroup: "(",
		startLookAheadFor: "(?=",
		ifFollowedBy: "(?=",
		startNegatedLookAhead: "(?!",
		ifNotFollwedBy: "(?!",
		endGroup: ")",
		endLookAhead: ")",
		match: ")",
		endNegatedLookAhead: ")"
	});
});

QUnit.module("RegExpBuilder - Method associatied Tests", function() {

	QUnit.test("toString - Test for the method toString", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		assert.ok( typeof (oRegExpBuilder.toString()) === 'string', "The method returns a string");
		assert.strictEqual(oRegExpBuilder.toString(), "", "At the begin toString returns an empty string");
		oRegExpBuilder.matchesFreeText("abc");
		assert.strictEqual(oRegExpBuilder.toString(), "abc", "After adding a text the toString method returns this text");
	});

	(function testFunctionExecutionWorks(oTests) {
		Object.keys(oTests).forEach(function(sTestName) {
			var aData = oTests[sTestName];
			var sExpectetResult = aData[0];
			var aParameters = aData.slice(1);
			QUnit.test("Test basic for " + sTestName, function(assert) {
				var builder = new RegExpBuilder({
					groupValidation: false
				});
				assert.ok(builder[sTestName], "The method " + sTestName + " exists");
				var oResult = builder[sTestName].apply(builder, aParameters);
				assert.strictEqual(builder.toString(), sExpectetResult, "Execution of " + sTestName + " changes the internal pattern to the expectet result");
				assert.ok( oResult instanceof RegExpBuilder, "The return value is an instance of RegExpBuilder");
				if(aParameters.length > 0) {
					assert.raises(function() {
						builder[sTestName]();
					}, function(oError) {
						return oError instanceof RegExpBuilderException;
					}, "If called with no parameters the method throws a RegExpBuilderException");
				}
			});
		});
	})({
		//not: matchesBuilder
		matchesFreeText: [sTestText, sTestText],
		matchesRegExp: [sTestTextExcaped, new RegExp(sTestTextExcaped)],
		matchesAny: ["."],
		matchesFor: ["[" + sTestText + "]", sTestText],
		matchesOneOf: ["[" + sTestText + "]", sTestText],
		endGroup: [")"],
		endNonCapturedGroup: [")"],
		match: [")"],
		endLookAhead: [")"],
		endNegatedLookAhead: [")"],
		matchesDigit: ["[0-9]"],
		matchesNonDigit: ["[^0-9]"],
		matchesFormFeed: ["\\f"],
		matchesLineFeed: ["\\n"],
		matchesCarriageReturn: ["\\r"],
		matchesWhiteSpace: ["\\s"],
		matchesNotWhiteSpace: ["\\S"],
		matchesTab: ["\\t"],
		matchesVerticalTab: ["\\v"],
		matchesAlphanumeric: ["\\w"],
		matchesNonAlphanumeric: ["\\W"],
		matchesLetter: ["[a-zA-Z]"],
		matchesUppercaseLetter: ["[A-Z]"],
		matchesLowercaseLetter: ["[a-z]"],
		matchesBackspace: ["[\\b]"],
		matchesNotFor: ["[^" + sTestText + "]", sTestText],
		matchesNotOneOf: ["[^" + sTestText + "]", sTestText],
		matchesText: [sTestTextEscapedGroups, sTestText],
		matchesTimes: ["{1,3}", 1, 3],
		withConstraint: ["{1,3}", 1, 3],
		oneOrMoreTimes: ["+"],
		zeroOrMoreTimes: ["*"],
		zeroOrOneTimes: ["?"],
		matchesWordBoundary: ["\\b"],
		matchesNotWordBoundary: ["\\B"],
		beginLine: ["^"],
		endLine: ["$"],
		beginGroup: ["("],
		beginNonCapturedGroup: ["(?:"],
		startLookAheadFor: ["(?="],
		ifFollowedBy: ["(?="],
		startNegatedLookAhead: ["(?!"],
		ifNotFollwedBy: ["(?!"],
		useGroup: ["\\3", 3],
		withNotGreedy: ["?"],
		or: ["|"],
		and: [""],
		matchesNull: ["\\0"]
	});

	QUnit.test("freeText - Test for the method freeText", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		oRegExpBuilder.matchesFreeText("");
		assert.strictEqual(oRegExpBuilder.toString(), "", "Empty free text is allowed and has no impact");
		var sFreeText = "foo|.*\\(\\))";
		oRegExpBuilder.matchesFreeText(sFreeText);
		assert.strictEqual(oRegExpBuilder.toString(), sFreeText, "Adding free text is working with no escaping");
	});

	QUnit.test("matchesText - Test for the method matchesText", function(assert) {
		var sPattern;
		sPattern = new RegExpBuilder().matchesText("").toString();
		assert.strictEqual(sPattern, "", "Empty free text is allowed and has no impact");
		sPattern = new RegExpBuilder().matchesText("abc").toString();
		assert.strictEqual(sPattern, "(?:abc)", "Add text is working");
		sPattern = new RegExpBuilder().matchesText("abc", true).toString();
		assert.strictEqual(sPattern, "(abc)", "With a true bGroup parameters the text is inside a captured group");
		sPattern = new RegExpBuilder().matchesText("?abc../d").toString();
		assert.strictEqual(sPattern, "(?:\\?abc\\.\\.\\/d)", "Text with special regex charactes is escaped");
	});

	QUnit.test("build - Test for method build", function(assert) {
		var oRegExp = new RegExpBuilder().build();
		assert.ok( oRegExp instanceof RegExp, "The method returns a RegExp object");

		oRegExp = new RegExpBuilder().matchesText("abc").build("g");
		assert.strictEqual(oRegExp.toString(), "/(?:abc)/g", "Passing a single flag as a staring adds this to the RegExp object");

		oRegExp = new RegExpBuilder().matchesText("abc").build(["g", "i"]);
		assert.strictEqual(oRegExp.toString(), "/(?:abc)/gi", "Passing two flags as an array adds this to the RegExp object");
	});

	QUnit.test("matches - Test for method matches", function(assert) {
		var oRegExp = new RegExpBuilder().matches("abc?");
		assert.strictEqual(oRegExp.toString(), "(?:abc\\?)", "A string will be escaped");

		oRegExp = new RegExpBuilder().matches(/abc/);
		assert.strictEqual(oRegExp.toString(), "abc", "Passing a RegExp object adds this to internal pattern");

		oRegExp = new RegExpBuilder().matches(new RegExpBuilder().matchesText("abc"));
		assert.strictEqual(oRegExp.toString(), "(?:abc)", "Passing a RegExpBuilder adds this to the internal pattern");

		assert.raises(function() {
			var oRegExp = new RegExpBuilder().matches();
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "It is not possible to call the method without a parameter");

		assert.raises(function() {
			var oRegExp = new RegExpBuilder().matches(23);
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "It is not possible to call the method with a number");
	});

	QUnit.test("matchesBuilder - Test for the method matchesBuilder", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		assert.raises(function() {
			oRegExpBuilder.matchesBuilder();
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "If called with undefined the method throws an error");

		oRegExpBuilder = new RegExpBuilder();
		assert.raises(function() {
			oRegExpBuilder.matchesBuilder(new RegExp("abc"));
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "If called a non RegExpBuilder instance the method throws an error");

		var oRegExp = new RegExpBuilder().matchesText("abc");
		var sRegEx = new RegExpBuilder().matchesBuilder(oRegExp).matchesText("123").toString();
		assert.strictEqual(sRegEx, "(?:abc)(?:123)", "The builder was successfully added");
	});

	QUnit.test("matchesRegExp - Test for the method matchesRegExp", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		assert.raises(function() {
			oRegExpBuilder.matchesRegExp();
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "If called with undefined the method throws an error");

		oRegExpBuilder = new RegExpBuilder();
		assert.raises(function() {
			oRegExpBuilder.matchesRegExp(new RegExpBuilder());
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "If called a non RegExp instance the method throws an error");

		var sRegEx = new RegExpBuilder().matchesRegExp(new RegExp("abc")).matchesText("123").toString();
		assert.strictEqual("abc(?:123)", sRegEx, "The regExp was successfully added");
	});

	QUnit.test("clear - Test for the method clear", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		assert.strictEqual(oRegExpBuilder.toString(), "", "At the begin is the internal pattern empty");
		oRegExpBuilder.matchesFreeText("abc");
		assert.strictEqual(oRegExpBuilder.toString(), "abc", "Adding text working");
		oRegExpBuilder.clear();
		assert.strictEqual(oRegExpBuilder.toString(), "", "After call of 'clear' return the toString method an empty string");
	});

	QUnit.test("matchesTimes - Test for the method matchesTimes", function(assert) {
		var oRegExpBuilder = new RegExpBuilder().matchesTimes(2);
		assert.strictEqual("{2}", oRegExpBuilder.toString(), "Adding a exact value is possible");
		oRegExpBuilder = new RegExpBuilder().matchesTimes(2,3);
		assert.strictEqual("{2,3}", oRegExpBuilder.toString(), "Adding a minimum and a maximum is possible");
	});

	//TODO
	QUnit.test("withConstraint - Test for the method withConstraint", function(assert){
		var oRegExpBuilder = new RegExpBuilder().matchesTimes(2);
		assert.strictEqual("{2}", oRegExpBuilder.toString(), "");
		oRegExpBuilder = new RegExpBuilder().matchesTimes(2,3);
		assert.strictEqual("{2,3}", oRegExpBuilder.toString(), "");
	});

	QUnit.test("clone - Test for the method clone", function(assert) {
		var oRegExpBuilder = new RegExpBuilder().matchesText("123");
		oRegExpBuilder.addAlias("toString", "toNewString");
		var oNewBuilder = oRegExpBuilder.clone();

		assert.ok(oNewBuilder, "cloned object is not falsy");
		assert.ok( oNewBuilder instanceof RegExpBuilder, "clone object is an instance of RegExpBuilder");
		assert.strictEqual(oNewBuilder.toString(), oRegExpBuilder.toString(), "Pattern was clones");
		assert.ok( typeof (oNewBuilder.toNewString) === "function", "aliases was clones");

		oRegExpBuilder.matchesText("abc");
		assert.notStrictEqual(oNewBuilder.toString(), oRegExpBuilder.toString(), "After cloning the instances are independend (function call)");

		//TODO internal attribute
		oRegExpBuilder._oConfig.groupValidation = false;
		assert.notStrictEqual(oNewBuilder._oConfig.groupValidation, oRegExpBuilder._oConfig.groupValidation, "After cloning the instances are independend (object)");

	});

	QUnit.test("addAlias - Test the method addAlias", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		var sMethodName = "matchesFreeText";
		var sNewMethodName = "newMethod";
		var sAttributeName = "testAttribute";

		assert.raises(function() {
			oRegExpBuilder.addAlias("ThisDontExists", sNewMethodName);
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "While trying to add a alias for method which doesn't exists an error is thrown");
		assert.ok(!oRegExpBuilder[sNewMethodName], "No new method was created");

		var fnOldMethod = oRegExpBuilder["toString"];
		assert.raises(function() {
			oRegExpBuilder.addAlias(sMethodName, "toString");
			// toString exists
		}, function(oError) {
			return oError instanceof RegExpBuilderException;
		}, "While trying to add a alias for method while the alias exists throws an error");
		assert.ok(!oRegExpBuilder["newMethod"], "No new method was created");
		assert.strictEqual(oRegExpBuilder["toString"], fnOldMethod, "The existing method was not overwritten");

		oRegExpBuilder[sAttributeName] = "TestAttributeContent";
		var sOldAttribute = oRegExpBuilder[sAttributeName];
		var oRegExpBuilder2 = new RegExpBuilder();
		assert.raises(function() {
			oRegExpBuilder.addAlias(sAttributeName, sNewMethodName);
		}, function(error) {
			return true;
		}, "While trying to add a alias for non-method throws an error");
		assert.ok(!oRegExpBuilder[sNewMethodName], "No new method was created");
		assert.strictEqual(oRegExpBuilder[sAttributeName], sOldAttribute, "The existing attribute was not overwritten");

		oRegExpBuilder.addAlias(sMethodName, sNewMethodName);
		assert.ok(oRegExpBuilder[sMethodName], "After add an alias the old method still exists");
		assert.ok( typeof (oRegExpBuilder[sNewMethodName]) === 'function', "After add an alias the new method exists");
		assert.ok( typeof (oRegExpBuilder[sNewMethodName]("")) === 'object', "The new method returns an object");
		assert.strictEqual(oRegExpBuilder2[sMethodName]("abc").toString(), oRegExpBuilder[sNewMethodName]("abc").toString(), "The two methods generating the same output");
	});

	QUnit.test("deleteAlias - Test the method deleteAlias", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		assert.strictEqual(oRegExpBuilder.deleteAlias(), false, "Call with no argument returns false");
		assert.strictEqual(oRegExpBuilder.deleteAlias(""), false, "Call with empty string returns false");
		assert.strictEqual(oRegExpBuilder.deleteAlias("thisMethodDon'tExists"), false, "Call with not existing methodname returns false");
		assert.strictEqual(oRegExpBuilder.deleteAlias("toString"), false, "Call with not alias returns false");
		assert.strictEqual(oRegExpBuilder.deleteAlias(), false, "Call with no argument returns false");
		oRegExpBuilder.addAlias("toString", "newToString");
		assert.strictEqual(oRegExpBuilder.deleteAlias("newToString"), true, "Call with exising alias returns true");
		assert.ok(!oRegExpBuilder["newToString"], "New method was deleted");
		assert.ok(oRegExpBuilder["toString"], "Old method was not deleted");
	});

	QUnit.test("getAliasList - Test for the method getAliasList", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		oRegExpBuilder.addAlias("toString", "aliasToString");
		oRegExpBuilder.addAlias("build", "aliasBuild");
		var aGetAliasList = oRegExpBuilder.getAliasList();
		var aAliasList = [{methodName: "toString", aliasName: "aliasToString"},{methodName: "build", aliasName: "aliasBuild"}]
		assert.deepEqual(aAliasList, aGetAliasList, "The method returns all alias");
	})
});