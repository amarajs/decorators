/* eslint "no-unused-vars": 0 */

const sinon = require('sinon');
const expect = require('chai').expect;

const createDecoratorFactory = require('../dist/amara-decorators');

describe('decorators', () => {

    let amara,
        feature,
        member;

    beforeEach(function() {
        amara = { add: sinon.spy() };
        const factory = createDecoratorFactory(amara);
        feature = factory.feature;
        member = factory.member;
    });

    it('exists', function() {
        expect(createDecoratorFactory).exist;
        expect(createDecoratorFactory).is.a('function');
    });

    it('throws if Amara instance not provided', () => {
        [null, undefined, 123, 'abc', {}, /rx/].forEach(val => {
            expect(() => createDecoratorFactory(val)).throws(
                'Expected AmaraJS instance argument.'
            );
        });
    });

    describe('feature', () => {

        it('exists', function() {
            expect(feature).exist;
            expect(feature).is.a('function');
        });

    });

    describe('member', () => {

        it('exists', function() {
            expect(member).exist;
            expect(member).is.a('function');
        });

        it('throws for non-members', function() {
            expect(() => {
                @feature()
                class Test {
                    @member()
                    static get prop() {
                        return 'abc';
                    }
                }
            }).throws('Expected class member.');
        });

        it('uses type', function() {
            const decorator = () => member({type: 'test'});
            @feature('main')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.type).equal('test');
        });

        it('uses targets', function() {
            const decorator = () => member({type: 'test', targets: ['abc']});
            @feature()
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['abc']);
        });

        it('uses args', function() {
            const args = {a: 'b', c: 1};
            const decorator = () => member({type: 'test', args});
            @feature()
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.args).eql(args);
        });

        it('uses method as apply', function() {
            const decorator = () => member({type: 'test'});
            @feature()
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added).equal(Test.prototype.testing);
        });

    });

    describe('combined', () => {

        it('only adds feature once', function() {
            const decorator = member({type: 'test'});
            @feature()
            class Test {
                @decorator
                testing() {}
            }
            new Test();
            new Test();
            new Test();
            expect(amara.add.callCount).equals(1);
        });

        it('default feature target is class target', function() {
            const decorator = () => member({type: 'test'});
            @feature('main')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['main']);
        });

        it('class target prepended if no &', function() {
            const decorator = () => member({type: 'test', targets: ['div']});
            @feature('main')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['main div']);
        });

        it('class target substituted for &', function() {
            const decorator = () => member({type: 'test', targets: ['div &']});
            @feature('main')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['div main']);
        });

        it('multiple targets on class prepended correctly', function() {
            const decorator = () => member({type: 'test', targets: ['div']});
            @feature('main, body')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['main div', 'body div']);
        });

        it('multiple targets on feature prepended correctly', function() {
            const decorator = () => member({type: 'test', targets: ['div', 'body']});
            @feature('main')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['main div', 'main body']);
        });

        it('multiple targets on class substituted correctly', function() {
            const decorator = () => member({type: 'test', targets: ['div & p']});
            @feature('main, body')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['div main p', 'div body p']);
        });

        it('multiple targets on feature substituted correctly', function() {
            const decorator = () => member({type: 'test', targets: ['div &', 'body & p']});
            @feature('main')
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['div main', 'body main p']);
        });

        it('multiple targets on both handled correctly', function() {
            const decorator = () => member({type: 'test', targets: ['div & p', 'body']});
            @feature('section', ['footer', 'header'])
            class Test {
                @decorator()
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql([
                'div section p',
                'div footer p',
                'div header p',
                'section body',
                'footer body',
                'header body'
            ]);
        });

        it('allows multiple decorators at once', function() {
            const dec1 = member({type: 'test'});
            const dec2 = member({targets: ['abc']});
            @feature()
            class Test {
                @dec1
                @dec2
                testing() {}
            }
            const instance = new Test();
            const added = amara.add.firstCall.args[0];
            expect(added.targets).eql(['abc']);
            expect(added.type).equal('test');
        });

        it('throws if types mismatched', function() {
            const dec1 = member({type: 'test'});
            const dec2 = member({type: 'mismatch'});
            expect(() => {
                @feature()
                class Test {
                    @dec1
                    @dec2
                    testing() {}
                }
            }).throws(/conflicting decorator types applied to the same feature/i);
        });

    });

});
