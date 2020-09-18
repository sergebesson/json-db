"use strict";
/* eslint no-console:0 */

const coerce = require("../coerce.js");
const errorHandler = require("../errorHandler.js");
const JsonDb = require("../../services/JsonDb.js");

module.exports = {
	command: "find [options]",
	aliases: ["f"],
	desc: "recherche de documents",
	builder: {
		"json-filter": {
			alias: ["json", "j"],
			desc: "json permettant de filter les documents",
			requiresArg: true,
			string: true,
			coerce: (json) => coerce.json("json-filter", json),
		},
		"json-filter-file": {
			alias: ["jsonf", "f"],
			desc: "fichier json contenant le filte les documents",
			requiresArg: true,
			string: true,
			coerce: (jsonFile) => coerce.jsonFile("json-filter-file", jsonFile),
		},
	},
	handler,
};

function handler(argv) {
	const jsonDb = new JsonDb(argv.collection);
	errorHandler.errorManagementOfPromise(
		jsonDb.find(argv.jsonFilter || argv.jsonFilterFile)
			.then((documents) => {
				console.log(documents);
			}),
	);
}
