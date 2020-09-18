"use strict";
/* eslint no-console:0 */

const errorHandler = require("../errorHandler.js");
const JsonDb = require("../../services/JsonDb.js");

module.exports = {
	command: "delete <id>",
	aliases: ["del", "d"],
	desc: "suppression d'un document",
	handler,
};

function handler(argv) {
	const jsonDb = new JsonDb(argv.collection);
	errorHandler.errorManagementOfPromise(
		jsonDb.delete(argv.id)
			.then(() => {
				console.log("Suppression du document effectué");
			}),
	);
}
