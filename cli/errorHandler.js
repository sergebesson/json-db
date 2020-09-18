"use strict";
/* eslint no-console:0 no-process-exit:0 */

module.exports = {
	errorManagementOfPromise,
};

function errorManagementOfPromise(promise) {
	promise.catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}
