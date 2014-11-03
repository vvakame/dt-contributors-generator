var path = require("path");

var specifiedDir = process.argv[2];
var baseDir = specifiedDir ? path.resolve(process.cwd(), specifiedDir) : process.cwd();

var utils = require("./");

utils.generateContributorsDoc(baseDir)
    .then(function (doc) {
        console.log(doc);
    }, function (err) {
        console.error("error", err);
        return Promise.reject(err);
    })
    .then(function () {
        process.exit(0);
    }, function () {
        process.exit(1);
    });
