"use strict";

/* eslint no-unused-expressions:0 */
require("yargs")
	.usage("Usage: $0 <commande> --collection fichier [options]")
	.strict(true)
	.commandDir("commands")
	.recommendCommands()
	.demandCommand()
	.options({
		collection: {
			alias: ["coll", "c"],
			desc: "chemin sur la collection",
			demandOption: true,
			requiresArg: true,
			string: true,
		},
	})
	.wrap(100)
	.help()
	.argv;
