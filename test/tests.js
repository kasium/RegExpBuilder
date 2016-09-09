"use strict";

var sTestTextEscaped = "ab\\?";
var sTestText = "ab?";

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
	oRegExpBuilder.matchesText("abc");
	assert.strictEqual(oRegExpBuilder.toString(), "abc", "After adding a text the toString method returns this text");
});

(function testFunctionExecutionWorks(oTests) {
	Object.keys(oTests).forEach(function(sTestName) {
		var aData = oTests[sTestName];
		var sExpectetResult = aData[0];
		var aParameters = aData.slice(1);

		QUnit.test("Test basic for " + sTestName, function(assert) {
			var builder = new RegExpBuilder();
			builder[sTestName].apply(null, aParameters);
			assert.strictEqual(builder.toString(), sExpectetResult, "Execution has impact of the internal pattern");
		});
	});
})({
	"matchesFreeText" : [ sTestTextEscaped, sTestTextEscaped ],
	"matchesAny" : [ "." ],
	"matchesFor" : [ "[" + sTestText + "]", sTestText ],
	"matchesRegExp" : [ sTestTextEscaped, new RegExp(sTestTextEscaped) ],
	"matchesNotFor" : [ "[^" + sTestText + "]", sTestText ],
	"matchesText" : [ sTestTextEscaped, sTestText ],
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
	oRegExpBuilder.matchesText("abc");
	assert.strictEqual(oRegExpBuilder.toString(), "abc", "Adding text working");
	oRegExpBuilder.clear();
	assert.strictEqual(oRegExpBuilder.toString(), "", "After call of 'clear' return the toString method an empty string");
});
