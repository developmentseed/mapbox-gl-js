'use strict';

var test = require('tap').test;
var proxyquire = require('proxyquire');

test('Source', function (t) {
    t.test('#getCustomTypeNames', function (t) {
        var Source = proxyquire('../../../js/source/source', {
            '../shared_global': {
                workerPool: { registerCustomSource: function () {} }
            }
        });

        t.same(Source.getCustomTypeNames(), []);
        Source.addType('source.test.type-1', function () {});
        t.same(Source.getCustomTypeNames(), ['source.test.type-1']);
        t.end();
    });

    t.test('#addType', function (t) {
        function SourceType () {}
        var Source = proxyquire('../../../js/source/source', {
            '../shared_global': {
                workerPool: { registerCustomSource: registerCustomSource }
            }
        });
        Source.on('add', onAdd);

        Source.addType('source.test.type-2', SourceType);
        t.equal(Source.getType('source.test.type-2'), SourceType);
        function registerCustomSource (name, callback) {
            t.equal(name, 'source.test.type-2');
            setTimeout(callback, 0);
        }
        function onAdd (event) {
            t.equal(event.name, 'source.test.type-2');
            Source.off('add', onAdd);
            t.end();
        }
    });

    t.test('#addType throws for duplicate source type', function (t) {
        var Source = proxyquire('../../../js/source/source', {
            '../shared_global': {
                workerPool: { registerCustomSource: function () {} }
            }
        });

        Source.addType('source.test.type-3', function () {});
        t.throws(function () {
            Source.addType('source.test.type-3', function () {});
        });
        t.end();
    });

    t.end();
});
