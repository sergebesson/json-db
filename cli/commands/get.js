"use strict";
/* eslint no-console:0 */

const errorHandler = require("../errorHandler.js");
const JsonDb = require("../../services/JsonDb.js");

module.exports = {
	command: "get <id>",
	aliases: ["g"],
	desc: "Affichage d'un document",
	handler,
};

function handler(argv) {
	const jsonDb = new JsonDb(argv.collection);
	errorHandler.errorManagementOfPromise(
		jsonDb.getById(argv.id)
			.then((document) => {
				if (!document) {
					return console.log("document non trouvé");
				}
				console.log(document);
			}),
	);
}
