"use strict";

var sTestTextEscapedGroups = "(ab\\?)";
var sTestTextGroups = "(ab?)";
var sTestText = "ab?";
var sTestTextExcaped = "ab\\?";

QUnit.module("QUnit tests for the RegExpBuilder");

QUnit.test("Test class exists", function(assert) {
	assert.ok(RegExpBuilder, "RegExpBuilder class exists");
});

QUnit.test("Test class instanciation", function(assert) {
	assert.ok(new RegExpBuilder(), "A new instance can created");
	assert.notStrictEqual(new RegExpBuilder(), new RegExpBuilder(), "Two new instances are different");
});

QUnit.test("toString - Test for the method toString", function(assert) {
	var oRegExpBuilder = new RegExpBuilder();
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
			var builder = new RegExpBuilder();
			builder[sTestName].apply(builder, aParameters);
			assert.strictEqual(builder.toString(), sExpectetResult, "Execution has impact of the internal pattern");
		});
	});
})({
	"matchesFreeText" : [ sTestText, sTestText ],
	"matchesAny" : [ "." ],
	"matchesFor" : [ "[" + sTestTextGroups + "]", sTestTextGroups ],
	"matchesRegExp" : [ sTestTextEscapedGroups, new RegExp(sTestTextEscapedGroups) ],
	"matchesNotFor" : [ "[^" + sTestText + "]", sTestText ],
	"matchesText" : [ sTestTextEscapedGroups, sTestText ],
	"matchesTimes" : [ "{1}", 1 ],
	"matchesTimes" : [ "{1,3}", 1, 3 ],
	"oneOrMoreTimes" : [ "+" ],
	"zeroOrMoreTimes" : [ "*" ],
	"zeroOrOneTimes" : [ "?" ],
	"matchesWordBoundary" : [ "\\b" ],
	"matchesNotWordBoundary" : [ "\\B" ],
	"beginLine" : [ "^" ],
	"endLine" : [ "$" ],
	"beginGroup" : [ "(" ],
	"startLookAheadFor" : [ "(?=" ],
	"startNegatedLookAhead" : [ "(?!" ],
	"useGroup" : [ "\\3", 3 ],
	"withNotGreedy" : [ "?" ],
	"or" : [ "|" ],
	"ifFollowedBy" : [ "(?=" ],
	"ifNotFollwedBy" : [ "(?!" ]
});

QUnit.test("freeText - Test for the method freeText", function(assert) {
	var oRegExpBuilder = new RegExpBuilder();
	oRegExpBuilder.matchesFreeText("");
	assert.strictEqual(oRegExpBuilder.toString(), "", "Empty free text is allowed and has no impact");
	var sFreeText = "foo|.*\\(\\))";
	oRegExpBuilder.matchesFreeText(sFreeText);
	assert.strictEqual(oRegExpBuilder.toString(), sFreeText, "Adding free text is working with no escaping");
});

QUnit.test("clear - Test for the method clear", function(assert) {
	var oRegExpBuilder = new RegExpBuilder();
	assert.strictEqual(oRegExpBuilder.toString(), "", "At the begin is the internal pattern empty");
	oRegExpBuilder.matchesFreeText("abc");
	assert.strictEqual(oRegExpBuilder.toString(), "abc", "Adding text working");
	oRegExpBuilder.clear();
	assert.strictEqual(oRegExpBuilder.toString(), "", "After call of 'clear' return the toString method an empty string");
});

QUnit.test("Test the default configuration", function(assert) {
	var oRegExpBuilder = new RegExpBuilder();
	assert.raises(function() {
		oRegExpBuilder.endGroup();
	}, function(err) {
		return true;
	}, "The calling of endGroup without openGroup produces an error");

	oRegExpBuilder = new RegExpBuilder();
	assert.raises(function() {
		oRegExpBuilder.openGroup().build();
	}, function(err) {
		return true;
	}, "The calling of build with a not closed group produces an error");

	oRegExpBuilder = new RegExpBuilder();
	var sRegEx = oRegExpBuilder.matchesFreeText("abc").matchesFreeText("def").build().toString();
	var sResult = sRegEx.substring(1, sRegEx.length - 1);
	assert.strictEqual(sResult, "abcdef", "The build produces no wrapping brakets");
});

QUnit.test("Test configuration wrapInsideGroup", function(assert) {
	var oRegExpBuilder = new RegExpBuilder({
		wrapInsideGroup : true
	});
	var sRegEx = oRegExpBuilder.matchesFreeText("abc").matchesFreeText("def").build().toString();
	var sResult = sRegEx.substring(1, sRegEx.length - 1);
	assert.strictEqual(sResult, "(abcdef)", "The build produces a wrapping group");
});
