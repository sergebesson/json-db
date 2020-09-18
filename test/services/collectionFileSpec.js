"use strict";

const {sinon, chai: {expect}, example} = require("sb-test-helpers");

const fs = require("fs");
const JsonDb = require("../../services/JsonDb.js");

describe("collection file service", function () {
	describe("create()", function () {
		beforeEach(function () {
			// GIVEN
			this.fsStub = sinon.stub(fs, "writeFile");
		});
		afterEach(function () {
			this.fsStub.restore();
		});
		it("Doit créer les fichiers", function () {
			// GIVEN
			this.fsStub.callsArg(3);
			// WHEN
			const jsonDb = new JsonDb("/path/file");
			// THEN
			return jsonDb.create()
				.then(() => {
					expect(this.fsStub.calledTwice)
						.to.be.equals(true, "fs.writeFile n'a pas été appelé 2 fois");
					expect(this.fsStub.calledWith("/path/file.structure.json"
						, "{\"idName\":\"_id\"}"))
						.to.be.equals(true, "fs.writeFile n'a pas été appelé pour l'écriture de la structure");
					expect(this.fsStub.calledWith("/path/file.documents.json", "{}"))
						.to.be.equals(true, "fs.writeFile n'a pas été appelé pour l'écriture de les documents");
				});
		});
		it("Doit retourner une erreur en cas d'impossibilité d'écrire la structure", function () {
			// GIVEN
			this.fsStub.callsArgWith(3, new Error("Error fs.writeFile Structure"));
			// WHEN
			const jsonDb = new JsonDb("/path/file");
			// THEN
			return jsonDb.create()
				.then(() => {
					return Promise.reject(new Error("create ne doit pas être résolu"));
				}, (error) => {
					expect(error.message).to.be.equals("Error fs.writeFile Structure");
					expect(this.fsStub.calledOnce)
						.to.be.equals(true, "fs.writeFile n'a pas été appelé qu'une fois");
				});
		});
		it("Doit retourner une erreur en cas d'impossibilité d'écrire les documents", function () {
			// GIVEN
			this.fsStub.onFirstCall().callsArg(3);
			this.fsStub.callsArgWith(3, new Error("Error fs.writeFile Documents"));
			// WHEN
			const jsonDb = new JsonDb("/path/file");
			// THEN
			return jsonDb.create()
				.then(() => {
					return Promise.reject(new Error("create ne doit pas être résolu"));
				}, (error) => {
					expect(error.message).to.be.equals("Error fs.writeFile Documents");
					expect(this.fsStub.calledTwice)
						.to.be.equals(true, "fs.writeFile n'a pas été appelé deux fois");
				});
		});
	});
	describe("getStructure()", function () {
		beforeEach(function () {
			// GIVEN
			this.fsReadStub = sinon.stub(fs, "readFile");
			this.fsReadStub.withArgs("/path/file.structure.json")
				.callsArgWith(2, null, "{\"idName\": \"_id\"}");

			this.jsonDb = new JsonDb("/path/file");
		});
		afterEach(function () {
			this.fsReadStub.restore();
		});
		it("doit retourner la structure de la connection", function () {
			// WHEN
			return this.jsonDb.getStructure()
				.then((structure) => {
					expect(structure).to.deep.equals({idName: "_id"}, "Le résultat retourné n'est pas correcte");
				});
		});
	});
	describe("insert(), update(), delete(), importToAppend()", function () {
		beforeEach(function () {
			// GIVEN
			this.fsReadStub = sinon.stub(fs, "readFile");
			this.fsReadStub.withArgs("/path/file.structure.json")
				.callsArgWith(2, null, "{\"idName\": \"_id\"}");
			this.fsReadStub.withArgs("/path/file.documents.json")
				.callsArgWith(2, null, "{\"1\": {\"_id\": 1}}");
			this.fsReadStub.callsArgWith(2, new Error("Erreur appel fs.read"));

			this.fsWriteStub = sinon.stub(fs, "writeFile");
			this.fsWriteStub.callsArg(3);

			this.jsonDb = new JsonDb("/path/file");
		});
		afterEach(function () {
			this.fsReadStub.restore();
			this.fsWriteStub.restore();
		});

		example([{
			describe: "insert()",
			method: "insert",
			parameter: {_id: 2, key1: "value1"},
			expectDocumentsWrite: {1: {_id: 1}, 2: {_id: 2, key1: "value1"}},
			parameterError: {_id: 1, key1: "value1"},
			expectError: "alreadyExists",
		}, {
			describe: "update()",
			method: "update",
			parameter: {_id: 1, key1: "value1"},
			expectDocumentsWrite: {1: {_id: 1, key1: "value1"}},
			parameterError: {_id: 2, key1: "value1"},
			expectError: "notExist",
		}, {
			describe: "delete()",
			method: "delete",
			parameter: 1,
			expectDocumentsWrite: {},
			parameterError: 2,
			expectError: "notExist",
		}], function () {
			it("doit récupérer les documents, appeler la méthode, puis enregistrer", function () {
				// THEN
				return this.jsonDb[this.method](this.parameter)
					.then(() => {
						expect(this.fsWriteStub.calledOnce)
							.to.be.equals(true, "fs.writeFile n'a pas été appelé qu'une fois");
						expect(this.fsWriteStub.calledWith(
							"/path/file.documents.json",
							JSON.stringify(this.expectDocumentsWrite),
						))
							.to.be.equals(true, "fs.writeFile n'a pas été appelé pour l'écriture des documents");
					});
			});
			it("doit retourner une erreur avec un mauvais paramètre", function () {
				// WHEN
				return this.jsonDb[this.method](this.parameterError)
					.then(() => {
						return Promise.reject(new Error("La method doit retourner une erreur"));
					},
					(error) => {
						expect(error.message).to.be.equals(this.expectError);
					});
			});
			it("doit retourner une erreur si on arrive pas a lire les documents du fichier", function () {
				// GIVEN
				this.fsReadStub.withArgs("/path/file.documents.json")
					.callsArgWith(2, new Error("Error fs.readFile Documents"));
				// WHEN
				return this.jsonDb[this.method](this.parameter)
					.then(() => {
						return Promise.reject(new Error("La méthode doit retourner une erreur"));
					},
					(error) => {
						expect(error.message).to.be.equals("Error fs.readFile Documents");
					});
			});
		});
	});
	describe("getById(), find(), getNbDocuments", function () {
		beforeEach(function () {
			// GIVEN
			this.fsReadStub = sinon.stub(fs, "readFile");
			this.fsReadStub.withArgs("/path/file.structure.json")
				.callsArgWith(2, null, "{\"idName\": \"_id\"}");
			this.fsReadStub.withArgs("/path/file.documents.json")
				.callsArgWith(2, null, "{\"1\": {\"_id\": 1, \"name\": \"value name\"}}");
			this.fsReadStub.callsArgWith(2, new Error("Erreur appel fs.read"));

			this.jsonDb = new JsonDb("/path/file");
		});
		afterEach(function () {
			this.fsReadStub.restore();
		});

		example([{
			describe: "getById()",
			method: "getById",
			parameter: 1,
			expectResult: {_id: 1, name: "value name"},
		}, {
			describe: "find()",
			method: "find",
			parameter: {name: "value name"},
			expectResult: [{_id: 1, name: "value name"}],
		}, {
			describe: "getNbDocuments()",
			method: "getNbDocuments",
			expectResult: 1,
		}], function () {
			it("doit récupérer les documents, appeler la méthode et retourner le résultat", function () {
				// THEN
				return this.jsonDb[this.method](this.parameter)
					.then((result) => {
						expect(result).to.deep.equals(this.expectResult, "Le résultat retourné n'est pas correcte");
					});
			});
			it("doit retourner une erreur si on arrive pas a lire les documents du fichier", function () {
				// GIVEN
				this.fsReadStub.withArgs("/path/file.documents.json")
					.callsArgWith(2, new Error("Error fs.readFile Documents"));
				// WHEN
				return this.jsonDb[this.method](this.parameter)
					.then(() => {
						return Promise.reject(new Error("La méthode doit retourner une erreur"));
					},
					(error) => {
						expect(error.message).to.be.equals("Error fs.readFile Documents");
					});
			});
		});
	});
	describe("import()", function () {
		beforeEach(function () {
			// GIVEN
			this.fsReadStub = sinon.stub(fs, "readFile");
			this.fsReadStub.withArgs("/path/file.structure.json")
				.callsArgWith(2, null, "{\"idName\": \"_id\"}");
			this.fsReadStub.callsArgWith(2, new Error("Erreur appel fs.read"));

			this.fsWriteStub = sinon.stub(fs, "writeFile");
			this.fsWriteStub.callsArg(3);

			this.jsonDb = new JsonDb("/path/file");
		});
		afterEach(function () {
			this.fsReadStub.restore();
			this.fsWriteStub.restore();
		});
		it("doit appeler la méthode, puis enregistrer", function () {
			// THEN
			return this.jsonDb.import([{_id: 2}, {_id: 3}])
				.then(() => {
					expect(this.fsWriteStub.calledOnce)
						.to.be.equals(true, "fs.writeFile n'a pas été appelé qu'une fois");
					expect(this.fsWriteStub.calledWith(
						"/path/file.documents.json",
						JSON.stringify({2: {_id: 2}, 3: {_id: 3}}),
					))
						.to.be.equals(true, "fs.writeFile n'a pas été appelé pour l'écriture des documents");
				});
		});
	});
	describe("importToAppend()", function () {
		beforeEach(function () {
			// GIVEN
			this.fsReadStub = sinon.stub(fs, "readFile");
			this.fsReadStub.withArgs("/path/file.structure.json")
				.callsArgWith(2, null, "{\"idName\": \"_id\"}");
			this.fsReadStub.withArgs("/path/file.documents.json")
				.callsArgWith(2, null, "{\"1\": {\"_id\": 1}}");
			this.fsReadStub.callsArgWith(2, new Error("Erreur appel fs.read"));

			this.fsWriteStub = sinon.stub(fs, "writeFile");
			this.fsWriteStub.callsArg(3);

			this.jsonDb = new JsonDb("/path/file");
		});
		afterEach(function () {
			this.fsReadStub.restore();
			this.fsWriteStub.restore();
		});
		it("doit récupérer les documents, appeler la méthode, puis enregistrer", function () {
			// THEN
			return this.jsonDb.importToAppend([{_id: 2}, {_id: 3}])
				.then(() => {
					expect(this.fsWriteStub.calledOnce)
						.to.be.equals(true, "fs.writeFile n'a pas été appelé qu'une fois");
					expect(this.fsWriteStub.calledWith(
						"/path/file.documents.json",
						JSON.stringify({1: {_id: 1}, 2: {_id: 2}, 3: {_id: 3}}),
					))
						.to.be.equals(true, "fs.writeFile n'a pas été appelé pour l'écriture des documents");
				});
		});
	});
});
