var path = require('path'),
    vow = require('vow'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files'),
    depsTech = require('../../techs/deps'),
    bemdeclFromDepsByTechTech = require('../../techs/deps-by-tech-to-bemdecl');

describe('techs', function () {
    describe('deps', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must provide result from cache', function (done) {
            mockFs({
                bundle: {
                    'bundle.bemdecl.js': 'exports.blocks = ' + JSON.stringify([{ name: 'other-block' }]) + ';'
                }
            });

            var bundle = new TestNode('bundle'),
                cache = bundle.getNodeCache('bundle.bemdecl.js'),
                options = {
                    sourceTech: 'sourceTech'
                };

            cache.cacheFileInfo('bemdecl-file', path.resolve('bundle/bundle.bemdecl.js'));
            cache.cacheFileInfo('files-file', path.resolve('bundle/bundle.files'));

            return bundle.runTech(bemdeclFromDepsByTechTech, options)
                .then(function (target) {
                    target.blocks.must.eql([{ name: 'other-block' }]);
                })
                .then(done, done);
        });

        describe('deps.js format', function () {
            it('must add should dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ block: 'other-block' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block' }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{
                                        block: 'other-block',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', elems: [{ name: 'elem' }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [
                                        { block: 'other-block', elems: ['elem-1', 'elem-2'] }
                                    ]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [
                        { name: 'other-block' },
                        { name: 'other-block', elems: [{ name: 'elem-1' }] },
                        { name: 'other-block', elems: [{ name: 'elem-2' }] }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{
                                        block: 'other-block',
                                        elem: 'elem', mods: { mod: true }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add should dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [ {
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add loop shouldDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    shouldDeps: [{ block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    shouldDeps: [{ block: 'A' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    exepted = [
                        // { name: 'A' },
                        { name: 'B' }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of block', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ block: 'other-block' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block' }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of block boolean mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ block: 'other-block', mods: { mod: true } }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of block mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [
                                        { block: 'other-block', mods: { 'mod-name': 'mod-val' } }
                                    ]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elem', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ block: 'other-block', elem: 'elem' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{ name: 'other-block', elems: [{ name: 'elem' }] }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elems', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [
                        { name: 'other-block' },
                        { name: 'other-block', elems: [{ name: 'elem-1' }] },
                        { name: 'other-block', elems: [{ name: 'elem-2' }] }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elem bool mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [
                                        { block: 'other-block', elem: 'elem', mods: { mod: true } }
                                    ]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [{
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add must dep of elem mod', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{
                                        block: 'other-block',
                                        elem: 'elem',
                                        mods: { 'mod-name': 'mod-val' }
                                    }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [ {
                        name: 'other-block',
                        elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                    }];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add loop shouldDeps', function (done) {
                var scheme = {
                        blocks: {
                            A: {
                                'A.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ block: 'B' }]
                                })
                            },
                            B: {
                                'B.deps.js': stringifyDepsJs({
                                    mustDeps: [{ block: 'A' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'A' }],
                    exepted = [
                        // { name: 'A' },
                        { name: 'B' }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });

            it('must add blocks only with `tech`', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [
                                        { block: 'block-with-destTech', tech: 'destTech' },
                                        { block: 'other-block' }
                                    ]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [
                        { name: 'block-with-destTech' }
                    ];

                assert(scheme, bemdecl, exepted, {
                    sourceTech: 'sourceTech',
                    destTech: 'destTech'
                }, done);
            });

            it('must add block with `tech` if `destTech` option not specified', function (done) {
                var scheme = {
                        blocks: {
                            block: {
                                'block.deps.js': stringifyDepsJs({
                                    tech: 'sourceTech',
                                    mustDeps: [{ block: 'block-with-destTech', tech: 'destTech' }]
                                })
                            }
                        }
                    },
                    bemdecl = [{ name: 'block' }],
                    exepted = [
                        { name: 'block-with-destTech' }
                    ];

                assert(scheme, bemdecl, exepted, done);
            });
        });
    });
});

function getResults(fsScheme, bemdecl, options) {
    var levels = Object.keys(fsScheme),
        bundle;

    options || (options = {});
    options.sourceTech || (options.sourceTech = 'sourceTech');

    fsScheme['bundle'] = {};

    mockFs(fsScheme);

    bundle = new TestNode('bundle');
    bundle.provideTechData('?.bemdecl.js', { blocks: bemdecl });

    return bundle.runTech(levelsTech, { levels: levels })
        .then(function (levels) {
            bundle.provideTechData('?.levels', levels);

            return bundle.runTechAndGetResults(depsTech);
        })
        .spread(function (res) {
            bundle.provideTechData('?.deps.js', res);

            return bundle.runTechAndGetResults(filesTech);
        })
        .then(function (res) {
            var files = res['bundle.files'];

            bundle.provideTechData('?.files', files);

            return vow.all([
                bundle.runTechAndGetResults(bemdeclFromDepsByTechTech, options),
                bundle.runTechAndRequire(bemdeclFromDepsByTechTech, options)
            ]);
        })
        .spread(function (target1, target2) {
            return [target1['bundle.bemdecl.js'].blocks, target2[0].blocks];
        });
}

function assert(fsScheme, bemdecl, exepted, options, done) {
    if (!done) {
        done = options;
    }

    getResults(fsScheme, bemdecl, options)
        .then(function (results) {
            results.forEach(function (actualBemdecl) {
                actualBemdecl.must.eql(exepted);
            });
        })
        .then(done, done);
}

function stringifyDepsJs(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}
