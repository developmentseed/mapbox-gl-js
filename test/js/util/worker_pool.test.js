'use strict';

var test = require('tap').test;
var proxyquire = require('proxyquire');
var util = require('../../../js/util/util');
var WorkerPool = require('../../../js/util/worker_pool');
var WebWorker = require('../../../js/util/web_worker');

test('WorkerPool#createDispatcher', function (t) {
    t.test('creates dispatchers with shared workers', function (t) {
        var pool = new WorkerPool();

        t.equal(pool.workers.length, 0);

        pool.createDispatcher(4, {}, function (err, dispatcher) {
            t.error(err);
            t.equal(dispatcher.actors.length, 4);
            pool.createDispatcher(8, {}, function (err, dispatcher2) {
                t.error(err);
                t.equal(dispatcher2.actors.length, 8);

                var workers1 = dispatcher.actors.map(function (a) { return a.target; });
                var workers2 = dispatcher2.actors.map(function (a) { return a.target; });
                // check that the two different dispatchers' workers arrays correspond
                workers1.forEach(function (w, i) { t.equal(w, workers2[i]); });
                t.end();
            });
        });
    });

    t.test('handles dispose()', function (t) {
        var pool = new WorkerPool();
        pool.createDispatcher(1, {}, function (err, d1) {
            t.error(err);
            pool.createDispatcher(4, {}, function (err, d4) {
                t.error(err);
                var terminated = 0;
                pool.workers.forEach(function (w) {
                    w.terminate = function () { terminated += 1; };
                });

                d4.remove();
                t.comment('keeps workers if a dispatcher is still active');
                t.equal(terminated, 0);
                t.equal(pool.workers.length, 4);

                t.comment('terminates workers if no dispatchers are active');
                d1.remove();
                t.equal(terminated, 4);
                t.equal(pool.workers.length, 0);
            });
        });

        t.end();
    });

    t.test('registers WorkerSource for custom sources', function (t) {
        function MySourceType () {}
        MySourceType.workerSourceURL = 'my-worker-source.js';
        function WorkerlessSourceType () {}
        var _types = { 'my-source-type': MySourceType, 'workerless': WorkerlessSourceType };

        function MockWebWorker () {
            this.worker = new WebWorker();
            util.extend(this, this.worker);
            this.messages = [];
            this.postMessage = function (message) {
                this.messages.push(message);
                this.worker.postMessage(message);
            };
        }

        var WorkerPool = proxyquire('../../../js/util/worker_pool', {
            '../source/source': {
                getType: function (name) { return _types[name]; },
                setType: function () {},
                getCustomTypeNames: function () { return Object.keys(_types); },
                off: function () {}
            },
            './web_worker': MockWebWorker
        });

        var pool = new WorkerPool();
        pool.createDispatcher(4, {}, function (err) {
            t.error(err);
            t.equal(pool.workers.length, 4);
            pool.workers.forEach(function (w) {
                t.equal(w.messages.length, 1);
                t.same(w.messages[0].data, { name: 'my-source-type', url: 'my-worker-source.js' });
            });
            t.end();
        });
    });

    t.end();
});
