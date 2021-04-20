"use strict";

const _ = require("lodash");
const {sinon, chai: {expect}, example} = require("@sbesson/test-helpers");
const uniqid = require("uniqid");

const CollectionModel = require("../../models/Collection.js");

describe("Collection model", function () {
	describe("new CollectionModel()", function () {
		example([
			{
				structure: {},
				structureExpect: {
					idName: "_id",
				},
			}, {
				structure: null,
				structureExpect: {
					idName: "_id",
				},
			}, {
				structure: undefined,
				structureExpect: {
					idName: "_id",
				},
			}, {
				structure: {
					idName: "name",
				},
				structureExpect: {
					idName: "name",
				},
			}, {
				structure: {
					idName: "",
				},
				structureExpect: {
					idName: "_id",
				},
			}, {
				structure: {
					idName: "identity",
				},
				structureExpect: {
					idName: "identity",
				},
			},
		]
		, function () {
			it("Doit retourne le json de la collection", function () {
				// WHEN
				const collection = new CollectionModel(this.structure);
				// THEN
				expect(collection.structure).to.deep.equals(this.structureExpect);
			});
		});
	});
	describe("set documents()", function () {
		example([{
			documents: undefined,
			expectDocuments: {},
			expectLength: 0,
		}, {
			documents: null,
			expectDocuments: {},
			expectLength: 0,
		}, {
			documents: [1, 2],
			expectDocuments: {},
			expectLength: 0,
		}, {
			documents: "documents is a string",
			expectDocuments: {},
			expectLength: 0,
		}, {
			documents: true,
			expectDocuments: {},
			expectLength: 0,
		}, {
			documents: {
				id1: {_id: "id1", otherAttr: "value otherAttr 1"},
				id2: {_id: "id2", otherAttr: "value otherAttr 2"},
			},
			expectDocuments: {
				id1: {_id: "id1", otherAttr: "value otherAttr 1"},
				id2: {_id: "id2", otherAttr: "value otherAttr 2"},
			},
			expectLength: 2,
		}], function () {
			it("Doit mettre à jour les documents ey le nombre de document (length)", function () {
				// WHEN
				const collection = new CollectionModel();
				collection.documents = this.documents;
				// THEN
				expect(collection.documents).to.deep.equals(this.expectDocuments);
				expect(collection.length).to.be.equal(this.expectLength);
			});
		});
	});
	example([{
		describe: "le nom de l'identifiant est _id",
		structure: {},
	}, {
		describe: "le nom de l'identifiant est name",
		structure: {idName: "name"},
	}], function () {
		beforeEach(function () {
			this.collection = new CollectionModel(this.structure);
			this.idName = this.collection.structure.idName;
		});
		describe("insert()", function () {
			it("doit insérer un nouveau document qui a son propre id", function () {
				// GIVEN
				const newDocument = {
					[this.idName]: "id",
					autreAttribut: "value attribut",
				};
				// WHEN
				const expectDocument = this.collection.insert(newDocument);
				// THEN
				expect(expectDocument).to.deep.equals({
					success: true,
					document: newDocument,
				});
				expect(this.collection.documents).to.deep.equals({id: newDocument});
			});
			it("doit insérer un nouveau document qui n'a pas d'id de défini", function () {
				// GIVEN
				const newDocument = {
					autreAttribut: "value attribut",
				};
				this.uniqidStub = sinon.stub(uniqid, "process")
					.returns("uniqid");
				// WHEN
				const expectDocument = this.collection.insert(newDocument);
				this.uniqidStub.restore();
				// THEN
				expect(expectDocument).to.deep.equals({
					success: true,
					document: {
						[this.idName]: "uniqid",
						autreAttribut: "value attribut",
					},
				});
				expect(this.collection.documents).to.deep.equals({
					uniqid: {
						[this.idName]: "uniqid",
						autreAttribut: "value attribut",
					},
				});
			});
			it("ne doit pas insérer un nouveau document avec un id existant", function () {
				// GIVEN
				const newDocument = {
					[this.idName]: "idExisting",
					autreAttribut: "value attribut",
				};
				const newDocument2 = {
					[this.idName]: "idExisting",
					autreAttribut2: "value attribut 2",
				};
				// WHEN
				this.collection.insert(newDocument);
				const expectDocument = this.collection.insert(newDocument2);
				// THEN
				expect(expectDocument).to.deep.equals({
					success: false,
					error: "alreadyExists",
				});
			});
		});
		describe("update()", function () {
			beforeEach(function () {
				const newDocument = {
					[this.idName]: "id",
					autreAttribut: "value attribut",
				};
				this.collection.insert(newDocument);
			});
			it("doit mettre à jour un document", function () {
				// GIVEN
				const updateDocument = {
					[this.idName]: "id",
					autreAttribut: "value attribut mis à jour",
					newAttribut: "nouvel attribut",
				};
				// WHEN
				const expectDocument = this.collection.update(updateDocument);
				// THEN
				expect(expectDocument).to.deep.equals({
					success: true,
					document: updateDocument,
				});
				expect(this.collection.documents).to.deep.equals({id: updateDocument});
			});
			it("doit retourner une erreur si le document ne contient pas d'id", function () {
				// GIVEN
				const updateDocument = {
					autreAttribut: "value attribut mis à jour",
					newAttribut: "nouvel attribut",
				};
				// WHEN
				const expectDocument = this.collection.update(updateDocument);
				// THEN
				expect(expectDocument).to.deep.equals({
					success: false,
					error: "identifierIsMandatory",
				});
			});
			it("doit retourner une erreur si le document n'existe pas", function () {
				// GIVEN
				const updateDocument = {
					[this.idName]: "idOther",
					autreAttribut: "value attribut mis à jour",
					newAttribut: "nouvel attribut",
				};
				// WHEN
				const expectDocument = this.collection.update(updateDocument);
				// THEN
				expect(expectDocument).to.deep.equals({
					success: false,
					error: "notExist",
				});
			});
		});
		describe("delete()", function () {
			beforeEach(function () {
				const newDocument = {
					[this.idName]: "id",
					autreAttribut: "value attribut",
				};
				this.collection.insert(newDocument);
			});
			it("doit supprimer un document", function () {
				// WHEN
				const expectReturn = this.collection.delete("id");
				// THEN
				expect(expectReturn).to.deep.equals({
					success: true,
				});
				expect(this.collection.documents.id).to.be.undefined;
			});
			it("doit retourner une erreur si l'id ne correspond à aucun document", function () {
				// WHEN
				const expectDocument = this.collection.delete("idNotExist");
				// THEN
				expect(expectDocument).to.deep.equals({
					success: false,
					error: "notExist",
				});
			});
		});
		describe("getById()", function () {
			it("doit retourner le document avec l'id id", function () {
				// GIVEN
				const newDocument = {
					[this.idName]: "id",
					autreAttribut: "value attribut",
				};
				this.collection.insert(newDocument);
				// WHEN
				const expectReturn = this.collection.getById("id");
				// THEN
				expect(expectReturn).to.deep.equals(newDocument);
			});
			it("doit retourner undefined si l'id n'existe pas", function () {
				// WHEN
				const expectReturn = this.collection.getById("id");
				// THEN
				expect(expectReturn).to.be.undefined;
			});
		});
	});
	describe("find()", function () {
		beforeEach(function () {
			this.collection = new CollectionModel({idName: "name"});
			const documentsToInsert = [{
				name: "document1",
				other: "value other",
				age: 10,
				actif: true,
			}, {
				name: "document2",
				other: "value other",
				age: 20,
				actif: true,
			}, {
				name: "document3",
				other: "new value other",
				age: 10,
				actif: false,
			}];
			documentsToInsert.forEach((document) => this.collection.insert(document));
		});
		example([{
			query: {age: 10},
			expectResult: [{
				name: "document1",
				other: "value other",
				age: 10,
				actif: true,
			}, {
				name: "document3",
				other: "new value other",
				age: 10,
				actif: false,
			}],
		}, {
			query: "actif",
			expectResult: [{
				name: "document1",
				other: "value other",
				age: 10,
				actif: true,
			}, {
				name: "document2",
				other: "value other",
				age: 20,
				actif: true,
			}],
		}, {
			query: {other: "value other", age: 20},
			expectResult: [{
				name: "document2",
				other: "value other",
				age: 20,
				actif: true,
			}],
		}, {
			query: {age: 30},
			expectResult: [],
		}, {
			query: null,
			expectResult: [{
				name: "document1",
				other: "value other",
				age: 10,
				actif: true,
			}, {
				name: "document2",
				other: "value other",
				age: 20,
				actif: true,
			}, {
				name: "document3",
				other: "new value other",
				age: 10,
				actif: false,
			}],
		}, {
			query: undefined,
			expectResult: [{
				name: "document1",
				other: "value other",
				age: 10,
				actif: true,
			}, {
				name: "document2",
				other: "value other",
				age: 20,
				actif: true,
			}, {
				name: "document3",
				other: "new value other",
				age: 10,
				actif: false,
			}],
		}, {
			query: "",
			expectResult: [],
		}, {
			query: (document) => {
				return document.other === "new value other" ||
					document.age === 20;
			},
			expectResult: [{
				name: "document2",
				other: "value other",
				age: 20,
				actif: true,
			}, {
				name: "document3",
				other: "new value other",
				age: 10,
				actif: false,
			}],
		}], function () {
			it("doit retourner la bonne liste de documents", function () {
				// WHEN
				const expectReturn = this.collection.find(this.query);
				// THEN
				expect(expectReturn).to.deep.equals(this.expectResult);
			});
		});
	});
	describe("import() and importToAppend()", function () {
		beforeEach(function () {
			this.collection = new CollectionModel({idName: "name"});
			this.documentsToImport = [{
				name: "document1",
				other: "value other",
				age: 10,
				actif: true,
			}, {
				name: "document2",
				other: "value other",
				age: 20,
				actif: true,
			}, {
				name: "document3",
				other: "new value other",
				age: 10,
				actif: false,
			}];
			this.collection.insert({
				name: "document2",
				other: "value other initial",
				age: 25,
				actif: true,
			});
		});
		it("Doit importer les documents apres avoir vider les autres documents", function () {
			// WHEN
			const expectReturn = this.collection.import(this.documentsToImport);
			// THEN
			expect(expectReturn).to.deep.equals({
				success: true,
				numberDocumentsInserted: 3,
			});
			expect(this.collection.documents).to.deep.equals({
				document1: {
					name: "document1",
					other: "value other",
					age: 10,
					actif: true,
				},
				document2: {
					name: "document2",
					other: "value other",
					age: 20,
					actif: true,
				},
				document3: {
					name: "document3",
					other: "new value other",
					age: 10,
					actif: false,
				},
			});
		});
		it("Doit retourner des erreurs lors de l'import de documents avec le meme id", function () {
			// GIVEN
			this.documentsToImport.push({
				name: "document1",
				other: "value other error",
			}, {
				name: "document3",
				other: "new value other error",
			});
			// WHEN
			const expectReturn = this.collection.import(this.documentsToImport);
			// THEN
			expect(expectReturn).to.deep.equals({
				success: false,
				numberDocumentsInserted: 3,
				numberDocumentsInError: 2,
				documentsInError: [{
					error: "alreadyExists",
					document: {
						name: "document1",
						other: "value other error",
					},
				}, {
					error: "alreadyExists",
					document: {
						name: "document3",
						other: "new value other error",
					},
				}],
			});
			expect(this.collection.documents).to.deep.equals({
				document1: {
					name: "document1",
					other: "value other",
					age: 10,
					actif: true,
				},
				document2: {
					name: "document2",
					other: "value other",
					age: 20,
					actif: true,
				},
				document3: {
					name: "document3",
					other: "new value other",
					age: 10,
					actif: false,
				},
			});
		});
		it("doit importer en ajoutant de nouveaux documents", function () {
			// WHEN
			const expectReturn = this.collection.importToAppend([{
				name: "document1",
				other: "value other",
				age: 10,
				actif: true,
			}, {
				name: "document3",
				other: "new value other",
				age: 10,
				actif: false,
			}]);
			// THEN
			expect(expectReturn).to.deep.equals({
				success: true,
				numberDocumentsInserted: 2,
			});
			expect(this.collection.documents).to.deep.equals({
				document1: {
					name: "document1",
					other: "value other",
					age: 10,
					actif: true,
				},
				document2: {
					name: "document2",
					other: "value other initial",
					age: 25,
					actif: true,
				},
				document3: {
					name: "document3",
					other: "new value other",
					age: 10,
					actif: false,
				},
			});
		});
		it("Doit retourner des erreurs lors de l'import en ajoutant des documents avec un id existant", function () {
			// WHEN
			const expectReturn = this.collection.importToAppend(this.documentsToImport);
			// THEN
			expect(expectReturn).to.deep.equals({
				success: false,
				numberDocumentsInserted: 2,
				numberDocumentsInError: 1,
				documentsInError: [{
					error: "alreadyExists",
					document: {
						name: "document2",
						other: "value other",
						age: 20,
						actif: true,
					},
				}],
			});
			expect(this.collection.documents).to.deep.equals({
				document1: {
					name: "document1",
					other: "value other",
					age: 10,
					actif: true,
				},
				document2: {
					name: "document2",
					other: "value other initial",
					age: 25,
					actif: true,
				},
				document3: {
					name: "document3",
					other: "new value other",
					age: 10,
					actif: false,
				},
			});
		});
	});
	describe("Json Schema", function () {
		beforeEach(function () {
			// GIVEN
			this.collection = new CollectionModel({
				idName: "name",
				jsonSchema: {
					title: "test",
					description: "json schema de test",
					type: "object",
					properties: {
						name: {
							type: "string",
						},
					},
				},
			});
		});
		example([{
			describe: "insert()",
			method: "insert",
		}, {
			describe: "update()",
			method: "update",
		}], function () {
			beforeEach(function () {
				if (this.method === "update") {
					this.collection.insert({name: "value of name"});
				}
			});
			it("doit retourner une erreur lors de l'insertion d'un document qui ne valide pas le Json Schema", function () {
				// WHEN
				const expectReturn = this.collection[this.method]({
					name: 20,
				});
				// THEN
				expect(expectReturn).to.deep.equals({
					success: false,
					error: "invalidDocument",
					reasons: [{
						instancePath: "/name",
						keyword: "type",
						message: "must be string",
						params: {
							type: "string",
						},
					}],
				});
			});
			it("doit accepter le document s'il valide le Json Schema", function () {
				// WHEN
				const expectReturn = this.collection[this.method]({
					name: "value of name",
				});
				// THEN
				expect(expectReturn).to.deep.equals({
					success: true,
					document: {name: "value of name"},
				});
			});
		});
	});
	describe("index search", function () {
		beforeEach(function () {
			// GIVEN
			this.collection = new CollectionModel({
				searchIndex: ["nom", "prenom", "metadata.age"],
			});
		});
		describe("insert()", function () {
			example([{
				describe: "Avec tous les champs",
				document: {_id: "id", nom: "   Le Nom  ", prenom: "Le   PréNom   ", metadata: {age: 51}},
				expectSearch: "le nom le prenom 51",
			}, {
				describe: "Avec des champs non renseignés",
				document: {_id: "id", nom: "   Le   Nom   tout   seul    !!!     "},
				expectSearch: "le nom tout seul !!!",
			}], function () {
				it("doit générer correctement le champs search", function () {
					// WHEN
					const expectReturn = this.collection.insert(this.document);
					// THEN
					expect(expectReturn.success).to.equal(true);
					expect(expectReturn.document).to.deep.equals(this.document);
					expect(_.get(this.collection.documents.id, "__private__.search")).to.equal(this.expectSearch);
				});
			});
		});
		describe("update()", function () {
			beforeEach(function () {
				this.collection.insert({_id: "id"});
			});
			example([{
				describe: "Avec tous les champs",
				document: {_id: "id", nom: "   Le Nom  ", prenom: "Le   PréNom   ", metadata: {age: 51}},
				expectSearch: "le nom le prenom 51",
			}, {
				describe: "Avec des champs non renseignés",
				document: {_id: "id", nom: "   Le   Nom   tout   seul    !!!     "},
				expectSearch: "le nom tout seul !!!",
			}], function () {
				it("doit générer correctement le champs search", function () {
					// WHEN
					const expectReturn = this.collection.update(this.document);
					// THEN
					expect(expectReturn.success).to.equal(true);
					expect(expectReturn.document).to.deep.equals(this.document);
					expect(_.get(this.collection.documents.id, "__private__.search")).to.equal(this.expectSearch);
				});
			});
		});
		describe("getById()", function () {
			it("ne doit pas retourner le __private__", function () {
				// GIVEN
				this.collection.import([{
					_id: "2",
					name: "nom",
					prenom: "prénom",
					metadata: {age: 20},
				}]);
				// WHEN
				expect(this.collection.getById("2"))
				// THEN
					.to.not.have.property("__private__");
			});
		});
		describe("find()", function () {
			it("ne doit pas retourner le __private__", function () {
				// GIVEN
				this.collection.import([{
					_id: "2",
					name: "nom",
					prenom: "prénom",
					metadata: {age: 20},
				}]);
				// WHEN
				expect(this.collection.find()[0])
				// THEN
					.to.not.have.property("__private__");
			});
		});
		describe("search()", function () {
			beforeEach(function () {
				const documentsToInsert = [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}];
				this.collection.import(documentsToInsert);
			});
			example([{
				query: {metadata: {age: 10}},
				search: "prenom",
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				query: "actif",
				search: "other",
				expectResult: [{
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}],
			}, {
				query: "actif",
				search: "10",
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}],
			}, {
				query: {prenom: "new prenom"},
				expectResult: [{
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				query: {prenom: "new prenom"},
				search: "other",
				expectResult: [],
			}, {
				search: "prénom 10",
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				query: null,
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				search: null,
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				query: undefined,
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				search: undefined,
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				query: "",
				expectResult: [],
			}, {
				search: "",
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}, {
				expectResult: [{
					_id: "1",
					name: "nom 1",
					prenom: "prénom value",
					metadata: {age: 10},
					actif: true,
				}, {
					_id: "2",
					name: "nom 2",
					prenom: "other prénom",
					metadata: {age: 20},
					actif: true,
				}, {
					_id: "3",
					name: "nom 3",
					prenom: "new prenom",
					metadata: {age: 10},
					actif: false,
				}],
			}], function () {
				it("doit retourner la bonne liste de documents", function () {
					// WHEN
					const expectReturn = this.collection.search({
						query: this.query,
						search: this.search,
					});
					// THEN
					expect(expectReturn).to.deep.equals(this.expectResult);
				});
			});
		});
	});
});
