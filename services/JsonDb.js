"use strict";

const _ = require("lodash");
const fs = require("fs");

const Collection = require("../models/Collection.js");

class JsonDb {
	constructor(fileName) {
		this.fileNameStructure = `${fileName}.structure.json`;
		this.fileNameDocuments = `${fileName}.documents.json`;
		this._collection = null;
	}
	get collection() {
		return this._collection;
	}
	create(structure) {
		this._collection = new Collection(structure);
		return JsonDb.writeFilePrivate(
			this.fileNameStructure, this._collection.structure,
		)
			.then(() => JsonDb.writeFilePrivate(
				this.fileNameDocuments, this._collection.documents,
			));
	}
	getStructure() {
		return this.initializeIfNecessaryPrivate()
			.then(() => this._collection.structure);
	}
	loadCollection() {
		return this.initializeIfNecessaryPrivate()
			.then(() => JsonDb.readFilePrivate(this.fileNameDocuments))
			.then((documents) => {
				this._collection.documents = documents;
				return this._collection;
			});
	}
	insert(document) {
		return this.readFileCallCollectionMethodAndWriteFilePrivate("insert", document);
	}
	update(document) {
		return this.readFileCallCollectionMethodAndWriteFilePrivate("update", document);
	}
	delete(id) {
		return this.readFileCallCollectionMethodAndWriteFilePrivate("delete", id);
	}
	getById(id) {
		return this.readFileAndCallCollectionMethodPrivate("getById", id);
	}
	find(query) {
		return this.readFileAndCallCollectionMethodPrivate("find", query);
	}
	import(documents) {
		return this.initializeIfNecessaryPrivate()
			.then(() => {
				const result = this._collection.import(documents);
				return JsonDb.writeFilePrivate(
					this.fileNameDocuments,
					this._collection.documents,
				)
					.then(() => result);
			});
	}
	importToAppend(documents) {
		return this.readFileAndCallCollectionMethodPrivate("importToAppend", documents)
			.then((result) => JsonDb.writeFilePrivate(
				this.fileNameDocuments,
				this._collection.documents,
			)
				.then(() => result),
			);
	}
	getNbDocuments() {
		return this.initializeIfNecessaryPrivate()
			.then(() => JsonDb.readFilePrivate(this.fileNameDocuments))
			.then((documents) => _.size(documents));
	}

	/*================================================
	                   Méthode Privée
	 ================================================*/
	static readFilePrivate(fileName) {
		return new Promise((resolve, reject) => {
			fs.readFile(fileName, {
				encoding: "utf8",
			}, (error, data) => {
				if (error) {
					return reject(error);
				}
				resolve(JSON.parse(data));
			});
		});
	}
	static writeFilePrivate(fileName, data) {
		return new Promise((resolve, reject) => {
			fs.writeFile(
				fileName,
				JSON.stringify(data), {
					encoding: "utf8",
					mode: 0o660,
				},
				(error) => {
					if (error) {
						return reject(error);
					}
					resolve();
				},
			);
		});
	}
	initializePrivate() {
		return JsonDb.readFilePrivate(this.fileNameStructure)
			.then((structure) => {
				this._collection = new Collection(structure);
			});
	}
	initializeIfNecessaryPrivate() {
		return Promise.resolve(!this._collection ? this.initializePrivate() : this._collection);
	}
	readFileAndCallCollectionMethodPrivate(method, parameter) {
		return this.initializeIfNecessaryPrivate()
			.then(() => JsonDb.readFilePrivate(this.fileNameDocuments))
			.then((documents) => {
				this._collection.documents = documents;
				return this._collection[method](parameter);
			});
	}
	readFileCallCollectionMethodAndWriteFilePrivate(method, parameter) {
		return this.readFileAndCallCollectionMethodPrivate(method, parameter)
			.then((result) => {
				if (!result.success) {
					const error = new Error(result.error);
					error.reasons = result.reasons;
					return Promise.reject(error);
				}
				return JsonDb.writeFilePrivate(
					this.fileNameDocuments,
					this._collection.documents,
				).then(() => result);
			});
	}
}

module.exports = JsonDb;
