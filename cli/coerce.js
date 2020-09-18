"use strict";

const fs = require("fs");

module.exports = {
	json,
	jsonFile,
};

function json(optionName, jsonData) {
	try {
		return JSON.parse(jsonData);
	} catch (err) {
		throw new Error(`${optionName} : le contenu n'est pas du JSON : ${err.message}`);
	}
}
function jsonFile(optionName, fileName) {
	let jsonData = null;
	try {
		jsonData = fs.readFileSync(fileName, "utf8"); // eslint-disable-line no-sync
	} catch (err) {
		throw new Error(`${optionName} : Erreur lecture du fichier ${fileName} : ${err.message}`);
	}
	return json(optionName, jsonData);
}
