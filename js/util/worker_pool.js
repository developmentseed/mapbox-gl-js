'use strict';

var assert = require('assert');
var util = require('./util');
var WebWorker = require('./web_worker');
var Dispatcher = require('./dispatcher');

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

    _acquire: function (mapId, workerCount, callback) {
        this._resize(workerCount);
        this.active[mapId] = workerCount;
        callback(null, this.workers.slice(0, workerCount));
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

