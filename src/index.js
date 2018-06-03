const inherit = '&';
const added = Symbol('added');
const rxInherit = new RegExp(inherit, 'g');
const props = ['type', 'apply', 'args', 'targets'];

const trim = str => str.trim();
const split = str => str.split(',');
const flatten = result => [].concat(...result);
const isFeature = feature => feature && props.every(isMemberOf, feature);
const inheritFromAncestor = (target) => target.includes(inherit) && target || `${inherit} ${target}`;

function isMemberOf(prop) {
    return prop in this;
}

function replaceAncestor(ancestor) {
    return this.replace(rxInherit, ancestor);
}

function applyAncestors(target) {
    return this.map(replaceAncestor, target);
}

function substitute(target) {
    const ancestors = this;
    const targets = target.split(',');
    return flatten(targets.map(applyAncestors, ancestors))
        .map(trim);
}

function process(targets) {
    return flatten(targets).map(inheritFromAncestor);
}

export default function createDecoratorFactory(amara) {

    if (typeof amara !== 'object' || !amara || !('add' in amara))
        throw new TypeError(`Expected AmaraJS instance argument.`);

    function addFeatureMembers(instance, ancestors) {
        let key, feature;
        const proto = Object.getPrototypeOf(instance);
        for(key in proto) {
            feature = proto[key];
            if (!isFeature(feature)) continue;
            if (!feature.targets.length)
                feature.targets.push(inherit);
            amara.add(Object.assign(feature, {
                targets: flatten(feature.targets.map(substitute, ancestors))
            }));
        }
    }

    function feature(...targets) {
        if (!targets.length) targets.push('');
        return function setBaseTargets(Type) {
            const ancestors = flatten(flatten(targets).map(split)).map(trim);
            return class Feature extends Type {
                constructor(...args) {
                    super(...args);
                    if (!Feature[added]) {
                        Feature[added] = true;
                        addFeatureMembers(this, ancestors);
                    }
                }
            };
        };
    }

    function member({type, args = {}, targets = []} = {}) {
        return function decorator(target, name, descriptor) {
            if (!descriptor || !descriptor.value)
                throw new TypeError('Expected class member.');
            else if (typeof descriptor.value === 'function') {
                const apply = descriptor.value;
                descriptor.value = {apply};
                descriptor.enumerable = true;
            }
            const selectors = process(targets);
            Object.assign(descriptor.value, {
                type: descriptor.value.type || type,
                args: Object.assign(descriptor.value.args || {}, args),
                targets: selectors.concat(descriptor.value.targets || [])
            });
            if (descriptor.value.type !== type)
                throw new Error(`Conflicting decorator types applied to the same feature: ${type} and ${descriptor.value.type}.`);
            return descriptor;
        };
    }

    return {
        member,
        feature
    };

}
