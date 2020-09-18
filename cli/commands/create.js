"use strict";
/* eslint no-console:0 */

const _ = require("lodash");

const coerce = require("../coerce.js");
const errorHandler = require("../errorHandler.js");
const JsonDb = require("../../services/JsonDb.js");

module.exports = {
	command: "create [options]",
	aliases: ["cre", "c"],
	desc: "Création d'une collection",
	builder: {
		"id-name": {
			alias: ["id", "i"],
			desc: "nom de l'attribut contenant l'identifant du document",
			requiresArg: true,
			string: true,
		},
		jsonschema: {
			alias: ["jsc", "j"],
			desc: "jsonschema de validation d'un document",
			requiresArg: true,
			string: true,
			coerce: (json) => coerce.json("jsonschema", json),
		},
		"jsonschema-file": {
			alias: ["jscf", "f"],
			desc: "fichier json contenant le jsonschema de validation d'un document",
			requiresArg: true,
			string: true,
			coerce: (jsonschemaFile) => coerce.jsonFile("jsonschema-file", jsonschemaFile),
		},
		"documents-file": {
			alias: ["doc", "d"],
			desc: "fichier json contenant une liste de document à importer après la création",
			requiresArg: true,
			string: true,
			coerce: (documentsFile) => coerce.jsonFile("documents-file", documentsFile),
		},
	},
	handler,
};

function handler(argv) {
	const jsonDb = new JsonDb(argv.collection);
	errorHandler.errorManagementOfPromise(
		jsonDb.create({
			idName: argv.idName,
			jsonSchema: argv.jsonschema || argv.jsonschemaFile,
		})
			.then(() => {
				if (_.isArray(argv.documentsFile)) {
					return jsonDb.import(argv.documentsFile)
						.then((result) => {
							if (result.success) {
								console.log(`${result.numberDocumentsInserted} document(s) importé(s)`);
							} else {
								console.log("ATTENTION il y a eu des erreurs lors de l'import des documents");
								console.log(`${result.numberDocumentsInserted} document(s) importé(s)`);
								console.log(`${result.numberDocumentsInError} n'a(ont) pas été importé(s)`);
							}
						});
				}
			})
			.then(() => {
				console.log("Création de la collection réussie");
			}),
	);
}
