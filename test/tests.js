"use strict";

var sTestTextEscapedGroups = "(?:ab\\?)";
var sTestTextGroups = "(ab?)";
var sTestText = "ab?";
var sTestTextExcaped = "ab\\?";

// TODO add build test
// TODO add warpTextInsideGroup test
// TODO test for deleteAlias

QUnit.module("RegExpBuilder - Class associatied Tests", function() {

	QUnit.test("Test class exists", function(assert) {
		assert.ok(RegExpBuilder, "RegExpBuilder class exists");
	});

	QUnit.test("Test class instanciation", function(assert) {
		assert.ok(new RegExpBuilder(), "A new instance can created");
		assert.ok(new RegExpBuilder() instanceof RegExpBuilder, "A new regexpbuilder is a instance of RegExpBuilder");
		assert.notStrictEqual(new RegExpBuilder(), new RegExpBuilder(), "Two new instances are different");

	});
});

QUnit.module("RegExpBuilder - Development associatied tests", function() {

	QUnit.test("Test only public methods and attributes are avaiable", function(assert) {
		// private methods/attributes beginning with a '_'
		var bSuccess = true;
		Object.keys(new RegExpBuilder()).forEach(function(sProperty) {
			bSuccess = bSuccess && !sProperty.startsWith("_");
		});
		assert.ok(bSuccess, "No private methods and attributes are accessible");
	})
});

QUnit.module("RegExpBuilder - Configuration associatied Tests", function() {

	QUnit.test("getConfiguration/setConfiguration - Test the method getConfiguration and the set through the constructor", function(assert) {
		var oConfig = new RegExpBuilder().getConfiguration();
		assert.ok(typeof (oConfig) === 'object', "getConfiguration returns an object");

		var oDefaultValues = {
			groupValidation : true,
			wrapInsideGroup : false,
			wrapTextInsideGroup : false
		};
		var oConfig = new RegExpBuilder().getConfiguration();
		assert.deepEqual(oDefaultValues, oConfig, "The default values are the same as expectet");

		var oOtherValues = {
			groupValidation : false,
			wrapInsideGroup : true,
			wrapTextInsideGroup : true
		};
		oConfig = new RegExpBuilder(oOtherValues).getConfiguration();
		assert.deepEqual(oOtherValues, oConfig, "All properties are customisable");
	});

	QUnit.test("Test configuration wrapInsideGroup for true", function(assert) {
		var oRegExpBuilder = new RegExpBuilder({
			wrapInsideGroup : true
		});
		var sRegEx = oRegExpBuilder.matchesFreeText("abc").matchesFreeText("def").build().toString();
		var sResult = sRegEx.substring(1, sRegEx.length - 1);
		assert.strictEqual(sResult, "(abcdef)", "The build produces a wrapped regex");
	});

	QUnit.test("Test configuration wrapInsideGroup for false", function(assert) {
		var oRegExpBuilder = new RegExpBuilder(); // by default wrapInsideGroup is false
		var sRegEx = oRegExpBuilder.matchesFreeText("abc").matchesFreeText("def").build().toString();
		var sResult = sRegEx.substring(1, sRegEx.length - 1);
		assert.strictEqual(sResult, "abcdef", "The build produces a non wrapped regex");
	});

	(function(oTests) {
		QUnit.test("Test configuration groupValidation for true", function(assert) {
			oTests.open.forEach(function(sMethodName) {
				var oRegExpBuilder = new RegExpBuilder(); // by default groupValidation is true
				assert.raises(function() {
					oRegExpBuilder[sMethodName]().build();
				}, function(oError) {
					return oError instanceof RegExpBuilderException;
				}, "The calling of build after " + sMethodName + " was called produces an error because no close exists");
			});
			oTests.close.forEach(function(sMethodName) {
				var oRegExpBuilder = new RegExpBuilder(); // by default groupValidation is true
				assert.raises(function() {
					oRegExpBuilder[sMethodName]();
				}, function(oError) {
					return oError instanceof RegExpBuilderException;
				}, "The calling of " + sMethodName + " produces an error because no begin exists");
			});
		});
	})({
		open : [ "beginGroup", "startLookAheadFor", "ifFollowedBy", "startNegatedLookAhead", "ifNotFollwedBy" ],
		close : [ "endGroup", "endLookAhead", "match", "endNegatedLookAhead" ]
	});

	(function(oTests) {
		QUnit.test("Test configuration groupValidation for false", function(assert) {
			Object.keys(oTests).forEach(function(sMethodName) {
				var oRegExpBuilder = new RegExpBuilder({
					groupValidation : false
				});
				var sRegEx = oRegExpBuilder[sMethodName]().toString();
				assert.strictEqual(oTests[sMethodName], sRegEx, "The method " + sMethodName + " added the expectet content");
				assert.raises(function() {
					oRegExpBuilder.build();
				}, function(oError) {
					return oError instanceof SyntaxError;
				}, "The validation is only done by the regexp while produces somethin false with " + sMethodName)
			});
		});
	})({
		beginGroup : "(",
		startLookAheadFor : "(?=",
		ifFollowedBy : "(?=",
		startNegatedLookAhead : "(?!",
		ifNotFollwedBy : "(?!",
		endGroup : ")",
		endLookAhead : ")",
		match : ")",
		endNegatedLookAhead : ")"
	});
});

