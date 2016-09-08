"use strict";

QUnit.module("QUnit tests for the RegExpBuilder");

QUnit.test("Test class exists", function(assert) {
	assert.ok(RegExpBuilder, "RegExpBuilder class exists");
});

QUnit.test("Test class instanciation",  function(assert) {
	assert.ok(new RegExpBuilder(), "a new instance can created");
	assert.notStrictEqual(new RegExpBuilder(), new RegExpBuilder(), "two new instances are different");
});

QUnit.test("freeText - Test for the method freeText", function(assert) {
	var oRegExpBuilder = new RegExpBuilder();
	oRegExpBuilder.freeText("");
	assert.strictEqual(oRegExpBuilder.toString(), "", "empty free text is allowed and has no impact");
	var sFreeText = "foo|.*\\(\\))";
	oRegExpBuilder.freeText(sFreeText);
	assert.strictEqual(oRegExpBuilder.toString(), sFreeText, "adding free text is working with no escaping");
});

