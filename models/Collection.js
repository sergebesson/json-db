"use strict";

const _ = require("lodash");
const uniqid = require("uniqid");
const Ajv = require("ajv");
const ajvFormats = require("ajv-formats");
const removeAccents = require("remove-accents");
const escapeStringRegexp = require("escape-string-regexp");

class Collection {
	constructor(structure) {
		this._structure = _.defaultsDeep({}, structure, {idName: "_id"});
		this._structure.idName = this._structure.idName || "_id";
		this._documents = {};
		this.idName = this._structure.idName;
		this.searchIndex = this._structure.searchIndex || null;

		if (_.isObject(this._structure.jsonSchema)) {
			const ajv = new Ajv({allErrors: true});
			ajvFormats(ajv);
			this.ajvValidate = ajv.compile(this._structure.jsonSchema);
		}

	}
	get structure() {
		return this._structure;
	}
	get documents() {
		return this._documents;
	}
	set documents(documents) {
		this._documents = _.isPlainObject(documents) ? documents : {};
	}
	get length() {
		return _.size(this._documents);
	}
	insert(document) {
		// insert dans documents
		const documentWithId = _.defaults({}, document, {[this.idName]: uniqid.process()});

		if (!this._validateDocument(documentWithId)) {
			return {
				success: false,
				error: "invalidDocument",
				reasons: this._getAjvError(),
			};
		}

		if (this._documents[documentWithId[this.idName]]) {
			return {
				success: false,
				error: "alreadyExists",
			};
		}

		this._documents[documentWithId[this.idName]] = this._createPrivateSearch(documentWithId);
		return {
			success: true,
			document: documentWithId,
		};
	}
	update(document) {
		if (!this._validateDocument(document)) {
			return {
				success: false,
				error: "invalidDocument",
				reasons: this._getAjvError(),
			};
		}

		if (!document[this.idName]) {
			return {
				success: false,
				error: "identifierIsMandatory",
			};
		}
		if (_.isUndefined(this._documents[document[this.idName]])) {
			return {
				success: false,
				error: "notExist",
			};
		}
		this._documents[document[this.idName]] = this._createPrivateSearch(document);
		return {
			success: true,
			document: document,
		};
	}
	delete(id) {
		if (!this._documents[id]) {
			return {
				success: false,
				error: "notExist",
			};
		}
		delete this._documents[id];
		return {
			success: true,
		};
	}
	getById(id) {
		if (this._documents[id]) {
			return Collection._documentWithoutPrivate(this._documents[id]);
		}
	}
	find(query) {
		return _.chain(this._documents)
			.filter(query)
			.map(Collection._documentWithoutPrivate)
			.value();
	}
	search({query, search = ""}) {
		const searchString = _.isString(search) ? search.trim() : "";
		const filterRegExp = RegExp(
			escapeStringRegexp(removeAccents(searchString))
				.toLowerCase()
				.replace(/\s+/g, ".*"),
		);

		return _.chain(this._documents)
			.filter(query)
			.filter((document) => filterRegExp.test(_.get(document, "__private__.search", "")))
			.map(Collection._documentWithoutPrivate)
			.value();
	}
	import(documents) {
		this._documents = {};
		return this.importToAppend(documents);
	}
	importToAppend(documents) {
		let numberDocumentsInserted = 0;
		let numberDocumentsInError = 0;
		const documentsInError = [];
		documents.forEach((document) => {
			const result = this.insert(document);
			if (!result.success) {
				++numberDocumentsInError;
				documentsInError.push({
					error: result.error,
					document,
				});
				return;
			}
			++numberDocumentsInserted;
		});
		return !numberDocumentsInError ?
			{
				success: true,
				numberDocumentsInserted,
			} :
			{
				success: false,
				numberDocumentsInserted,
				numberDocumentsInError,
				documentsInError,
			};
	}

	_validateDocument(document) {
		return this.ajvValidate ? this.ajvValidate(document) : true;
	}
	_getAjvError() {
		return _.map(this.ajvValidate.errors,
			(error) => _.omit(error, ["schemaPath"]));
	}
	_createPrivateSearch(document) {
		const documentWithPrivate = _.cloneDeep(document);
		if (this.searchIndex !== null) {
			const search = removeAccents(
				this.searchIndex
					.reduce(
						(accumulateur, property) =>
							`${ accumulateur } ${ _.get(documentWithPrivate, property, "") }`,
						"",
					)
					.trim()
					// supprime les blancs en double
					.replace(/[\s\uFEFF\xA0]{2,}/g, " "),
			)
				.toLowerCase();
			_.set(documentWithPrivate, "__private__.search", search);
		}
		return documentWithPrivate;
	}
	static _documentWithoutPrivate(document) {
		return _.omit(document, "__private__");
	}
}
module.exports = Collection;
