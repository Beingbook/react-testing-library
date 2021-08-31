'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _extends = require('@babel/runtime/helpers/extends');
var React = require('react');
var ReactDOM = require('react-dom');
var dom = require('@testing-library/dom');
var testUtils = require('react-dom/test-utils');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      }
    });
  }
  n['default'] = e;
  return Object.freeze(n);
}

var _extends__default = /*#__PURE__*/_interopDefaultLegacy(_extends);
var React__namespace = /*#__PURE__*/_interopNamespace(React);
var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM);
var testUtils__namespace = /*#__PURE__*/_interopNamespace(testUtils);

var isomorphicAct = React__namespace.unstable_act;
var domAct = testUtils__namespace.act;
// so for versions that don't have act from test utils
// we do this little polyfill. No warnings, but it's
// better than nothing.

function actPolyfill(cb) {
  ReactDOM__default['default'].unstable_batchedUpdates(cb);
  ReactDOM__default['default'].render( /*#__PURE__*/React__namespace.createElement("div", null), document.createElement('div'));
}

var act = isomorphicAct || domAct || actPolyfill;
/* eslint no-console:0 */

// dom-testing-library's version of fireEvent. The reason
// we make this distinction however is because we have
// a few extra events that work a bit differently

var fireEvent = function fireEvent() {
  return dom.fireEvent.apply(void 0, arguments);
};

Object.keys(dom.fireEvent).forEach(function (key) {
  fireEvent[key] = function () {
    return dom.fireEvent[key].apply(dom.fireEvent, arguments);
  };
}); // React event system tracks native mouseOver/mouseOut events for
// running onMouseEnter/onMouseLeave handlers
// @link https://github.com/facebook/react/blob/b87aabdfe1b7461e7331abb3601d9e6bb27544bc/packages/react-dom/src/events/EnterLeaveEventPlugin.js#L24-L31

var mouseEnter = fireEvent.mouseEnter;
var mouseLeave = fireEvent.mouseLeave;

fireEvent.mouseEnter = function () {
  mouseEnter.apply(void 0, arguments);
  return fireEvent.mouseOver.apply(fireEvent, arguments);
};

fireEvent.mouseLeave = function () {
  mouseLeave.apply(void 0, arguments);
  return fireEvent.mouseOut.apply(fireEvent, arguments);
};

var pointerEnter = fireEvent.pointerEnter;
var pointerLeave = fireEvent.pointerLeave;

fireEvent.pointerEnter = function () {
  pointerEnter.apply(void 0, arguments);
  return fireEvent.pointerOver.apply(fireEvent, arguments);
};

fireEvent.pointerLeave = function () {
  pointerLeave.apply(void 0, arguments);
  return fireEvent.pointerOut.apply(fireEvent, arguments);
};

var select = fireEvent.select;

fireEvent.select = function (node, init) {
  select(node, init); // React tracks this event only on focused inputs

  node.focus(); // React creates this event when one of the following native events happens
  // - contextMenu
  // - mouseUp
  // - dragEnd
  // - keyUp
  // - keyDown
  // so we can use any here
  // @link https://github.com/facebook/react/blob/b87aabdfe1b7461e7331abb3601d9e6bb27544bc/packages/react-dom/src/events/SelectEventPlugin.js#L203-L224

  fireEvent.keyUp(node, init);
}; // React event system tracks native focusout/focusin events for
// running blur/focus handlers
// @link https://github.com/facebook/react/pull/19186


var blur = fireEvent.blur;
var focus = fireEvent.focus;

fireEvent.blur = function () {
  fireEvent.focusOut.apply(fireEvent, arguments);
  return blur.apply(void 0, arguments);
};

fireEvent.focus = function () {
  fireEvent.focusIn.apply(fireEvent, arguments);
  return focus.apply(void 0, arguments);
};

dom.configure({
  eventWrapper: function eventWrapper(cb) {
    var result;
    act(function () {
      result = cb();
    });
    return result;
  }
}); // Ideally we'd just use a WeakMap where containers are keys and roots are values.
// We use two variables so that we can bail out in constant time when we render with a new container (most common use case)

/**
 * @type {Set<import('react-dom').Container>}
 */

var mountedContainers = new Set();
/**
 * @type Array<{container: import('react-dom').Container, root: ReturnType<typeof createConcurrentRoot>}>
 */

var mountedRootEntries = [];

function createConcurrentRoot(container, options) {
  if (typeof ReactDOM__default['default'].createRoot !== 'function') {
    throw new TypeError("Attempted to use concurrent React with `react-dom@" + ReactDOM__default['default'].version + "`. Be sure to use the `next` or `experimental` release channel (https://reactjs.org/docs/release-channels.html).'");
  }

  var root = options.hydrate ? ReactDOM__default['default'].hydrateRoot(container) : ReactDOM__default['default'].createRoot(container);
  return {
    hydrate: function hydrate(element) {
      /* istanbul ignore if */
      if (!options.hydrate) {
        throw new Error('Attempted to hydrate a non-hydrateable root. This is a bug in `@testing-library/react`.');
      }

      root.render(element);
    },
    render: function render(element) {
      root.render(element);
    },
    unmount: function unmount() {
      root.unmount();
    }
  };
}

