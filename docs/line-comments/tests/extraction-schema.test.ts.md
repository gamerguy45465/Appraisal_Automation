# Line explanations: tests/extraction-schema.test.ts

Source: [tests/extraction-schema.test.ts](../../../tests/extraction-schema.test.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import { describe, expect, it } from "vitest" for these regression tests. |
| 2 | Import { toJsonSchema } from "@langchain/core/utils/json_schema" for these regression tests. |
| 3 | Import { extractionSchema, type ExtractedOrder } from "../src/domain.js" for these regression tests. |
| 4 | Import { anthropicExtractionSchema, normalizeAnthropicExtraction } from "../src/extraction-schema.js" for these regression tests. |
| 5 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 6 | Define the TypeScript shape `Node` used by the test fixtures; this adds no runtime value. |
| 7 | Define helper `schemaNodes` with parameters value, path for the fixture operations below. |
| 8 | Run the following branch when the negation of `value` or `typeof value` does not strictly equal "object" or the result of `Array.isArray` using `value`. Return an empty array to the caller. |
| 9 | Declare `node` as `value`. |
| 10 | Return an array containing an object containing path, node, `...Object.entries(node).flatMap(([key, child]) =&gt; Array.isArray(child) ? child.flatMap((item, index) =&gt; schemaNodes(item, `${path}.${key}[${index}]`)) : schemaNodes(child, `${pa...` to the caller. |
| 11 | When a schema child is an array, recursively collect each element's schema nodes and append its index to the diagnostic path. |
| 12 | Otherwise recursively collect the single child schema with its property path, then finish the flattened node list. |
| 13 | Close the callback or control-flow body for `schemaNodes` and finish the surrounding syntax. |
| 14 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 15 | Declare `blankContact` as an object containing firstName: "", lastName: "", workPhone: "", homePhone: "", mobilePhone: "", email: "". |
| 16 | Declare `missingContact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent). |
| 17 | Declare `wire` as an object whose fields are defined below. |
| 18 | Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase". Set fixture property `product` to "". Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to "  ". |
| 19 | Set fixture property `property` to an object containing address: "123 Synthetic St", unit: "", postalCode: "", city: "", state: "". |
| 20 | Set fixture property `secondaryLoanNumber` to "". Set fixture property `loanType` to "". Set fixture property `lienPosition` to "". Set fixture property `loanAmount` to 388000. Set fixture property `salePrice` to 485000. |
| 21 | Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to "". |
| 22 | Set fixture property `borrower` to an object containing values copied from `blankContact`, firstName: "Casey", lastName: "Borrower", homePhone: "7025550100". |
| 23 | Set fixture property `coBorrower` to `blankContact`. |
| 24 | Set fixture property `listingAgent` to an object containing values copied from `blankContact`, firstName: "Avery", lastName: "Ellis", email: "avery@example.test". |
| 25 | Set fixture property `buyerAgent` to an object containing values copied from `blankContact`, firstName: "Morgan", lastName: "Rivera", workPhone: "7025550120". |
| 26 | Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false. |
| 27 | Set fixture property `evidence` to an array containing an object containing field: "salePrice", document: "salesContract", page: 1, quote: "". Set fixture property `warnings` to an array containing "". |
| 28 | Close the fixture object for `wire` and finish the surrounding syntax. |
| 29 | Declare `canonical` as an object whose fields are defined below. |
| 30 | Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase". Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to null (unknown or absent). |
| 31 | Set fixture property `property` to an object containing address: "123 Synthetic St", unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent). |
| 32 | Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to 388000. Set fixture property `salePrice` to 485000. |
| 33 | Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent). |
| 34 | Set fixture property `borrower` to an object containing values copied from `missingContact`, firstName: "Casey", lastName: "Borrower", homePhone: "7025550100". |
| 35 | Set fixture property `coBorrower` to `missingContact`. |
| 36 | Set fixture property `listingAgent` to an object containing values copied from `missingContact`, firstName: "Avery", lastName: "Ellis", email: "avery@example.test". |
| 37 | Set fixture property `buyerAgent` to an object containing values copied from `missingContact`, firstName: "Morgan", lastName: "Rivera", workPhone: "7025550120". |
| 38 | Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false. |
| 39 | Set fixture property `evidence` to an array containing an object containing field: "salePrice", document: "salesContract", page: 1, quote: "". Set fixture property `warnings` to an array containing "". |
| 40 | Close the fixture object for `canonical` and finish the surrounding syntax. |
| 41 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 42 | Group regression tests for "Anthropic extraction schema boundary". |
| 43 | Register a test that "preserves all canonical fields and required lists while reducing 40 unions to the three nullable amounts". |
| 44 | Declare `original` as the result of `schemaNodes` using the result of `toJsonSchema` using `extractionSchema`. |
| 45 | Declare `adapted` as the result of `schemaNodes` using `anthropicExtractionSchema`. |
| 46 | Declare `structure` as a callback that returns the result of `nodes.filter(({ node }) =&gt; node.properties).map` using a callback that returns `{ path, properties: Object.keys(node.properties as Node), required: node.required, additionalProperties: node.additionalProperties, }`. |
| 47 | Include the current `path` value under the same property name. Set fixture property `properties` to the result of `Object.keys` using `node.properties`. Set fixture property `required` to `node.required`. Set fixture property `additionalProperties` to `node.additionalProperties`. |
| 48 | Close the fixture object and finish the surrounding syntax. |
| 49 | Assert that the result of `structure` using `adapted` deeply equals the result of `structure` using `original`. |
| 50 | Declare `union` as a callback that returns the result of `Array.isArray` using `node.type` or the result of `Array.isArray` using `node.anyOf`. |
| 51 | Assert that the result of `original.filter` using `union` has length 40. |
| 52 | Assert that the result of `adapted.filter(union).map` using a callback that returns `path` deeply equals an array containing "$.properties.loanAmount", "$.properties.salePrice", "$.properties.lastValuationAmount". |
| 53 | Require only the loanAmount, salePrice, and lastValuationAmount paths to retain nullable-number unions. |
| 54 | Close the array of fixture values and finish the surrounding syntax. |
| 55 | Declare `nullableText` as the result of `original.filter` using a callback that returns `Array.isArray(node.type)` and `node.type.includes('string')` and the result of `node.type.includes` using `'null'`. |
| 56 | Assert that `nullableText` has length 37. |
| 57 | For each canonical nullable-text path, assert that the matching adapted Anthropic schema node has the plain string type. |
| 58 | Close the callback or control-flow body and finish the surrounding syntax. |
| 59 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 60 | Register a test that "decodes missing text without merging contacts, changing evidence/warnings, or mutating provider output". |
| 61 | Declare `original` as the result of `structuredClone` using `wire`. |
| 62 | Declare `normalized` as the result of `normalizeAnthropicExtraction` using `wire`. |
| 63 | Assert that the result of `extractionSchema.parse` using `normalized` deeply equals `canonical`. |
| 64 | Assert that `wire` deeply equals `original`. |
| 65 | Assert that the result of `normalizeAnthropicExtraction` using `canonical` deeply equals `canonical`. |
| 66 | Close the callback or control-flow body and finish the surrounding syntax. |
| 67 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 68 | Register a test that "keeps all three absent amounts null without filling them with zero". |
| 69 | Declare `result` as the result of `extractionSchema.parse` using the result of `normalizeAnthropicExtraction` using an object containing values copied from `wire`, loanAmount: null (unknown or absent), salePrice: null (unknown or absent), lastValuationAmount: null (unknown or absent). |
| 70 | Assert that an array containing `result.loanAmount`, `result.salePrice`, `result.lastValuationAmount` deeply equals an array containing null (unknown or absent), null (unknown or absent), null (unknown or absent). |
| 71 | Close the callback or control-flow body and finish the surrounding syntax. |
| 72 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 73 | Register a test that "preserves invalid or missing fields so unchanged canonical validation rejects them". |
| 74 | Declare `missingName` as the result of `structuredClone` using `wire`. |
| 75 | Delete property `(missingName.borrower as Record&lt;string, unknown&gt;).lastName` from the fixture object. |
| 76 | Begin malformed extraction cases covering missing required fields, zero/mistyped amounts, invalid classifications or booleans, invalid contacts, and malformed evidence/warnings. |
| 77 | Copy the entries of `wire` into this fixture. Set fixture property `salePrice` to 0. Copy the entries of `wire` into this fixture. Set fixture property `loanAmount` to "388000". Copy the entries of `wire` into this fixture. Set fixture property `lastValuationAmount` to "". |
| 78 | Copy the entries of `wire` into this fixture. Set fixture property `loanProgram` to "". Copy the entries of `wire` into this fixture. Set fixture property `loanPurpose` to "purchase". Copy the entries of `wire` into this fixture. Set fixture property `complexProperty` to "". |
| 79 | Copy the entries of `wire` into this fixture. Set fixture property `borrower` to an object containing values copied from `wire.borrower`, firstName: 123. |
| 80 | Copy the entries of `wire` into this fixture. Set fixture property `evidence` to an array containing an object containing values copied from `wire.evidence[0]`, document: "". |
| 81 | Copy the entries of `wire` into this fixture. Set fixture property `evidence` to an array containing an object containing values copied from `wire.evidence[0]`, page: 0. |
| 82 | Add malformed cases with an overlong evidence quote and a null warning entry; warnings must contain strings, so null is invalid here. |
| 83 | Close the array of fixture values for `malformed` and finish the surrounding syntax. |
| 84 | Normalize each malformed response and assert that canonical schema validation still fails rather than repairing invalid data. |
| 85 | Assert normalization preserves the missing borrower.lastName property instead of inventing it. |
| 86 | Close the callback or control-flow body and finish the surrounding syntax. |
| 87 | Close the callback or control-flow body and finish the surrounding syntax. |
