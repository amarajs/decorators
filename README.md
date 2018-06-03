## [@amarajs/decorators](https://github.com/amarajs/decorators)

Provides decorators to convert classes and members into AmaraJS features.

### Installation

`npm install --save @amarajs/decorators`

### Usage

Because AmaraJS can be extended with any plugin middleware, we first need to construct a decorator factory. Our factory will be linked to an AmaraJS instance, and will provide methods to decorate our classes and class members:

```javascript
// decorators.js
// exports useful decorators for our project

import createDecoratorFactory from '@amarajs/decorators';

// step 1: create a decorator factory bound to an
//   existing AmaraJS instance; we could create our
//   AmaraJS instance here but let's pretend one was
//   created elsewhere and import it

import amara from 'path/to/our/amara/instance';
const {feature, member} = createDecoratorFactory(amara);

// the generic `@feature` decorator will apply to a
// class definition and accepts zero or more target strings
// that our member decorators can use (or extend)

// step 2: create the decorators we want to use

// let's create some decorators for a few commonly
// used AmaraJS plugins. the basic pattern is to
// create a function which accepts whatever `args`
// and/or `targets` should apply to our feature; the
// function will then invoke the member decorator
// with all the properties that should be applied

const connect = (args) => member({args});
const dom = (...targets) => member({type: 'dom', targets});
const routes = (...targets) => member({type: 'route', targets});

export default {
    feature,
    connect,
    routes,
    dom
};

```

Now we can use our custom decorators:

```javascript
import { feature, connect, dom, routes } from 'path/to/decorators';

@feature('#main')
export default class Routing {

    // if we don't specify any custom targets, the
    // class target ('#main') will be used automatically;
    @routes()
    function getRoutes() {
        return ['topics/:topic'];
    }

    // the class target ('#main') will be prepended
    // to our member target for us, so the final
    // target here will be '#main [route^="topics/"]'
    // note the space between the class target and
    // the member target, meaning this feature will
    // apply to elements *nested within* the #main
    // element, but *not* the #main element itself
    @dom('[route^="topics/"]')
    @connect({
        topics: ({state}) => state.topics,
        topic: ({routeParams}) => routeParams.topic
    })
    function getDOM({topics, topic}) {
        return topics[topic];
    }

}
```

When a new instance of the `Router` class is constructed, the following code will be executed under the hood:

```javascript
amara.add({
    type: 'route',
    targets: ['#main'],
    apply: () => ['topics/:topic']
});

amara.add({
    type: 'dom',
    targets: ['#main [route^="topics/"]'],
    args: {
        topics: ({state}) => state.topics,
        topic: ({routeParams}) => routeParams.topic
    },
    apply: ({topics, topic}) => topics[topic]
});
```

By default, the class target(s) from the `@feature` decorator will be prepended to your feature targets. However, you can control where the class target is inserted into your member targets using the special `'&'` character:

```javascript
@feature('#main')
class Router {

    // this feature will only apply when
    // the body has a 'phone' CSS class.
    // the final selector is:
    // 'body.phone #main[route^="topics/"]'
    @dom('body.phone &[route^="topics/"]')
    function someMethod() {}

}
```

Finally, to actually add features to our Amara instance, we need to construct a new instance of our class.

```javascript
import Routing from 'path/to/Routing';
new Routing();
```

__IMPORTANT__: Features will only be added to Amara the first time a class is constructed. If you construct your class multiple times, the features will only be added to AmaraJS once. In other words, classes are just used as a way to organize features together logically.

To construct class instances automatically, you may wish to use a dependency injection (DI) system. For example:

```javascript
import inject from 'some-di-library';

import Routing from 'path/to/Routing';
import SomethingElse from 'path/to/SomethingElse';
import AnotherDependency from 'path/to/AnotherDependency';

@inject([
    Routing,
    SomethingElse,
    AnotherDependency
])
export default class App {
    // ...
};
```

When a new instance of `App` is constructed, the DI system would be responsible for instantiating any dependent classes, including nested dependencies.

### Contributing

If you have a feature request, please create a new issue so the community can discuss it.

If you find a defect, please submit a bug report that includes a working link to reproduce the problem (for example, using [this fiddle](https://jsfiddle.net/04f3v2x4/)). Of course, pull requests to fix open issues are always welcome!

### License

The MIT License (MIT)

Copyright (c) Dan Barnes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