QUnit.module("RegExpBuilder - Method associatied Tests", function() {

	QUnit.test("toString - Test for the method toString", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		assert.ok(typeof (oRegExpBuilder.toString()) === 'string', "The method returns a string");
		assert.strictEqual(oRegExpBuilder.toString(), "", "At the begin toString returns an empty string");
		oRegExpBuilder.matchesFreeText("abc");
		assert.strictEqual(oRegExpBuilder.toString(), "abc", "After adding a text the toString method returns this text");
	});

	(function testFunctionExecutionWorks(oTests) {
		Object.keys(oTests).forEach(
				function(sTestName) {
					var aData = oTests[sTestName];
					var sExpectetResult = aData[0];
					var aParameters = aData.slice(1);
					QUnit.test("Test basic for " + sTestName, function(assert) {
						var builder = new RegExpBuilder();
						assert.ok(builder[sTestName], "The method " + sTestName + " exists");
						builder[sTestName].apply(builder, aParameters);
						assert.strictEqual(builder.toString(), sExpectetResult, "Execution of " + sTestName
								+ " changes the internal pattern to the expectet result");
					});
				});
	})({
		matchesFreeText : [ sTestText, sTestText ],
		matchesAny : [ "." ],
		matchesFor : [ "[" + sTestText + "]", sTestText ],
		matchesRegExp : [ sTestTextExcaped, new RegExp(sTestTextExcaped) ],
		matchesNotFor : [ "[^" + sTestText + "]", sTestText ],
		matchesText : [ sTestTextEscapedGroups, sTestText ],
		matchesText : [ "a", "a" ],
		matchesTimes : [ "{1}", 1 ],
		withConstraint : [ "{1}", 1 ],
		matchesTimes : [ "{1,3}", 1, 3 ],
		withConstraint : [ "{1,3}", 1, 3 ],
		oneOrMoreTimes : [ "+" ],
		zeroOrMoreTimes : [ "*" ],
		zeroOrOneTimes : [ "?" ],
		matchesWordBoundary : [ "\\b" ],
		matchesNotWordBoundary : [ "\\B" ],
		beginLine : [ "^" ],
		endLine : [ "$" ],
		beginGroup : [ "(" ],
		startLookAheadFor : [ "(?=" ],
		startNegatedLookAhead : [ "(?!" ],
		useGroup : [ "\\3", 3 ],
		withNotGreedy : [ "?" ],
		or : [ "|" ],
		ifFollowedBy : [ "(?=" ],
		ifNotFollwedBy : [ "(?!" ],
		and : [ "" ],
		matchesAnyDigit : [ "[0-9]" ],
		matchesLetter : [ "[a-zA-Z]" ],
		matchesUppercaseLetter : [ "[A-Z]" ],
		matchesLowercaseLetter : [ "[a-z]" ]
	});

	QUnit.test("freeText - Test for the method freeText", function(assert) {
		var oRegExpBuilder = new RegExpBuilder();
		oRegExpBuilder.matchesFreeText("");
		assert.strictEqual(oRegExpBuilder.toString(), "", "Empty free text is allowed and has no impact");
		var sFreeText = "foo|.*\\(\\))";
		oRegExpBuilder.matchesFreeText(sFreeText);
		assert.strictEqual(oRegExpBuilder.toString(), sFreeText, "Adding free text is working with no escaping");
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

	QUnit.test("addAlias - Test the whole functionallity of addAlias", function(assert) {
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
			oRegExpBuilder.addAlias(sMethodName, "toString"); // toString exists
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
		assert.ok(typeof (oRegExpBuilder[sNewMethodName]) === 'function', "After add an alias the new method exists");
		assert.ok(typeof (oRegExpBuilder[sNewMethodName]("")) === 'object', "The new method returns an object");
		assert.strictEqual(oRegExpBuilder2[sMethodName]("abc").toString(), oRegExpBuilder[sNewMethodName]("abc").toString(),
				"The two methods generating the same output");
	});
});