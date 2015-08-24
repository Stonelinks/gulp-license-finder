/*
 * gulp-license-finder
 * https://github.com/iandotkelly/gulp-license-finder
 *
 * Copyright (c) 2014 Ian Kelly
 * Licensed under the MIT license.
 */

var gutil = require('gulp-util');
var File = gutil.File;
var nlf = require('nlf');
var path = require('path');
var PluginError = gutil.PluginError;
var Stream = require('stream');

// Consts
var PLUGIN_NAME = 'gulp-license-finder';

var delim = '\t';
var heading = ['serviceName', 'name', 'version', 'license', 'directory'].join(delim);

/**
 * Returns a single csv line for a module record
 *
 * @param  {Object} moduleRecord The module's license record
 * @return {String}              The record turned into a TSV record
 */
function recordToTsv(moduleRecord) {

    // @todo - what do do if any of the data contains a comma?
    // put double quotes around the value?
    return moduleRecord.name + delim +
        moduleRecord.version + delim +
        moduleRecord.summary().join(';') + delim +
        moduleRecord.directory;
}

/**
 * Render the license data
 *
 * @param  {Array}    licenseData An array of module licence data
 * @param  {String}   serviceName name of the service to be prepended to the row
 * @param  {Function} callback    The callback (err, output string)
 */
function render(licenseData, serviceName, callback) {

    if (typeof callback !== 'function') {
        throw new Error('must have a callback');
    }

    if (!Array.isArray(licenseData)) {
        return callback(new Error('licenseData must be an array'));
    }

    if (licenseData.length < 1) {
        return callback(new Error('must have at least one module in data'));
    }

    var output = [heading];

    licenseData.forEach(function (module) {
        output.push(serviceName + delim + recordToTsv(module));
    });

    callback(null, output.join('\n'));
}

function licenseFinder(filename, options) {

    // if the filename is an object, then
    // we will assume this is just an options
    // object
    if (typeof filename === 'object') {
        options = filename;
        filename = options.filename;
    }

    // set default options
    filename = filename || 'licenses.tsv';
    options = options || {};
    options.directory = options.directory || process.cwd();
    options.production = options.production || false;
    options.serviceName = options.serviceName || ''; // used to namespace to a service
    options.depth = options.depth; // undefined is the default

    var stream = new Stream();

    nlf.find(options, function (err, data) {
        if (err) {
            throw new gutil.PluginError(PLUGIN_NAME, err, {showStack: true});
        }

        render(data, options.serviceName, function (err, output) {
            if (err) {
                throw new gutil.PluginError(PLUGIN_NAME, err, {showStack: true});
            }

            var file = new File({
                path: path.join(process.cwd(), filename),
                contents: new Buffer(output)
            });

            stream.emit('data', file);
            stream.emit('finish');
        });

    });

    return stream;
}

module.exports = licenseFinder;
