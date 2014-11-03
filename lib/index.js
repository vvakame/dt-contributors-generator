var fs = require("fs");
var path = require("path");

var header = require("definition-header");
var Promise = require("es6-promise").Promise;

var ignorePathList = [
    /\/node_modules\//,
    /\/_infrastructure\//,
    /\/legacy\//, // legacy folder
    /(-|v)\d+\.[\dxyz]+(\.[\dxyz]+)?/, // version number

    /\/cordova\/plugins\//,
    /\/d3\/plugins\//,
    /\/dojo\/dojox\./,
    /\/dojo\/dijit.d.ts/,
    /\/dojo\/doh.d.ts/,
    /\/business-rules-engine\/[A-Z]/, // I want ignore Utils, Validations...
    /\/createjs-lib\/createjs-lib.d.ts/,
    /\/datejs\/sugarpak.d.ts/,
    /\/es6-promises\/es6-promises.d.ts/, // deprecated. mv es6-promises es6-promise
    /\/form-data\/form-data.d.ts/, // invalid name. TODO
    /\/linq\/linq.3.0.3-Beta4.d.ts/,
    /\/phonejs\/dx.phonejs.d.ts/, // deprecaed. mv phonejs/dx.phonejs.d.ts devextreme/dx.phonejs.d.ts
    /\/jquery.pickadate\/jquery.pickadate.d.ts/, // invalid name. TODO
    /\/purl\/purl-jquery.d.ts/,
    /\/ref\/ref.d.ts/, // invalid name. TODO
    /\/ref-struct\/ref-struct.d.ts/, // invalid name. TODO
    /\/riotjs\/riotjs-render.d.ts/,
    /\/webaudioapi\/waa-20120802.d.ts/, // old version
    /\/webrtc\/RTCPeerConnection.d.ts/,
    /\/yui\/yui-test.d.ts/
];

function generateContributorsDoc(baseDir, headerFilePath) {
    return processDir(baseDir)
        .then(function (results) {
            headerFilePath = headerFilePath || path.resolve(__dirname, "../misc/header.txt");
            var header = fs.readFileSync(headerFilePath, {encoding: "utf8"});
            var result = header;
            results
                .sort(function (a, b) {
                    return a.value.label.name.toLowerCase().localeCompare(b.value.label.name.toLowerCase());
                })
                .forEach(function (r) {
                    result += resultToLineString(r) + "\n";
                });
            return result;
        });
}

function processDir(dirPath, baseDir) {
    baseDir = baseDir || dirPath;
    var promises = fs.readdirSync(dirPath).map(function (entity) {
        var p = path.resolve(dirPath, entity);
        var stats = fs.statSync(p);
        if (stats.isFile()) {
            return processFile(p, baseDir);
        } else if (stats.isDirectory()) {
            return processDir(p, baseDir);
        } else {
            return Promise.resolve([]);
        }
    });
    return Promise.all(promises).then(function (results) {
        results = results
            .reduce(function (p, c) {
                return p.concat(c);
            }, []);
        return Promise.all(results);
    });
}

function processFile(filePath, baseDir) {
    if (/\.d\.ts$/.test(filePath)) {
        return processTsFile(filePath, baseDir);
    } else {
        return Promise.resolve([]);
    }
}

function processTsFile(filePath, baseDir) {
    var ignore = ignorePathList.some(function (ignore) {
        return ignore.test(filePath);
    });
    if (ignore) {
        return Promise.resolve([]);
    }
    var content = fs.readFileSync(filePath, {encoding: "utf8"});
    if (header.isPartial(content)) {
        return Promise.resolve([]);
    }
    var result = header.parse(content);
    if (!result.success) {
        return Promise.reject({
            file: filePath,
            result: result
        });
    } else {
        result.filePath = path.relative(baseDir, filePath);
        return Promise.resolve([result]);
    }
}

function resultToLineString(result) {
    var head = "* [:link:](" + result.filePath + ")";
    var libName = " [" + result.value.label.name + "](" + result.value.project[0].url + ")";
    var useNames = " by " + result.value.authors.map(function (author) {
            return "[" + author.name + "](" + author.url + ")";
        }).join(", ");

    var line = head + libName + useNames;
    return line;
}

exports.generateContributorsDoc = generateContributorsDoc;
exports.processDir = processDir;
exports.resultToLineString = resultToLineString;
