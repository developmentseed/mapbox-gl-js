'use strict';

var assert = require('assert');
var util = require('./util');
var WebWorker = require('./web_worker');
var Dispatcher = require('./dispatcher');
var Source = require('../source/source');

module.exports = WorkerPool;

function WorkerPool() {
    this.workers = [];
    this.active = {};
}

WorkerPool.prototype = {
    createDispatcher: function (workerCount, parent, callback) {
        var mapId = util.uniqueId();
        this._acquire(mapId, workerCount, function (err, workers) {
            if (err) {
                this._release(mapId);
                return callback(err);
            }

            var dispose = this._release.bind(this, mapId);
            var dispatcher = new Dispatcher(mapId, workers, dispose, parent);
            callback(null, dispatcher);
        }.bind(this));
    },

    registerCustomSource: function (name, callback, newWorkers) {
        var SourceType = Source.getType(name);
        assert(SourceType);

        if (SourceType.workerSourceURL) {
            var workers = newWorkers || this.workers;
            var dispatcher = new Dispatcher(util.uniqueId(), workers, function () {}, this);
            dispatcher.broadcast('load worker source', {
                name: name,
                url: SourceType.workerSourceURL
            }, function (err) {
                dispatcher.remove();
                callback(err);
            });
        } else {
            callback();
        }
    },

    _acquire: function (mapId, workerCount, callback) {
        var newWorkers = this._resize(workerCount);
        this.active[mapId] = workerCount;

        // register any existing custom source types with the newly-created
        // workers
        util.asyncAll(Source.getCustomTypeNames(), function (name, done) {
            this.registerCustomSource(name, done, newWorkers);
        }.bind(this), function (err) {
            if (err) {
                this.fire('error', {error: err});
                return;
            }
            callback(null, this.workers.slice(0, workerCount));
        }.bind(this));
    },

    _release: function (mapId) {
        delete this.active[mapId];
        if (Object.keys(this.active).length === 0) {
            this._remove();
        }
    },

    _remove: function () {
        this.workers.forEach(function (w) { w.terminate(); });
        this._dispatcher = null;
        this.workers = [];
    },

    _resize: function (len) {
        assert(typeof len === 'number');
        var newWorkers = [];
        while (this.workers.length < len) {
            var w = new WebWorker();
            this.workers.push(w);
            newWorkers.push(w);
        }
        return newWorkers;
    }
};

require('../shared_global').workerPool = new WorkerPool();

