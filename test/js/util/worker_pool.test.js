'use strict';

var test = require('tap').test;
var WorkerPool = require('../../../js/util/worker_pool');

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

    t.end();
});
