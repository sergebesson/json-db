"use strict";
/* eslint no-console:0 */

const yargs = require("yargs");

const coerce = require("../coerce.js");
const errorHandler = require("../errorHandler.js");
const JsonDb = require("../../services/JsonDb.js");

module.exports = {
	command: "insert [options]",
	aliases: ["ins", "i"],
	desc: "insertion d'un document",
	builder: {
		document: {
			alias: ["doc", "d"],
			desc: "document à insérer",
			requiresArg: true,
			string: true,
			coerce: (document) => coerce.json("document", document),
		},
		"document-file": {
			alias: ["docf", "f"],
			desc: "fichier json contenant le document à insérer",
			requiresArg: true,
			string: true,
			coerce: (documentFile) => coerce.jsonFile("document-file", documentFile),
		},
		stdin: {
			alias: ["i"],
			desc: "Récupération du document à insérer depuis la stdin",
			boolean: true,
		},
	},
	handler,
};

function handler(argv) {
	if (!argv.document && !argv.documentFile && !argv.stdin) {
		console.log("Vous devez spécifier une option --document, --document-file ou --stdin \n");
		return yargs.showHelp();
	}

	const documentJson = argv.document ||
		argv.documentFile ||
		coerce.jsonFile("stdin", "/dev/stdin");

	const jsonDb = new JsonDb(argv.collection);
	errorHandler.errorManagementOfPromise(
		jsonDb.insert(documentJson)
			.then(() => {
				console.log("L'insertion du document effectué");
			}),
	);
}
