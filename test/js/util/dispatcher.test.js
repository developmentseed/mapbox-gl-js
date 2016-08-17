'use strict';

var test = require('tap').test;
var proxyquire = require('proxyquire');
var Dispatcher = require('../../../js/util/dispatcher');
var WebWorker = require('../../../js/util/web_worker');

test('Dispatcher', function (t) {
    t.test('#remove', function (t) {
        var dispatcher;
        var workers = [new WebWorker(), new WebWorker()];
        function dispose () { t.end(); }

        dispatcher = new Dispatcher('map-1', workers, dispose, {});
        dispatcher.remove();
    });

    test('creates Actors with unique map id', function (t) {
        var Dispatcher = proxyquire('../../../js/util/dispatcher', { './actor': Actor });

        var ids = [];
        function Actor (target, parent, mapId) { ids.push(mapId); }

        var workers = [new WebWorker()];
        var dispatchers = [
            new Dispatcher('map-1', workers, function () {}, {}),
            new Dispatcher('map-2', workers, function () {}, {})
        ];
        t.same(ids, dispatchers.map(function (d) { return d.id; }));

        t.end();
    });

    t.end();
});

