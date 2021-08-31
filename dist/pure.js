"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  render: true,
  cleanup: true,
  waitFor: true,
  waitForElementToBeRemoved: true,
  act: true,
  fireEvent: true
};
exports.render = render;
exports.cleanup = cleanup;
exports.waitFor = waitFor;
exports.waitForElementToBeRemoved = waitForElementToBeRemoved;
Object.defineProperty(exports, "act", {
  enumerable: true,
  get: function () {
    return _actCompat.default;
  }
});
Object.defineProperty(exports, "fireEvent", {
  enumerable: true,
  get: function () {
    return _fireEvent.fireEvent;
  }
});

var React = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _dom = require("@testing-library/dom");

Object.keys(_dom).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _dom[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _dom[key];
    }
  });
});

var _actCompat = _interopRequireDefault(require("./act-compat"));

var _fireEvent = require("./fire-event");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

(0, _dom.configure)({
  eventWrapper: cb => {
    let result;
    (0, _actCompat.default)(() => {
      result = cb();
    });
    return result;
  }
}); // Ideally we'd just use a WeakMap where containers are keys and roots are values.
// We use two variables so that we can bail out in constant time when we render with a new container (most common use case)

/**
 * @type {Set<import('react-dom').Container>}
 */

const mountedContainers = new Set();
/**
 * @type Array<{container: import('react-dom').Container, root: ReturnType<typeof createConcurrentRoot>}>
 */

const mountedRootEntries = [];

function createConcurrentRoot(container, options) {
  if (typeof _reactDom.default.createRoot !== 'function') {
    throw new TypeError(`Attempted to use concurrent React with \`react-dom@${_reactDom.default.version}\`. Be sure to use the \`next\` or \`experimental\` release channel (https://reactjs.org/docs/release-channels.html).'`);
  }

  const root = options.hydrate ? _reactDom.default.hydrateRoot(container) : _reactDom.default.createRoot(container);
  return {
    hydrate(element) {
      /* istanbul ignore if */
      if (!options.hydrate) {
        throw new Error('Attempted to hydrate a non-hydrateable root. This is a bug in `@testing-library/react`.');
      }

      root.render(element);
    },

    render(element) {
      root.render(element);
    },

    unmount() {
      root.unmount();
    }

  };
}

function createLegacyRoot(container) {
  return {
    hydrate(element) {
      _reactDom.default.hydrate(element, container);
    },

    render(element) {
      _reactDom.default.render(element, container);
    },

    unmount() {
      _reactDom.default.unmountComponentAtNode(container);
    }

  };
}

function renderRoot(ui, {
  baseElement,
  container,
  hydrate,
  queries,
  root,
  wrapper: WrapperComponent
}) {
  const wrapUiIfNeeded = innerElement => WrapperComponent ? /*#__PURE__*/React.createElement(WrapperComponent, null, innerElement) : innerElement;

  (0, _actCompat.default)(() => {
    if (hydrate) {
      root.hydrate(wrapUiIfNeeded(ui), container);
    } else {
      root.render(wrapUiIfNeeded(ui), container);
    }
  });
  return {
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options) => Array.isArray(el) ? // eslint-disable-next-line no-console
    el.forEach(e => console.log((0, _dom.prettyDOM)(e, maxLength, options))) : // eslint-disable-next-line no-console,
    console.log((0, _dom.prettyDOM)(el, maxLength, options)),
    unmount: () => {
      (0, _actCompat.default)(() => {
        root.unmount();
      });
    },
    rerender: rerenderUi => {
      renderRoot(wrapUiIfNeeded(rerenderUi), {
        container,
        baseElement,
        root
      }); // Intentionally do not return anything to avoid unnecessarily complicating the API.
      // folks can use all the same utilities we return in the first place that are bound to the container
    },
    asFragment: () => {
      /* istanbul ignore else (old jsdom limitation) */
      if (typeof document.createRange === 'function') {
        return document.createRange().createContextualFragment(container.innerHTML);
      } else {
        const template = document.createElement('template');
        template.innerHTML = container.innerHTML;
        return template.content;
      }
    },
    ...(0, _dom.getQueriesForElement)(baseElement, queries)
  };
}

function render(ui, {
  container,
  baseElement = container,
  legacyRoot = typeof _reactDom.default.createRoot !== 'function',
  queries,
  hydrate = false,
  wrapper
} = {}) {
  if (!baseElement) {
    // default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output
    baseElement = document.body;
  }

  if (!container) {
    container = baseElement.appendChild(document.createElement('div'));
  }

  let root; // eslint-disable-next-line no-negated-condition -- we want to map the evolution of this over time. The root is created first. Only later is it re-used so we don't want to read the case that happens later first.

  if (!mountedContainers.has(container)) {
    const createRootImpl = legacyRoot ? createLegacyRoot : createConcurrentRoot;
    root = createRootImpl(container, {
      hydrate
    });
    mountedRootEntries.push({
      container,
      root
    }); // we'll add it to the mounted containers regardless of whether it's actually
    // added to document.body so the cleanup method works regardless of whether
    // they're passing us a custom container or not.

    mountedContainers.add(container);
  } else {
    mountedRootEntries.forEach(rootEntry => {
      if (rootEntry.container === container) {
        root = rootEntry.root;
      }
    });
  }

  return renderRoot(ui, {
    container,
    baseElement,
    queries,
    hydrate,
    wrapper,
    root
  });
}

function cleanup() {
  mountedRootEntries.forEach(({
    root,
    container
  }) => {
    (0, _actCompat.default)(() => {
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
  return (0, _dom.waitFor)(() => {
    let result;
    (0, _actCompat.default)(() => {
      result = callback();
    });
    return result;
  }, options);
}

function waitForElementToBeRemoved(callback, options) {
  return (0, _dom.waitForElementToBeRemoved)(() => {
    let result;
    (0, _actCompat.default)(() => {
      result = callback();
    });
    return result;
  }, options);
} // just re-export everything from dom-testing-library
// NOTE: we're not going to export asyncAct because that's our own compatibility
// thing for people using react-dom@16.8.0. Anyone else doesn't need it and
// people should just upgrade anyway.

/* eslint func-name-matching:0 */