# json-db

<!-- TOC -->

- [Description](#description)
- [API](#api)
- [Structure du json sauvegardé](#structure-du-json-sauvegardé)
- [Commande CLI](#commande-cli)
  - [L'aide](#laide)
    - [create](#create)
- [Divers pour le dev](#divers-pour-le-dev)
  - [TODO](#todo)
  - [Modules intéressants](#modules-intéressants)

<!-- /TOC -->

## Description

_**Gère une collection de document json, persistant en fichier**_

## API

Toutes les méthodes retournent une promise

* **new JsonDb (file)** : Création d'un objet JsonDb
* **jsonDb.collection** : Attribut en lecture seul permettant d'accéder à la collection
* **jsonDb.create(structure, [documents])** : Permet de créer une collection vide ou initialisé avec une liste de documents
* **jsonDb.getStructure()** : Permet de récupérer la structure de la collection
* **jsonDb.loadCollection** : Permet de charger la collection depuis le disque et retourne la collection à jour
* **jsonDb.insert(document)** : Permet d'insérer un document, retourne le document avec son id
* **jsonDb.update(document)** : Permet de mettre à jour un document
* **jsonDb.delete(id)** : Permet de supprimer un document
* **jsonDb.getById(id) :** Permet de récupérer un document par son id
* **jsonDb.find(query)** : Permet de rechercher des documents en fonction d'une query
* **jsonDb.getNbDocuments** : Permet de récupérer le nombre de documents de la collection
* **jsonDb.import(documents)** : Import une liste de documents
* **jsonDb.importToAppend(documents)** : Import une liste de documents

## Structure du json sauvegardé

```javascript
{
  structure : {
    idName: "_id", /* default */
    jsonSchema: null, /* facultatif jsonSchema de validation d'un document */
    searchIndex: [properties1, properties2 ], /* facultatif, liste les champs text sur lequel la méthode search fera sa recherche */
  },
  documents: {
    id1: {...},
    id2: {...},
    ....
    id10: {...},
  }
}
```

## Commande CLI

`json-db _commande_ [--collection|--coll|-c] _fichier_ [options]`

* **--collection, --coll, -c**: Fichiers de la collection. exemple -c /path/myCollection correspond au fichier /path/myCollection.structure.json et /path/myCollection.documents.json
* **commands**:
  * **[create|c]** : Création d'une collection
  * **[insert|i]** : Insert un document dans la collection
  * **[update|u]** : Mets à jour un document dans la collection
  * **[delete|d]** : Suppression un document dans la collection
  * **[get|g]** : Affiche un document
  * **[find|f]** : Liste des documents en fonction d'une recherche
  * **[import|m]** : Importe une liste de document
  * **[help] command** : affiche l'aide d'une commande

### L'aide

```none
$ cli/json-db.js help

Usage: cli/json-db.js <commande> --collection fichier [options]

Commandes:
  create [options]  Création d'une collection                                      [aliases: cre, c]
  delete <id>       suppression d'un document                                      [aliases: del, d]
  find [options]    recherche de documents                                              [aliases: f]
  get <id>          Affichage d'un document                                             [aliases: g]
  insert [options]  insertion d'un document                                        [aliases: ins, i]
  update [options]  mise à jour d'un document                                      [aliases: upd, u]

Options:
  --collection, --coll, -c  chemin sur la collection                  [chaine de caractère] [requis]
  --help                    Affiche de l'aide                                              [booléen]
```

#### create

```none
$ cli/json-db.js help create

cli/json-db.js create [options]

Options:
  --collection, --coll, -c       chemin sur la collection             [chaine de caractère] [requis]
  --help                         Affiche de l'aide                                         [booléen]
  --id-name, --id, -i            nom de l'attribut contenant l'identifant du document
                                                                               [chaine de caractère]
  --jsonschema, --jsc, -j        jsonschema de validation d'un document        [chaine de caractère]
  --jsonschema-file, --jscf, -f  fichier json contenant le jsonschema de validation d'un document
                                                                               [chaine de caractère]
  --documents-file, --doc, -d    fichier json contenant une liste de document à importer après la
                                 création                                      [chaine de caractère]
```

---

## Divers pour le dev

### TODO

* jsonDb.create ajouter la possibilité d'initialiser avec une liste de documents
* (model) dans Collection.constructor valider le jsonschema (Ajv.validateSchema)
* lors d'une creation si le fichier existe déjà refuser
* cli : ajouter l'import
* cli : internationaliser

### Modules intéressants

* uniqid
* yargs pour la ligne de commande
* _.filter pour find
* ajv (JSON Schema validator)
* react (<http://reactjs.cn/>)
* vue (<https://vuejs.org/>)