function createLegacyRoot(container) {
  return {
    hydrate: function hydrate(element) {
      ReactDOM__default['default'].hydrate(element, container);
    },
    render: function render(element) {
      ReactDOM__default['default'].render(element, container);
    },
    unmount: function unmount() {
      ReactDOM__default['default'].unmountComponentAtNode(container);
    }
  };
}

function renderRoot(ui, _ref) {
  var baseElement = _ref.baseElement,
      container = _ref.container,
      hydrate = _ref.hydrate,
      queries = _ref.queries,
      root = _ref.root,
      WrapperComponent = _ref.wrapper;

  var wrapUiIfNeeded = function wrapUiIfNeeded(innerElement) {
    return WrapperComponent ? /*#__PURE__*/React__namespace.createElement(WrapperComponent, null, innerElement) : innerElement;
  };

  act(function () {
    if (hydrate) {
      root.hydrate(wrapUiIfNeeded(ui), container);
    } else {
      root.render(wrapUiIfNeeded(ui), container);
    }
  });
  return _extends__default['default']({
    container: container,
    baseElement: baseElement,
    debug: function debug(el, maxLength, options) {
      if (el === void 0) {
        el = baseElement;
      }

      return Array.isArray(el) ? // eslint-disable-next-line no-console
      el.forEach(function (e) {
        return console.log(dom.prettyDOM(e, maxLength, options));
      }) : // eslint-disable-next-line no-console,
      console.log(dom.prettyDOM(el, maxLength, options));
    },
    unmount: function unmount() {
      act(function () {
        root.unmount();
      });
    },
    rerender: function rerender(rerenderUi) {
      renderRoot(wrapUiIfNeeded(rerenderUi), {
        container: container,
        baseElement: baseElement,
        root: root
      }); // Intentionally do not return anything to avoid unnecessarily complicating the API.
      // folks can use all the same utilities we return in the first place that are bound to the container
    },
    asFragment: function asFragment() {
      /* istanbul ignore else (old jsdom limitation) */
      if (typeof document.createRange === 'function') {
        return document.createRange().createContextualFragment(container.innerHTML);
      } else {
        var template = document.createElement('template');
        template.innerHTML = container.innerHTML;
        return template.content;
      }
    }
  }, dom.getQueriesForElement(baseElement, queries));
}

function render(ui, _temp) {
  var _ref2 = _temp === void 0 ? {} : _temp,
      container = _ref2.container,
      _ref2$baseElement = _ref2.baseElement,
      baseElement = _ref2$baseElement === void 0 ? container : _ref2$baseElement,
      _ref2$legacyRoot = _ref2.legacyRoot,
      legacyRoot = _ref2$legacyRoot === void 0 ? typeof ReactDOM__default['default'].createRoot !== 'function' : _ref2$legacyRoot,
      queries = _ref2.queries,
      _ref2$hydrate = _ref2.hydrate,
      hydrate = _ref2$hydrate === void 0 ? false : _ref2$hydrate,
      wrapper = _ref2.wrapper;

  if (!baseElement) {
    // default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output
    baseElement = document.body;
  }

  if (!container) {
    container = baseElement.appendChild(document.createElement('div'));
  }

  var root; // eslint-disable-next-line no-negated-condition -- we want to map the evolution of this over time. The root is created first. Only later is it re-used so we don't want to read the case that happens later first.

  if (!mountedContainers.has(container)) {
    var createRootImpl = legacyRoot ? createLegacyRoot : createConcurrentRoot;
    root = createRootImpl(container, {
      hydrate: hydrate
    });
    mountedRootEntries.push({
      container: container,
      root: root
    }); // we'll add it to the mounted containers regardless of whether it's actually
    // added to document.body so the cleanup method works regardless of whether
    // they're passing us a custom container or not.

    mountedContainers.add(container);
  } else {
    mountedRootEntries.forEach(function (rootEntry) {
      if (rootEntry.container === container) {
        root = rootEntry.root;
      }
    });
  }

  return renderRoot(ui, {
    container: container,
    baseElement: baseElement,
    queries: queries,
    hydrate: hydrate,
    wrapper: wrapper,
    root: root
  });
}

function cleanup() {
  mountedRootEntries.forEach(function (_ref3) {
    var root = _ref3.root,
        container = _ref3.container;
    act(function () {
      root.unmount();
    });

    if (container.parentNode === document.body) {
      document.body.removeChild(container);
    }
  });
  mountedRootEntries.length = 0;
  mountedContainers.clear();
}

function waitFor(callback, options) {
  return dom.waitFor(function () {
    var result;
    act(function () {
      result = callback();
    });
    return result;
  }, options);
}

function waitForElementToBeRemoved(callback, options) {
  return dom.waitForElementToBeRemoved(function () {
    var result;
    act(function () {
      result = callback();
    });
    return result;
  }, options);
} // just re-export everything from dom-testing-library
// thing for people using react-dom@16.8.0. Anyone else doesn't need it and
// people should just upgrade anyway.

/* eslint func-name-matching:0 */

exports.act = act;
exports.cleanup = cleanup;
exports.fireEvent = fireEvent;
exports.render = render;
exports.waitFor = waitFor;
exports.waitForElementToBeRemoved = waitForElementToBeRemoved;
Object.keys(dom).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () {
      return dom[k];
    }
  });
});
