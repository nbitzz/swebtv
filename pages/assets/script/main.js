function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
    if (!src_url_equal_anchor) {
        src_url_equal_anchor = document.createElement('a');
    }
    src_url_equal_anchor.href = url;
    return element_src === src_url_equal_anchor.href;
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function set_store_value(store, ret, value) {
    store.set(value);
    return ret;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);
function append(target, node) {
    target.appendChild(node);
}
function get_root_for_style(node) {
    if (!node)
        return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root && root.host) {
        return root;
    }
    return node.ownerDocument;
}
function append_empty_stylesheet(node) {
    const style_element = element('style');
    append_stylesheet(get_root_for_style(node), style_element);
    return style_element.sheet;
}
function append_stylesheet(node, style) {
    append(node.head || node, style);
    return style.sheet;
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
/**
 * List of attributes that should always be set through the attr method,
 * because updating them through the property setter doesn't work reliably.
 * In the example of `width`/`height`, the problem is that the setter only
 * accepts numeric values, but the attribute can also be set to a string like `50%`.
 * If this list becomes too big, rethink this approach.
 */
const always_set_through_set_attribute = ['width', 'height'];
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key === '__value') {
            node.value = node[key] = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set && always_set_through_set_attribute.indexOf(key) === -1) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data === data)
        return;
    text.data = data;
}
function set_style(node, key, value, important) {
    if (value == null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}
function select_option(select, value, mounting) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
    if (!mounting || value !== undefined) {
        select.selectedIndex = -1; // no option should be selected
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked');
    return selected_option && selected_option.__value;
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, cancelable, detail);
    return e;
}
class HtmlTag {
    constructor(is_svg = false) {
        this.is_svg = false;
        this.is_svg = is_svg;
        this.e = this.n = null;
    }
    c(html) {
        this.h(html);
    }
    m(html, target, anchor = null) {
        if (!this.e) {
            if (this.is_svg)
                this.e = svg_element(target.nodeName);
            /** #7364  target for <template> may be provided as #document-fragment(11) */
            else
                this.e = element((target.nodeType === 11 ? 'TEMPLATE' : target.nodeName));
            this.t = target.tagName !== 'TEMPLATE' ? target : target.content;
            this.c(html);
        }
        this.i(anchor);
    }
    h(html) {
        this.e.innerHTML = html;
        this.n = Array.from(this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes);
    }
    i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
            insert(this.t, this.n[i], anchor);
        }
    }
    p(html) {
        this.d();
        this.h(html);
        this.i(this.a);
    }
    d() {
        this.n.forEach(detach);
    }
}
function construct_svelte_component(component, props) {
    return new component(props);
}

// we need to store the information for multiple documents because a Svelte application could also contain iframes
// https://github.com/sveltejs/svelte/issues/3624
const managed_styles = new Map();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_style_information(doc, node) {
    const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
    managed_styles.set(doc, info);
    return info;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = get_root_for_style(node);
    const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
    if (!rules[name]) {
        rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        managed_styles.forEach(info => {
            const { ownerNode } = info.stylesheet;
            // there is no ownerNode if it runs on jsdom.
            if (ownerNode)
                detach(ownerNode);
        });
        managed_styles.clear();
    });
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs#run-time-svelte-onmount
 */
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    // Do not reenter flush while dirty components are updated, as this can
    // result in an infinite loop. Instead, let the inner flush handle it.
    // Reentrancy is ok afterwards for bindings etc.
    if (flushidx !== 0) {
        return;
    }
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        try {
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
        }
        catch (e) {
            // reset dirty state to not end up in a deadlocked state and then rethrow
            dirty_components.length = 0;
            flushidx = 0;
            throw e;
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 */
function flush_render_callbacks(fns) {
    const filtered = [];
    const targets = [];
    render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
    targets.forEach((c) => c());
    render_callbacks = filtered;
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
    else if (callback) {
        callback();
    }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
    const options = { direction: 'both' };
    let config = fn(node, params, options);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = (program.b - t);
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config(options);
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    const updates = [];
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            // defer updates until all the DOM shuffling is done
            updates.push(() => block.p(child_ctx, dirty));
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    run_all(updates);
    return new_blocks;
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
            // if the component was destroyed immediately
            // it will update the `$$.on_destroy` reference to `null`.
            // the destructured on_destroy may still reference to the old array
            if (component.$$.on_destroy) {
                component.$$.on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        flush_render_callbacks($$.after_update);
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: [],
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        if (!is_function(callback)) {
            return noop;
        }
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=} start
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0 && stop) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

var lists;
(function (lists) {
    lists.quality = [
        "best",
        "good",
        "okay" // 480p
    ];
    lists.formats = [
        "main",
        "hardsub",
        "dub"
    ];
    lists.seasontypes = [
        "extras",
        "special" // ★; if there is a second special, ☆. use for seasons containing shorts, etc
    ];
    lists.episodetypes = [
        //"extra", // + Extra
        "special",
        "music",
        "opening",
        "ending"
    ];
    lists.seasonTypeLT = {
        extras: {
            icons: ["+"],
            placeholder: "Extras"
        },
        special: {
            icons: ["★", "☆"],
            placeholder: "Special season"
        }
    };
    // open ended lke this cause it's possible that more could be added later
    lists.episodeTypeLT = {
        special: "★ Special",
        music: "♫ Music",
        opening: "Opening",
        ending: "Ending"
    };
})(lists || (lists = {}));
// settings
var settings;
(function (settings) {
    settings.defaults = {
        videoQuality: "good",
        videoFormat: "hardsub",
        autoplay: true,
        autoskipintro: false,
        autoskipoutro: false,
        keyboardSeek: "5",
        theatre: false,
        theatreFill: "80%",
        skipbutton: true,
        developerMode: false
    };
    settings.userSet = Object.assign({}, settings.defaults);
    // controls ui elements in the settings menu
    settings.suiLinks = [
        {
            name: "Video",
            icon: "/assets/icons/video.svg",
            children: [
                {
                    label: "Preferred quality",
                    targetSetting: "videoQuality",
                    input: [...lists.quality]
                },
                {
                    label: "Preferred format",
                    targetSetting: "videoFormat",
                    input: [...lists.formats]
                }
            ]
        },
        {
            name: "Player",
            icon: "/assets/icons/player.svg",
            children: [
                {
                    label: "Autoplay",
                    targetSetting: "autoplay",
                    input: "boolean"
                },
                {
                    label: "Automatically skip intro",
                    targetSetting: "autoskipintro",
                    input: "boolean"
                },
                {
                    label: "Automatically skip outro",
                    targetSetting: "autoskipoutro",
                    input: "boolean"
                },
                {
                    label: "Arrow key skip duration",
                    targetSetting: "keyboardSeek",
                    input: ["0.01", "0.1", "1", "5", "10"]
                }
            ]
        },
        {
            name: "Interface",
            icon: "/assets/icons/window.svg",
            children: [
                {
                    label: "Theatre mode",
                    targetSetting: "theatre",
                    input: "boolean"
                },
                {
                    label: "Theatre mode fill percentage",
                    targetSetting: "theatreFill",
                    input: ["80%", "100%"]
                },
                {
                    label: "Show skip intro/outro buttons",
                    targetSetting: "skipbutton",
                    input: "boolean"
                },
                {
                    label: "Developer mode",
                    targetSetting: "developerMode",
                    input: "boolean"
                }
            ]
        }
    ];
    // ok this is just painful i gave up here
    function set(setting, value) {
        //@ts-ignore
        settings.userSet[setting] = value;
    }
    settings.set = set;
})(settings || (settings = {}));
let isMovie = (video) => { return !!video.icon; };
let isShow = (obj) => !!obj.seasons;
let isSeason = (obj) => !!obj.episodes;
let isEpisode = (video) => { return !!video.parent; };
// utility functions
// these are very redundant; but i guess it means "futureproofing"
function getBestFormat(video, requested) {
    let availableFormats = Object.keys(video.formats);
    if (video.formats[requested])
        return requested;
    let idxOf = lists.formats.indexOf(requested);
    for (let i = idxOf - 1; i > 0; i--) {
        if (lists.formats[i] && availableFormats.includes(lists.formats[i]))
            return lists.formats[i];
    }
    return "main";
}
function getSeasonLabel(season) {
    var _a;
    let show = IDIndex.get(season.parent);
    if (!show || !isShow(show))
        return "❔";
    // this is a mess LOL
    // oh well
    return season.type
        ? lists.seasonTypeLT[season.type].icons[(_a = show === null || show === void 0 ? void 0 : show.seasons.filter(e => e.type == season.type).indexOf(season)) !== null && _a !== void 0 ? _a : lists.seasonTypeLT[season.type].icons.length - 1] || lists.seasonTypeLT[season.type].icons[lists.seasonTypeLT[season.type].icons.length - 1]
        : `S${show.seasons.indexOf(season) + 1}`;
}
function getEpisodeLabel(episode) {
    let season = IDIndex.get(episode.parent);
    if (!season || !isSeason(season))
        return "❔";
    let slabel = getSeasonLabel(season);
    return `${slabel}${!season.type ? "E" : ""}${season.episodes.indexOf(episode) + 1}`;
}
/*
export function getNearestQuality(video: Video, format: videoFormat, requested: videoQuality) : videoQuality {
    let availableQualities = video.formats[format]


    if (video.formats[format][requested]) return requested
    
    let idxOf = lists.quality.indexOf(requested)

    

    return "okay"
}
*/
// set up svt stores
let cfg = writable();
let tv = writable();
let movies = writable();
let embeddables = writable();
let ready = writable(false);
let IDIndex = new Map();
// fetch cfg; tv; movies
// might DRY up this code later
fetch("/db/webtv.json", { cache: "no-store" }).then(res => {
    if (res.status == 200)
        res.json().then(e => cfg.set(e));
})
    .then(() => fetch("/db/tv.json", { cache: "no-store" }).then(res => {
    if (res.status == 200)
        res.json().then((e) => {
            tv.set(e);
            e.forEach(v => {
                IDIndex.set(v.id, v);
                v.seasons.forEach(a => {
                    IDIndex.set(a.id, a);
                    a.episodes.forEach(b => IDIndex.set(b.id, b));
                });
            });
        });
}))
    .then(() => fetch("/db/movie.json", { cache: "no-store" }).then(res => {
    if (res.status == 200)
        res.json().then((e) => {
            movies.set(e);
            e.forEach(v => {
                IDIndex.set("movie." + v.id, v);
            });
        });
}))
    .then(() => fetch("/db/embeddables.json", { cache: "no-store" }).then(res => {
    if (res.status == 200)
        res.json().then(e => embeddables.set(e));
})).then(() => {
    ready.set(true);
});

/* src/svelte/elm/Sidebar.svelte generated by Svelte v3.59.1 */

function get_each_context$4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (24:51) 
function create_if_block_4$3(ctx) {
	let html_tag;
	let raw_value = /*item*/ ctx[6].icon.content + "";
	let html_anchor;

	return {
		c() {
			html_tag = new HtmlTag(false);
			html_anchor = empty();
			html_tag.a = html_anchor;
		},
		m(target, anchor) {
			html_tag.m(raw_value, target, anchor);
			insert(target, html_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*items*/ 2 && raw_value !== (raw_value = /*item*/ ctx[6].icon.content + "")) html_tag.p(raw_value);
		},
		d(detaching) {
			if (detaching) detach(html_anchor);
			if (detaching) html_tag.d();
		}
	};
}

// (22:51) 
function create_if_block_3$3(ctx) {
	let p;
	let t_value = /*item*/ ctx[6].icon.content + "";
	let t;

	return {
		c() {
			p = element("p");
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t);
		},
		p(ctx, dirty) {
			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[6].icon.content + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (18:16) {#if item.icon.type == "image"}
function create_if_block_2$4(ctx) {
	let div;
	let img;
	let img_src_value;
	let img_alt_value;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			img = element("img");
			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[6].icon.content)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = /*item*/ ctx[6].text);
			attr(div, "class", "icontainer");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, img);

			if (!mounted) {
				dispose = listen(img, "load", load_handler$4);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*items*/ 2 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[6].icon.content)) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*items*/ 2 && img_alt_value !== (img_alt_value = /*item*/ ctx[6].text)) {
				attr(img, "alt", img_alt_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (29:16) {#if item.title}
function create_if_block_1$4(ctx) {
	let p;
	let t_value = /*item*/ ctx[6].title + "";
	let t;

	return {
		c() {
			p = element("p");
			t = text(t_value);
			attr(p, "class", "note");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t);
		},
		p(ctx, dirty) {
			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[6].title + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (36:16) {#if item.note||settings.userSet.developerMode}
function create_if_block$7(ctx) {
	let p;
	let t0_value = (/*item*/ ctx[6].note || "") + "";
	let t0;
	let html_tag;

	let raw_value = (/*item*/ ctx[6].note && settings.userSet.developerMode
	? "<br>"
	: "") + "";

	let t1_value = (settings.userSet.developerMode ? /*item*/ ctx[6].id : "") + "";
	let t1;

	return {
		c() {
			p = element("p");
			t0 = text(t0_value);
			html_tag = new HtmlTag(false);
			t1 = text(t1_value);
			html_tag.a = t1;
			attr(p, "class", "note");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t0);
			html_tag.m(raw_value, p);
			append(p, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*items*/ 2 && t0_value !== (t0_value = (/*item*/ ctx[6].note || "") + "")) set_data(t0, t0_value);

			if (dirty & /*items*/ 2 && raw_value !== (raw_value = (/*item*/ ctx[6].note && settings.userSet.developerMode
			? "<br>"
			: "") + "")) html_tag.p(raw_value);

			if (dirty & /*items*/ 2 && t1_value !== (t1_value = (settings.userSet.developerMode ? /*item*/ ctx[6].id : "") + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (14:4) {#each items as item (item.id)}
function create_each_block$4(key_1, ctx) {
	let div2;
	let div0;
	let div0_data_circular_value;
	let t0;
	let div1;
	let t1;
	let p;
	let t2_value = /*item*/ ctx[6].text + "";
	let t2;
	let t3;
	let t4;
	let button;
	let t5;
	let div2_data_active_value;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*item*/ ctx[6].icon.type == "image") return create_if_block_2$4;
		if (/*item*/ ctx[6].icon.type == "text") return create_if_block_3$3;
		if (/*item*/ ctx[6].icon.type == "html") return create_if_block_4$3;
	}

	let current_block_type = select_block_type(ctx);
	let if_block0 = current_block_type && current_block_type(ctx);
	let if_block1 = /*item*/ ctx[6].title && create_if_block_1$4(ctx);
	let if_block2 = (/*item*/ ctx[6].note || settings.userSet.developerMode) && create_if_block$7(ctx);

	function click_handler() {
		return /*click_handler*/ ctx[5](/*item*/ ctx[6]);
	}

	return {
		key: key_1,
		first: null,
		c() {
			div2 = element("div");
			div0 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			div1 = element("div");
			if (if_block1) if_block1.c();
			t1 = space();
			p = element("p");
			t2 = text(t2_value);
			t3 = space();
			if (if_block2) if_block2.c();
			t4 = space();
			button = element("button");
			t5 = space();
			attr(div0, "class", "icon");
			attr(div0, "data-circular", div0_data_circular_value = /*item*/ ctx[6].icon.circular);
			attr(div1, "class", "content");
			attr(button, "class", "hitbox");
			attr(div2, "class", "listItem");

			attr(div2, "data-active", div2_data_active_value = /*item*/ ctx[6].id == /*active*/ ctx[0]
			? "true"
			: "false");

			this.first = div2;
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			if (if_block0) if_block0.m(div0, null);
			append(div2, t0);
			append(div2, div1);
			if (if_block1) if_block1.m(div1, null);
			append(div1, t1);
			append(div1, p);
			append(p, t2);
			append(div1, t3);
			if (if_block2) if_block2.m(div1, null);
			append(div2, t4);
			append(div2, button);
			append(div2, t5);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if (if_block0) if_block0.d(1);
				if_block0 = current_block_type && current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(div0, null);
				}
			}

			if (dirty & /*items*/ 2 && div0_data_circular_value !== (div0_data_circular_value = /*item*/ ctx[6].icon.circular)) {
				attr(div0, "data-circular", div0_data_circular_value);
			}

			if (/*item*/ ctx[6].title) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1$4(ctx);
					if_block1.c();
					if_block1.m(div1, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*items*/ 2 && t2_value !== (t2_value = /*item*/ ctx[6].text + "")) set_data(t2, t2_value);

			if (/*item*/ ctx[6].note || settings.userSet.developerMode) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block$7(ctx);
					if_block2.c();
					if_block2.m(div1, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (dirty & /*items, active*/ 3 && div2_data_active_value !== (div2_data_active_value = /*item*/ ctx[6].id == /*active*/ ctx[0]
			? "true"
			: "false")) {
				attr(div2, "data-active", div2_data_active_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div2);

			if (if_block0) {
				if_block0.d();
			}

			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$a(ctx) {
	let div;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let each_value = /*items*/ ctx[1];
	const get_key = ctx => /*item*/ ctx[6].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$4(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
	}

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "class", "sidebar");
			attr(div, "id", "sidebar_main");
			set_style(div, "--wdth", `${/*width*/ ctx[2]}px`);
			set_style(div, "--level", `var(--sf${/*level*/ ctx[3]})`);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div, null);
				}
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*items, active, settings*/ 3) {
				each_value = /*items*/ ctx[1];
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$4, null, get_each_context$4);
			}

			if (dirty & /*width*/ 4) {
				set_style(div, "--wdth", `${/*width*/ ctx[2]}px`);
			}

			if (dirty & /*level*/ 8) {
				set_style(div, "--level", `var(--sf${/*level*/ ctx[3]})`);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

const load_handler$4 = e => e.currentTarget.setAttribute("data-loaded", "");

function instance$9($$self, $$props, $$invalidate) {
	let { items = [] } = $$props;
	let { width = 200 } = $$props;
	let { level = 2 } = $$props;
	let { dft = undefined } = $$props;
	let { active = dft } = $$props;
	const click_handler = item => $$invalidate(0, active = item.id);

	$$self.$$set = $$props => {
		if ('items' in $$props) $$invalidate(1, items = $$props.items);
		if ('width' in $$props) $$invalidate(2, width = $$props.width);
		if ('level' in $$props) $$invalidate(3, level = $$props.level);
		if ('dft' in $$props) $$invalidate(4, dft = $$props.dft);
		if ('active' in $$props) $$invalidate(0, active = $$props.active);
	};

	return [active, items, width, level, dft, click_handler];
}

class Sidebar extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$9, create_fragment$a, safe_not_equal, {
			items: 1,
			width: 2,
			level: 3,
			dft: 4,
			active: 0
		});
	}
}

/* src/svelte/screens/ScreenHome.svelte generated by Svelte v3.59.1 */

function create_fragment$9(ctx) {
	let div;

	return {
		c() {
			div = element("div");

			div.innerHTML = `<h1>webtv
        <span><br/>simple and sweet. let&#39;s get started.</span></h1>`;

			attr(div, "class", "screen");
			attr(div, "id", "screenHome");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

class ScreenHome extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$9, safe_not_equal, {});
	}
}

/* src/svelte/screens/ScreenEmbeddables.svelte generated by Svelte v3.59.1 */

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

// (48:8) {:else}
function create_else_block$2(ctx) {
	let div;

	return {
		c() {
			div = element("div");

			div.innerHTML = `<h1>webtv <em>embeddables</em> 
                    <span><br/>these links embed in discord; send them to your friends &amp; such</span></h1>`;

			attr(div, "class", "nothingSelected");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (27:8) {#if activeEl}
function create_if_block$6(ctx) {
	let div3;
	let div1;
	let img;
	let img_src_value;
	let img_alt_value;
	let t0;
	let div0;
	let h1;
	let t1_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].name + "";
	let t1;
	let t2;
	let p;
	let t3_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].urls.length + "";
	let t3;
	let t4;
	let t5;
	let div2;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let mounted;
	let dispose;
	let each_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].urls;
	const get_key = ctx => /*url*/ ctx[7].url;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$3(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
	}

	return {
		c() {
			div3 = element("div");
			div1 = element("div");
			img = element("img");
			t0 = space();
			div0 = element("div");
			h1 = element("h1");
			t1 = text(t1_value);
			t2 = space();
			p = element("p");
			t3 = text(t3_value);
			t4 = text(" url(s)");
			t5 = space();
			div2 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			if (!src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[0].host + /*idx*/ ctx[3][/*activeEl*/ ctx[1]].icon)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].name);
			attr(div0, "class", "txt");
			attr(div1, "class", "header");
			attr(div2, "class", "otherInfo");
			attr(div3, "class", "embList");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div1);
			append(div1, img);
			append(div1, t0);
			append(div1, div0);
			append(div0, h1);
			append(h1, t1);
			append(div0, t2);
			append(div0, p);
			append(p, t3);
			append(p, t4);
			append(div3, t5);
			append(div3, div2);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div2, null);
				}
			}

			if (!mounted) {
				dispose = listen(img, "load", load_handler$3);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*$cfg, idx, activeEl*/ 11 && !src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[0].host + /*idx*/ ctx[3][/*activeEl*/ ctx[1]].icon)) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*idx, activeEl*/ 10 && img_alt_value !== (img_alt_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].name)) {
				attr(img, "alt", img_alt_value);
			}

			if (dirty & /*idx, activeEl*/ 10 && t1_value !== (t1_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].name + "")) set_data(t1, t1_value);
			if (dirty & /*idx, activeEl*/ 10 && t3_value !== (t3_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].urls.length + "")) set_data(t3, t3_value);

			if (dirty & /*idx, activeEl*/ 10) {
				each_value = /*idx*/ ctx[3][/*activeEl*/ ctx[1]].urls;
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div2, destroy_block, create_each_block$3, null, get_each_context$3);
			}
		},
		d(detaching) {
			if (detaching) detach(div3);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			mounted = false;
			dispose();
		}
	};
}

// (39:20) {#each idx[activeEl].urls as url (url.url)}
function create_each_block$3(key_1, ctx) {
	let p;
	let a;
	let t0_value = /*url*/ ctx[7].url + "";
	let t0;
	let a_href_value;
	let t1;
	let br;
	let t2;
	let t3_value = /*url*/ ctx[7].description + "";
	let t3;
	let t4;

	return {
		key: key_1,
		first: null,
		c() {
			p = element("p");
			a = element("a");
			t0 = text(t0_value);
			t1 = space();
			br = element("br");
			t2 = text("    ");
			t3 = text(t3_value);
			t4 = space();
			attr(a, "href", a_href_value = /*url*/ ctx[7].url);
			this.first = p;
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, a);
			append(a, t0);
			append(p, t1);
			append(p, br);
			append(p, t2);
			append(p, t3);
			append(p, t4);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*idx, activeEl*/ 10 && t0_value !== (t0_value = /*url*/ ctx[7].url + "")) set_data(t0, t0_value);

			if (dirty & /*idx, activeEl*/ 10 && a_href_value !== (a_href_value = /*url*/ ctx[7].url)) {
				attr(a, "href", a_href_value);
			}

			if (dirty & /*idx, activeEl*/ 10 && t3_value !== (t3_value = /*url*/ ctx[7].description + "")) set_data(t3, t3_value);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

function create_fragment$8(ctx) {
	let div1;
	let sidebar;
	let updating_active;
	let updating_items;
	let t;
	let div0;
	let current;

	function sidebar_active_binding(value) {
		/*sidebar_active_binding*/ ctx[5](value);
	}

	function sidebar_items_binding(value) {
		/*sidebar_items_binding*/ ctx[6](value);
	}

	let sidebar_props = { level: 1, width: 250 };

	if (/*activeEl*/ ctx[1] !== void 0) {
		sidebar_props.active = /*activeEl*/ ctx[1];
	}

	if (/*sbItems*/ ctx[2] !== void 0) {
		sidebar_props.items = /*sbItems*/ ctx[2];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding));
	binding_callbacks.push(() => bind(sidebar, 'items', sidebar_items_binding));

	function select_block_type(ctx, dirty) {
		if (/*activeEl*/ ctx[1]) return create_if_block$6;
		return create_else_block$2;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div1 = element("div");
			create_component(sidebar.$$.fragment);
			t = space();
			div0 = element("div");
			if_block.c();
			attr(div0, "class", "content");
			attr(div1, "class", "screen");
			attr(div1, "id", "screenEmbeddables");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(sidebar, div1, null);
			append(div1, t);
			append(div1, div0);
			if_block.m(div0, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const sidebar_changes = {};

			if (!updating_active && dirty & /*activeEl*/ 2) {
				updating_active = true;
				sidebar_changes.active = /*activeEl*/ ctx[1];
				add_flush_callback(() => updating_active = false);
			}

			if (!updating_items && dirty & /*sbItems*/ 4) {
				updating_items = true;
				sidebar_changes.items = /*sbItems*/ ctx[2];
				add_flush_callback(() => updating_items = false);
			}

			sidebar.$set(sidebar_changes);

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div0, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(sidebar);
			if_block.d();
		}
	};
}

const load_handler$3 = e => e.currentTarget.setAttribute("data-loaded", "");

function instance$8($$self, $$props, $$invalidate) {
	let $embeddables;
	let $cfg;
	component_subscribe($$self, embeddables, $$value => $$invalidate(4, $embeddables = $$value));
	component_subscribe($$self, cfg, $$value => $$invalidate(0, $cfg = $$value));
	let activeEl = undefined;
	let sbItems = [];
	let idx = {};

	function sidebar_active_binding(value) {
		activeEl = value;
		$$invalidate(1, activeEl);
	}

	function sidebar_items_binding(value) {
		sbItems = value;
		(($$invalidate(2, sbItems), $$invalidate(4, $embeddables)), $$invalidate(0, $cfg));
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$embeddables, $cfg*/ 17) {
			{
				$$invalidate(2, sbItems = $embeddables.map(e => {
					return {
						id: e.name,
						text: e.name,
						icon: {
							type: "image",
							content: $cfg.host + e.icon,
							circular: true
						}
					};
				}));

				$embeddables.forEach(v => {
					$$invalidate(3, idx[v.name] = v, idx);
				});
			}
		}
	};

	return [
		$cfg,
		activeEl,
		sbItems,
		idx,
		$embeddables,
		sidebar_active_binding,
		sidebar_items_binding
	];
}

class ScreenEmbeddables extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
	}
}

let selected = writable();
// I'm lazy, fight me
let watchPage_season = writable("showAbout");
let watchPage_episode = writable();
let playerVolume = writable(1);
let playerTemp_autoplayNext = writable(false);

function getPVs(time) {
    return {
        hours: Math.floor(time / 3600),
        minutes: Math.floor(time % 3600 / 60),
        seconds: Math.floor(time % 60)
    };
}
function colonTime(time) {
    let PVs = getPVs(time);
    return ([
        // only include hours if specified
        ...(PVs.hours ? [PVs.hours] : []), PVs.minutes, PVs.seconds
    ])
        .map((v, x) => v < 10 && x > 0
        ? `0${v}`
        : v.toString()) // add zeros
        .join(":"); // join
}
let seps = ["h", "m", "s"].reverse();
function letteredTime(time) {
    let PVs = getPVs(time);
    return ([
        // only include hours if specified
        ...(PVs.hours ? [PVs.hours] : []), PVs.minutes, PVs.seconds
    ]).reverse()
        .map((v, x) => `${v}${seps[x]}`) // add seps
        .reverse()
        .join(""); // join
}
function getEpisodeAfter(episode) {
    var _a, _b;
    // get parent show and season
    let season = IDIndex.get(episode.parent);
    if (!season || !isSeason(season))
        return;
    let show = IDIndex.get(season.parent);
    if (!show || !isShow(show))
        return;
    // return episode which follows
    let epIdx = season.episodes.indexOf(episode);
    let seIdx = show.seasons.indexOf(season);
    return season.episodes[epIdx + 1]
        || ((_b = (_a = show.seasons[seIdx + 1]) === null || _a === void 0 ? void 0 : _a.episodes) === null || _b === void 0 ? void 0 : _b[0]);
}

/* src/svelte/elm/FormatDownloader.svelte generated by Svelte v3.59.1 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

function get_each_context_1$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	return child_ctx;
}

// (11:12) {#each Object.keys(target.formats) as fmt}
function create_each_block_1$2(ctx) {
	let option;
	let t_value = /*fmt*/ ctx[10] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*fmt*/ ctx[10];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(ctx, dirty) {
			if (dirty & /*target*/ 1 && t_value !== (t_value = /*fmt*/ ctx[10] + "")) set_data(t, t_value);

			if (dirty & /*target*/ 1 && option_value_value !== (option_value_value = /*fmt*/ ctx[10])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (17:12) {#each Object.keys(target.formats[selectedFormat]) as qual}
function create_each_block$2(ctx) {
	let option;
	let t_value = /*qual*/ ctx[7] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*qual*/ ctx[7];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(ctx, dirty) {
			if (dirty & /*target, selectedFormat*/ 3 && t_value !== (t_value = /*qual*/ ctx[7] + "")) set_data(t, t_value);

			if (dirty & /*target, selectedFormat, Object*/ 3 && option_value_value !== (option_value_value = /*qual*/ ctx[7])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment$7(ctx) {
	let div1;
	let div0;
	let select0;
	let t0;
	let span;
	let t2;
	let select1;
	let t3;
	let button;
	let img;
	let img_src_value;
	let mounted;
	let dispose;
	let each_value_1 = Object.keys(/*target*/ ctx[0].formats);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
	}

	let each_value = Object.keys(/*target*/ ctx[0].formats[/*selectedFormat*/ ctx[1]]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	let button_levels = [
		!/*selectedFormat*/ ctx[1] || !/*quality*/ ctx[2]
		? ["disabled"]
		: []
	];

	let button_data = {};

	for (let i = 0; i < button_levels.length; i += 1) {
		button_data = assign(button_data, button_levels[i]);
	}

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			select0 = element("select");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t0 = space();
			span = element("span");
			span.textContent = "/";
			t2 = space();
			select1 = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t3 = space();
			button = element("button");
			img = element("img");
			attr(select0, "class", "fPicker");
			if (/*selectedFormat*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[4].call(select0));
			attr(span, "class", "qPicker");
			attr(select1, "class", "qPicker");
			if (/*quality*/ ctx[2] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[5].call(select1));
			attr(div0, "class", "left");
			if (!src_url_equal(img.src, img_src_value = "/assets/icons/download.svg")) attr(img, "src", img_src_value);
			attr(img, "alt", "Download");
			set_attributes(button, button_data);
			attr(div1, "class", "downloadPicker");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div0, select0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				if (each_blocks_1[i]) {
					each_blocks_1[i].m(select0, null);
				}
			}

			select_option(select0, /*selectedFormat*/ ctx[1], true);
			append(div0, t0);
			append(div0, span);
			append(div0, t2);
			append(div0, select1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(select1, null);
				}
			}

			select_option(select1, /*quality*/ ctx[2], true);
			append(div1, t3);
			append(div1, button);
			append(button, img);
			if (button.autofocus) button.focus();

			if (!mounted) {
				dispose = [
					listen(select0, "change", /*select0_change_handler*/ ctx[4]),
					listen(select1, "change", /*select1_change_handler*/ ctx[5]),
					listen(button, "click", /*click_handler*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*Object, target*/ 1) {
				each_value_1 = Object.keys(/*target*/ ctx[0].formats);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(select0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*selectedFormat, Object, target*/ 3) {
				select_option(select0, /*selectedFormat*/ ctx[1]);
			}

			if (dirty & /*Object, target, selectedFormat*/ 3) {
				each_value = Object.keys(/*target*/ ctx[0].formats[/*selectedFormat*/ ctx[1]]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*quality, Object, target, selectedFormat*/ 7) {
				select_option(select1, /*quality*/ ctx[2]);
			}

			set_attributes(button, button_data = get_spread_update(button_levels, [
				dirty & /*selectedFormat, quality*/ 6 && (!/*selectedFormat*/ ctx[1] || !/*quality*/ ctx[2]
				? ["disabled"]
				: [])
			]));
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div1);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let $cfg;
	component_subscribe($$self, cfg, $$value => $$invalidate(3, $cfg = $$value));
	let { target } = $$props;
	let selectedFormat = getBestFormat(target, settings.userSet.videoFormat);
	let quality = settings.userSet.videoQuality;

	function select0_change_handler() {
		selectedFormat = select_value(this);
		$$invalidate(1, selectedFormat);
		$$invalidate(0, target);
	}

	function select1_change_handler() {
		quality = select_value(this);
		$$invalidate(2, quality);
		$$invalidate(0, target);
		$$invalidate(1, selectedFormat);
	}

	const click_handler = () => {
		let TMP = document.createElement("a");
		TMP.setAttribute("href", $cfg.host + target.formats[selectedFormat][quality] + "?attachment=1");
		TMP.setAttribute("download", `${target.id}.${selectedFormat}-${quality}`);
		TMP.click();
		TMP.remove();
	};

	$$self.$$set = $$props => {
		if ('target' in $$props) $$invalidate(0, target = $$props.target);
	};

	return [
		target,
		selectedFormat,
		quality,
		$cfg,
		select0_change_handler,
		select1_change_handler,
		click_handler
	];
}

class FormatDownloader extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { target: 0 });
	}
}

/* src/svelte/elm/NextEpDisplay.svelte generated by Svelte v3.59.1 */

function create_fragment$6(ctx) {
	let div3;
	let h2;
	let t1;
	let div2;
	let div0;
	let img;
	let img_src_value;
	let img_alt_value;
	let t2;
	let div1;
	let p0;
	let t3_value = /*target*/ ctx[0].name + "";
	let t3;
	let t4;
	let p1;
	let t5_value = getEpisodeLabel(/*target*/ ctx[0]) + "";
	let t5;
	let t6;
	let t7_value = letteredTime(/*target*/ ctx[0].length) + "";
	let t7;
	let t8;
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			div3 = element("div");
			h2 = element("h2");
			h2.textContent = "Next episode";
			t1 = space();
			div2 = element("div");
			div0 = element("div");
			img = element("img");
			t2 = space();
			div1 = element("div");
			p0 = element("p");
			t3 = text(t3_value);
			t4 = space();
			p1 = element("p");
			t5 = text(t5_value);
			t6 = text(" — ");
			t7 = text(t7_value);
			t8 = space();
			button = element("button");
			if (!src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[2].host + /*target*/ ctx[0].thumbnail)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = "Thumbnail for " + /*target*/ ctx[0].name);
			attr(div0, "class", "thumbnail");
			set_style(div0, "aspect-ratio", /*target*/ ctx[0].aspectRatio || "16 / 9");
			attr(p0, "class", "vTitle");
			attr(div1, "class", "videoData");
			attr(button, "class", "hitbox");
			attr(div2, "class", "nuCont");
			attr(div3, "class", "nextUp");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, h2);
			append(div3, t1);
			append(div3, div2);
			append(div2, div0);
			append(div0, img);
			append(div2, t2);
			append(div2, div1);
			append(div1, p0);
			append(p0, t3);
			append(div1, t4);
			append(div1, p1);
			append(p1, t5);
			append(p1, t6);
			append(p1, t7);
			append(div2, t8);
			append(div2, button);

			if (!mounted) {
				dispose = [
					listen(img, "load", load_handler$2),
					listen(button, "click", /*click_handler*/ ctx[5])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*$cfg, target*/ 5 && !src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[2].host + /*target*/ ctx[0].thumbnail)) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*target*/ 1 && img_alt_value !== (img_alt_value = "Thumbnail for " + /*target*/ ctx[0].name)) {
				attr(img, "alt", img_alt_value);
			}

			if (dirty & /*target*/ 1) {
				set_style(div0, "aspect-ratio", /*target*/ ctx[0].aspectRatio || "16 / 9");
			}

			if (dirty & /*target*/ 1 && t3_value !== (t3_value = /*target*/ ctx[0].name + "")) set_data(t3, t3_value);
			if (dirty & /*target*/ 1 && t5_value !== (t5_value = getEpisodeLabel(/*target*/ ctx[0]) + "")) set_data(t5, t5_value);
			if (dirty & /*target*/ 1 && t7_value !== (t7_value = letteredTime(/*target*/ ctx[0].length) + "")) set_data(t7, t7_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div3);
			mounted = false;
			run_all(dispose);
		}
	};
}

const load_handler$2 = e => e.currentTarget.setAttribute("data-loaded", "");

function instance$6($$self, $$props, $$invalidate) {
	let $cfg;
	let $watchPage_episode;
	let $watchPage_season;
	component_subscribe($$self, cfg, $$value => $$invalidate(2, $cfg = $$value));
	component_subscribe($$self, watchPage_episode, $$value => $$invalidate(3, $watchPage_episode = $$value));
	component_subscribe($$self, watchPage_season, $$value => $$invalidate(4, $watchPage_season = $$value));
	let { target } = $$props;
	let season;
	let season_tmp = IDIndex.get(target.parent);

	if (season_tmp && isSeason(season_tmp)) {
		season = season_tmp;
		let tmp = IDIndex.get(season.parent);
		if (tmp && isShow(tmp)) ;
	}

	const click_handler = () => {
		set_store_value(watchPage_episode, $watchPage_episode = target.id, $watchPage_episode);
		set_store_value(watchPage_season, $watchPage_season = season.id, $watchPage_season);
	};

	$$self.$$set = $$props => {
		if ('target' in $$props) $$invalidate(0, target = $$props.target);
	};

	return [target, season, $cfg, $watchPage_episode, $watchPage_season, click_handler];
}

class NextEpDisplay extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { target: 0 });
	}
}

function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        easing,
        css: t => `opacity: ${t * o}`
    };
}

/* src/svelte/elm/VideoPlayer.svelte generated by Svelte v3.59.1 */

const { document: document_1 } = globals;

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[52] = list[i];
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[55] = list[i];
	return child_ctx;
}

// (155:4) {#key $cfg.host + playing.formats[format][quality]}
function create_key_block$3(ctx) {
	let video;
	let video_poster_value;
	let video_src_value;
	let video_is_paused = true;
	let video_updating = false;
	let video_animationframe;
	let mounted;
	let dispose;

	function video_timeupdate_handler() {
		cancelAnimationFrame(video_animationframe);

		if (!video.paused) {
			video_animationframe = raf(video_timeupdate_handler);
			video_updating = true;
		}

		/*video_timeupdate_handler*/ ctx[27].call(video);
	}

	return {
		c() {
			video = element("video");
			attr(video, "poster", video_poster_value = /*playing*/ ctx[0].thumbnail && /*$cfg*/ ctx[17].host + /*playing*/ ctx[0].thumbnail || "");
			if (!src_url_equal(video.src, video_src_value = /*$cfg*/ ctx[17].host + /*playing*/ ctx[0].formats[/*format*/ ctx[1]][/*quality*/ ctx[2]])) attr(video, "src", video_src_value);
			attr(video, "id", "videoElement");
			if (/*videoReadyState*/ ctx[10] === void 0) add_render_callback(() => /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25].call(video));
			if (/*duration*/ ctx[4] === void 0) add_render_callback(() => /*video_durationchange_handler*/ ctx[28].call(video));
			set_style(video, "cursor", /*showControls*/ ctx[13] ? "default" : "none");
		},
		m(target, anchor) {
			insert(target, video, anchor);
			/*video_binding*/ ctx[29](video);

			if (!isNaN(/*$playerVolume*/ ctx[18])) {
				video.volume = /*$playerVolume*/ ctx[18];
			}

			if (!mounted) {
				dispose = [
					listen(video, "loadedmetadata", /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25]),
					listen(video, "loadeddata", /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25]),
					listen(video, "canplay", /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25]),
					listen(video, "canplaythrough", /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25]),
					listen(video, "playing", /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25]),
					listen(video, "waiting", /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25]),
					listen(video, "emptied", /*video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler*/ ctx[25]),
					listen(video, "play", /*video_play_pause_handler*/ ctx[26]),
					listen(video, "pause", /*video_play_pause_handler*/ ctx[26]),
					listen(video, "timeupdate", video_timeupdate_handler),
					listen(video, "durationchange", /*video_durationchange_handler*/ ctx[28]),
					listen(video, "volumechange", /*video_volumechange_handler*/ ctx[30]),
					listen(video, "click", /*click_handler*/ ctx[31]),
					listen(video, "loadeddata", /*loadHandler*/ ctx[24])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*playing, $cfg*/ 131073 && video_poster_value !== (video_poster_value = /*playing*/ ctx[0].thumbnail && /*$cfg*/ ctx[17].host + /*playing*/ ctx[0].thumbnail || "")) {
				attr(video, "poster", video_poster_value);
			}

			if (dirty[0] & /*$cfg, playing, format, quality*/ 131079 && !src_url_equal(video.src, video_src_value = /*$cfg*/ ctx[17].host + /*playing*/ ctx[0].formats[/*format*/ ctx[1]][/*quality*/ ctx[2]])) {
				attr(video, "src", video_src_value);
			}

			if (dirty[0] & /*isPaused*/ 64 && video_is_paused !== (video_is_paused = /*isPaused*/ ctx[6])) {
				video[video_is_paused ? "pause" : "play"]();
			}

			if (!video_updating && dirty[0] & /*progress*/ 32 && !isNaN(/*progress*/ ctx[5])) {
				video.currentTime = /*progress*/ ctx[5];
			}

			video_updating = false;

			if (dirty[0] & /*$playerVolume*/ 262144 && !isNaN(/*$playerVolume*/ ctx[18])) {
				video.volume = /*$playerVolume*/ ctx[18];
			}

			if (dirty[0] & /*showControls*/ 8192) {
				set_style(video, "cursor", /*showControls*/ ctx[13] ? "default" : "none");
			}
		},
		d(detaching) {
			if (detaching) detach(video);
			/*video_binding*/ ctx[29](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (171:4) {#if videoReadyState < 2}
function create_if_block_7(ctx) {
	let div1;
	let t;
	let div0;
	let div1_transition;
	let current;
	let mounted;
	let dispose;
	let if_block = settings.userSet.developerMode && create_if_block_8(ctx);

	return {
		c() {
			div1 = element("div");
			if (if_block) if_block.c();
			t = space();
			div0 = element("div");
			attr(div0, "class", "loadingSpinner");
			attr(div1, "class", "loadingOverlay");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			if (if_block) if_block.m(div1, null);
			append(div1, t);
			append(div1, div0);
			current = true;

			if (!mounted) {
				dispose = listen(div1, "click", /*click_handler_1*/ ctx[32]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (settings.userSet.developerMode) if_block.p(ctx, dirty);
		},
		i(local) {
			if (current) return;

			if (local) {
				add_render_callback(() => {
					if (!current) return;
					if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 200 }, true);
					div1_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			if (local) {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 200 }, false);
				div1_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			if (if_block) if_block.d();
			if (detaching && div1_transition) div1_transition.end();
			mounted = false;
			dispose();
		}
	};
}

// (175:12) {#if settings.userSet.developerMode}
function create_if_block_8(ctx) {
	let p;
	let t0;
	let t1;
	let br0;
	let t2;
	let t3;
	let br1;
	let t4;
	let t5;

	return {
		c() {
			p = element("p");
			t0 = text("videoReadyState ");
			t1 = text(/*videoReadyState*/ ctx[10]);
			br0 = element("br");
			t2 = text("realProgress ");
			t3 = text(/*progress*/ ctx[5]);
			br1 = element("br");
			t4 = text("duration ");
			t5 = text(/*duration*/ ctx[4]);
			attr(p, "class", "monospaceText");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t0);
			append(p, t1);
			append(p, br0);
			append(p, t2);
			append(p, t3);
			append(p, br1);
			append(p, t4);
			append(p, t5);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*videoReadyState*/ 1024) set_data(t1, /*videoReadyState*/ ctx[10]);
			if (dirty[0] & /*progress*/ 32) set_data(t3, /*progress*/ ctx[5]);
			if (dirty[0] & /*duration*/ 16) set_data(t5, /*duration*/ ctx[4]);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (183:4) {#if isEpisode(playing) && settings.userSet.skipbutton}
function create_if_block_4$2(ctx) {
	let t;
	let if_block1_anchor;
	let if_block0 = /*playing*/ ctx[0].intro && /*progress*/ ctx[5] >= /*playing*/ ctx[0].intro[0] && /*progress*/ ctx[5] < /*playing*/ ctx[0].intro[1] && create_if_block_6(ctx);
	let if_block1 = /*playing*/ ctx[0].outro && /*progress*/ ctx[5] >= /*playing*/ ctx[0].outro[0] && /*progress*/ ctx[5] < (/*playing*/ ctx[0].outro[1] || /*duration*/ ctx[4]) && create_if_block_5$1(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (/*playing*/ ctx[0].intro && /*progress*/ ctx[5] >= /*playing*/ ctx[0].intro[0] && /*progress*/ ctx[5] < /*playing*/ ctx[0].intro[1]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*playing, progress*/ 33) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_6(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(t.parentNode, t);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*playing*/ ctx[0].outro && /*progress*/ ctx[5] >= /*playing*/ ctx[0].outro[0] && /*progress*/ ctx[5] < (/*playing*/ ctx[0].outro[1] || /*duration*/ ctx[4])) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*playing, progress, duration*/ 49) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_5$1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}
		},
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(if_block1_anchor);
		}
	};
}

// (184:8) {#if playing.intro && progress >= playing.intro[0] && progress < playing.intro[1]}
function create_if_block_6(ctx) {
	let button;
	let button_transition;
	let current;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			button.textContent = "Skip intro";
			attr(button, "class", "skipButton");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler_2*/ ctx[33]);
				mounted = true;
			}
		},
		p: noop,
		i(local) {
			if (current) return;

			if (local) {
				add_render_callback(() => {
					if (!current) return;
					if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, true);
					button_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			if (local) {
				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, false);
				button_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if (detaching && button_transition) button_transition.end();
			mounted = false;
			dispose();
		}
	};
}

// (195:8) {#if playing.outro && progress >= playing.outro[0] && progress < (playing.outro[1]||duration)}
function create_if_block_5$1(ctx) {
	let button;
	let button_transition;
	let current;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			button.textContent = "Skip outro";
			attr(button, "class", "skipButton");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler_3*/ ctx[34]);
				mounted = true;
			}
		},
		p: noop,
		i(local) {
			if (current) return;

			if (local) {
				add_render_callback(() => {
					if (!current) return;
					if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, true);
					button_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			if (local) {
				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, false);
				button_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if (detaching && button_transition) button_transition.end();
			mounted = false;
			dispose();
		}
	};
}

// (206:4) {#if showControls}
function create_if_block$5(ctx) {
	let t0;
	let div3;
	let button0;
	let img0;
	let img0_src_value;
	let t1;
	let div1;
	let div0;
	let t2;
	let div2;
	let p;

	let t3_value = colonTime(/*draggingSeekBar*/ ctx[12]
	? /*time_tmp*/ ctx[15]
	: /*progress*/ ctx[5] || /*fqp*/ ctx[3].prg_hold || 0) + "";

	let t3;
	let t4;
	let span;
	let t5;
	let t6_value = colonTime(/*duration*/ ctx[4] || /*playing*/ ctx[0].length) + "";
	let t6;
	let t7;
	let button1;
	let img1;
	let img1_src_value;
	let t8;
	let button2;
	let img2;
	let img2_src_value;
	let t9;
	let button3;
	let t10;
	let div3_transition;
	let current;
	let mounted;
	let dispose;
	let if_block0 = settings.userSet.developerMode && create_if_block_3$2(ctx);
	let if_block1 = /*showFQPicker*/ ctx[11] && create_if_block_1$3(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t0 = space();
			div3 = element("div");
			button0 = element("button");
			img0 = element("img");
			t1 = space();
			div1 = element("div");
			div0 = element("div");
			t2 = space();
			div2 = element("div");
			p = element("p");
			t3 = text(t3_value);
			t4 = space();
			span = element("span");
			t5 = text("/ ");
			t6 = text(t6_value);
			t7 = space();
			button1 = element("button");
			img1 = element("img");
			t8 = space();
			button2 = element("button");
			img2 = element("img");
			t9 = space();
			button3 = element("button");
			button3.innerHTML = `<img src="/assets/icons/player/options.svg" alt="More options"/>`;
			t10 = space();
			if (if_block1) if_block1.c();

			if (!src_url_equal(img0.src, img0_src_value = /*isPaused*/ ctx[6]
			? "/assets/icons/player/play.svg"
			: "/assets/icons/player/pause.svg")) attr(img0, "src", img0_src_value);

			attr(img0, "alt", "Play/pause content");
			attr(div0, "class", "progress");

			set_style(div0, "width", `${((/*draggingSeekBar*/ ctx[12]
			? /*time_tmp*/ ctx[15]
			: /*progress*/ ctx[5] || 0) / /*duration*/ ctx[4] || -1) * 100}%`);

			attr(div1, "class", "seekbar");
			attr(div2, "class", "timeDenotation");

			if (!src_url_equal(img1.src, img1_src_value = /*$playerVolume*/ ctx[18]
			? "/assets/icons/player/volume.svg"
			: "/assets/icons/player/muted.svg")) attr(img1, "src", img1_src_value);

			attr(img1, "alt", "Volume");

			if (!src_url_equal(img2.src, img2_src_value = /*inFullscreen*/ ctx[16]
			? "/assets/icons/player/fullscreenExit.svg"
			: "/assets/icons/player/fullscreen.svg")) attr(img2, "src", img2_src_value);

			attr(img2, "alt", "Toggle fullscreen");
			attr(div3, "class", "controls");
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t0, anchor);
			insert(target, div3, anchor);
			append(div3, button0);
			append(button0, img0);
			append(div3, t1);
			append(div3, div1);
			append(div1, div0);
			/*div1_binding*/ ctx[36](div1);
			append(div3, t2);
			append(div3, div2);
			append(div2, p);
			append(p, t3);
			append(p, t4);
			append(p, span);
			append(span, t5);
			append(span, t6);
			append(div3, t7);
			append(div3, button1);
			append(button1, img1);
			append(div3, t8);
			append(div3, button2);
			append(button2, img2);
			append(div3, t9);
			append(div3, button3);
			append(div3, t10);
			if (if_block1) if_block1.m(div3, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler_4*/ ctx[35]),
					listen(div1, "mousedown", /*startSeeking*/ ctx[21]),
					listen(button1, "click", /*click_handler_5*/ ctx[37]),
					listen(button2, "click", /*click_handler_6*/ ctx[38]),
					listen(button3, "click", /*click_handler_7*/ ctx[39]),
					listen(div3, "mousemove", /*seekUpdate*/ ctx[19]),
					listen(div3, "mouseup", /*stopSeeking*/ ctx[22]),
					listen(div3, "mouseleave", /*stopSeeking*/ ctx[22])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (settings.userSet.developerMode) if_block0.p(ctx, dirty);

			if (!current || dirty[0] & /*isPaused*/ 64 && !src_url_equal(img0.src, img0_src_value = /*isPaused*/ ctx[6]
			? "/assets/icons/player/play.svg"
			: "/assets/icons/player/pause.svg")) {
				attr(img0, "src", img0_src_value);
			}

			if (dirty[0] & /*draggingSeekBar, time_tmp, progress, duration*/ 36912) {
				set_style(div0, "width", `${((/*draggingSeekBar*/ ctx[12]
				? /*time_tmp*/ ctx[15]
				: /*progress*/ ctx[5] || 0) / /*duration*/ ctx[4] || -1) * 100}%`);
			}

			if ((!current || dirty[0] & /*draggingSeekBar, time_tmp, progress, fqp*/ 36904) && t3_value !== (t3_value = colonTime(/*draggingSeekBar*/ ctx[12]
			? /*time_tmp*/ ctx[15]
			: /*progress*/ ctx[5] || /*fqp*/ ctx[3].prg_hold || 0) + "")) set_data(t3, t3_value);

			if ((!current || dirty[0] & /*duration, playing*/ 17) && t6_value !== (t6_value = colonTime(/*duration*/ ctx[4] || /*playing*/ ctx[0].length) + "")) set_data(t6, t6_value);

			if (!current || dirty[0] & /*$playerVolume*/ 262144 && !src_url_equal(img1.src, img1_src_value = /*$playerVolume*/ ctx[18]
			? "/assets/icons/player/volume.svg"
			: "/assets/icons/player/muted.svg")) {
				attr(img1, "src", img1_src_value);
			}

			if (!current || dirty[0] & /*inFullscreen*/ 65536 && !src_url_equal(img2.src, img2_src_value = /*inFullscreen*/ ctx[16]
			? "/assets/icons/player/fullscreenExit.svg"
			: "/assets/icons/player/fullscreen.svg")) {
				attr(img2, "src", img2_src_value);
			}

			if (/*showFQPicker*/ ctx[11]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*showFQPicker*/ 2048) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_1$3(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div3, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block1);

			if (local) {
				add_render_callback(() => {
					if (!current) return;
					if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, { duration: 200 }, true);
					div3_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			transition_out(if_block1);

			if (local) {
				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, { duration: 200 }, false);
				div3_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t0);
			if (detaching) detach(div3);
			/*div1_binding*/ ctx[36](null);
			if (if_block1) if_block1.d();
			if (detaching && div3_transition) div3_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

// (207:8) {#if settings.userSet.developerMode}
function create_if_block_3$2(ctx) {
	let p;
	let t;

	return {
		c() {
			p = element("p");
			t = text(/*progress*/ ctx[5]);
			attr(p, "class", "monospaceText");
			set_style(p, "position", "absolute");
			set_style(p, "width", "100%");
			set_style(p, "text-align", "center");
			set_style(p, "left", "0px");
			set_style(p, "top", "0px");
			set_style(p, "opacity", "0.5");
			set_style(p, "text-shadow", "white 0px 0px 10px");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*progress*/ 32) set_data(t, /*progress*/ ctx[5]);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (257:12) {#if showFQPicker}
function create_if_block_1$3(ctx) {
	let div2;
	let div0;
	let p0;
	let t1;
	let select0;
	let t2;
	let div1;
	let p1;
	let t4;
	let select1;
	let t5;
	let div2_transition;
	let current;
	let mounted;
	let dispose;
	let each_value_1 = Object.keys(/*playing*/ ctx[0].formats);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	let each_value = Object.keys(/*playing*/ ctx[0].formats[/*format*/ ctx[1]]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	let if_block = settings.userSet.developerMode && create_if_block_2$3(ctx);

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			p0 = element("p");
			p0.textContent = "Format";
			t1 = space();
			select0 = element("select");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t2 = space();
			div1 = element("div");
			p1 = element("p");
			p1.textContent = "Quality";
			t4 = space();
			select1 = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t5 = space();
			if (if_block) if_block.c();
			if (/*fqp*/ ctx[3].format === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[40].call(select0));
			if (/*fqp*/ ctx[3].quality === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[41].call(select1));
			attr(div2, "class", "fqpicker");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, p0);
			append(div0, t1);
			append(div0, select0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				if (each_blocks_1[i]) {
					each_blocks_1[i].m(select0, null);
				}
			}

			select_option(select0, /*fqp*/ ctx[3].format, true);
			append(div2, t2);
			append(div2, div1);
			append(div1, p1);
			append(div1, t4);
			append(div1, select1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(select1, null);
				}
			}

			select_option(select1, /*fqp*/ ctx[3].quality, true);
			append(div2, t5);
			if (if_block) if_block.m(div2, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(select0, "change", /*select0_change_handler*/ ctx[40]),
					listen(select1, "change", /*select1_change_handler*/ ctx[41])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*playing*/ 1) {
				each_value_1 = Object.keys(/*playing*/ ctx[0].formats);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(select0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty[0] & /*fqp, playing*/ 9) {
				select_option(select0, /*fqp*/ ctx[3].format);
			}

			if (dirty[0] & /*playing, format*/ 3) {
				each_value = Object.keys(/*playing*/ ctx[0].formats[/*format*/ ctx[1]]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty[0] & /*fqp, playing*/ 9) {
				select_option(select1, /*fqp*/ ctx[3].quality);
			}

			if (settings.userSet.developerMode) if_block.p(ctx, dirty);
		},
		i(local) {
			if (current) return;

			if (local) {
				add_render_callback(() => {
					if (!current) return;
					if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 200 }, true);
					div2_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			if (local) {
				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 200 }, false);
				div2_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div2);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			if (if_block) if_block.d();
			if (detaching && div2_transition) div2_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

// (262:28) {#each Object.keys(playing.formats) as fmt}
function create_each_block_1$1(ctx) {
	let option;
	let t_value = /*fmt*/ ctx[55] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*fmt*/ ctx[55];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*playing*/ 1 && t_value !== (t_value = /*fmt*/ ctx[55] + "")) set_data(t, t_value);

			if (dirty[0] & /*playing*/ 1 && option_value_value !== (option_value_value = /*fmt*/ ctx[55])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (270:28) {#each Object.keys(playing.formats[format]) as qual}
function create_each_block$1(ctx) {
	let option;
	let t_value = /*qual*/ ctx[52] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*qual*/ ctx[52];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*playing, format*/ 3 && t_value !== (t_value = /*qual*/ ctx[52] + "")) set_data(t, t_value);

			if (dirty[0] & /*playing, format*/ 3 && option_value_value !== (option_value_value = /*qual*/ ctx[52])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (275:20) {#if settings.userSet.developerMode}
function create_if_block_2$3(ctx) {
	let div;
	let p;
	let t0;
	let span;
	let t1_value = /*playing*/ ctx[0].formats[/*format*/ ctx[1]][/*quality*/ ctx[2]] + "";
	let t1;

	return {
		c() {
			div = element("div");
			p = element("p");
			t0 = text("Serving ");
			span = element("span");
			t1 = text(t1_value);
			attr(span, "class", "monospaceText");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, p);
			append(p, t0);
			append(p, span);
			append(span, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*playing, format, quality*/ 7 && t1_value !== (t1_value = /*playing*/ ctx[0].formats[/*format*/ ctx[1]][/*quality*/ ctx[2]] + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function create_fragment$5(ctx) {
	let t0;
	let div1;
	let div0;
	let t2;
	let previous_key = /*$cfg*/ ctx[17].host + /*playing*/ ctx[0].formats[/*format*/ ctx[1]][/*quality*/ ctx[2]];
	let t3;
	let t4;
	let show_if = isEpisode(/*playing*/ ctx[0]) && settings.userSet.skipbutton;
	let t5;
	let mounted;
	let dispose;
	let key_block = create_key_block$3(ctx);
	let if_block0 = /*videoReadyState*/ ctx[10] < 2 && create_if_block_7(ctx);
	let if_block1 = show_if && create_if_block_4$2(ctx);
	let if_block2 = /*showControls*/ ctx[13] && create_if_block$5(ctx);

	return {
		c() {
			t0 = space();
			div1 = element("div");
			div0 = element("div");
			div0.innerHTML = `<h1>webtv</h1>`;
			t2 = space();
			key_block.c();
			t3 = space();
			if (if_block0) if_block0.c();
			t4 = space();
			if (if_block1) if_block1.c();
			t5 = space();
			if (if_block2) if_block2.c();
			attr(div0, "class", "vbking");
			attr(div1, "class", "videoPlayer");
			set_style(div1, "aspect-ratio", /*playing*/ ctx[0].aspectRatio || "16 / 9");

			set_style(div1, "max-height", settings.userSet.theatre
			? settings.userSet.theatreFill
			: "");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t2);
			key_block.m(div1, null);
			append(div1, t3);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t4);
			if (if_block1) if_block1.m(div1, null);
			append(div1, t5);
			if (if_block2) if_block2.m(div1, null);
			/*div1_binding_1*/ ctx[42](div1);

			if (!mounted) {
				dispose = [
					listen(document_1, "keydown", /*handleKeypress*/ ctx[23]),
					listen(div1, "mousemove", /*handleActivity*/ ctx[20]),
					listen(div1, "mouseleave", /*mouseleave_handler*/ ctx[43]),
					listen(div1, "fullscreenchange", /*fullscreenchange_handler*/ ctx[44])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$cfg, playing, format, quality*/ 131079 && safe_not_equal(previous_key, previous_key = /*$cfg*/ ctx[17].host + /*playing*/ ctx[0].formats[/*format*/ ctx[1]][/*quality*/ ctx[2]])) {
				key_block.d(1);
				key_block = create_key_block$3(ctx);
				key_block.c();
				key_block.m(div1, t3);
			} else {
				key_block.p(ctx, dirty);
			}

			if (/*videoReadyState*/ ctx[10] < 2) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*videoReadyState*/ 1024) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_7(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div1, t4);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (dirty[0] & /*playing*/ 1) show_if = isEpisode(/*playing*/ ctx[0]) && settings.userSet.skipbutton;

			if (show_if) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_4$2(ctx);
					if_block1.c();
					if_block1.m(div1, t5);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*showControls*/ ctx[13]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty[0] & /*showControls*/ 8192) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$5(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div1, null);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (dirty[0] & /*playing*/ 1) {
				set_style(div1, "aspect-ratio", /*playing*/ ctx[0].aspectRatio || "16 / 9");
			}
		},
		i(local) {
			transition_in(if_block0);
			transition_in(if_block2);
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block2);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(div1);
			key_block.d(detaching);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			/*div1_binding_1*/ ctx[42](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let $watchPage_season;
	let $watchPage_episode;
	let $playerTemp_autoplayNext;
	let $cfg;
	let $playerVolume;
	component_subscribe($$self, watchPage_season, $$value => $$invalidate(47, $watchPage_season = $$value));
	component_subscribe($$self, watchPage_episode, $$value => $$invalidate(48, $watchPage_episode = $$value));
	component_subscribe($$self, playerTemp_autoplayNext, $$value => $$invalidate(49, $playerTemp_autoplayNext = $$value));
	component_subscribe($$self, cfg, $$value => $$invalidate(17, $cfg = $$value));
	component_subscribe($$self, playerVolume, $$value => $$invalidate(18, $playerVolume = $$value));
	let { playing } = $$props;
	let format = getBestFormat(playing, settings.userSet.videoFormat);
	let quality = settings.userSet.videoQuality;

	let fqp = {
		format,
		quality,
		prg_hold: undefined,
		WFL: false,
		readyPip: false
	};

	let duration;
	let progress;
	let isPaused = true;
	let __PTAN = $playerTemp_autoplayNext;
	set_store_value(playerTemp_autoplayNext, $playerTemp_autoplayNext = false, $playerTemp_autoplayNext);
	let VPE;
	let vplayer;
	let seekbar;
	let videoReadyState;
	let showFQPicker = false;
	let draggingSeekBar = false;
	let showControls = false;
	let sCTimeout;
	let time_tmp;
	let old_state = true;
	let inFullscreen = false;
	let nextEpisode = isEpisode(playing) && getEpisodeAfter(playing);

	function seekUpdate(e) {
		if (!duration || !draggingSeekBar) return;
		let rect = seekbar.getBoundingClientRect();
		let ler = (e.clientX - rect.left) / rect.width;
		$$invalidate(15, time_tmp = duration * Math.min(Math.max(ler, 0), 1));
	}

	function handleActivity() {
		$$invalidate(13, showControls = true);
		if (sCTimeout) clearTimeout(sCTimeout);

		$$invalidate(14, sCTimeout = setTimeout(
			() => {
				$$invalidate(13, showControls = false);
				$$invalidate(11, showFQPicker = false);
			},
			2500
		));
	}

	function startSeeking(e) {
		$$invalidate(12, draggingSeekBar = true);
		old_state = isPaused;
		$$invalidate(6, isPaused = true);
		$$invalidate(15, time_tmp = progress);
		seekUpdate(e);
	}

	function stopSeeking() {
		if (!draggingSeekBar) return;
		$$invalidate(12, draggingSeekBar = false);
		$$invalidate(5, progress = time_tmp);
		$$invalidate(6, isPaused = old_state);
		old_state = false;
	}

	function handleKeypress(e) {
		switch (e.code) {
			case "Space":
				$$invalidate(6, isPaused = !isPaused);
				handleActivity();
				e.preventDefault();
				break;
			case "ArrowRight":
				$$invalidate(5, progress = Math.min(Math.max(progress + parseFloat(settings.userSet.keyboardSeek), 0), duration));
				break;
			case "ArrowLeft":
				$$invalidate(5, progress = Math.min(Math.max(progress - parseFloat(settings.userSet.keyboardSeek), 0), duration));
				break;
			case "KeyF":
				if (document.fullscreenElement != vplayer) vplayer.requestFullscreen(); else document.exitFullscreen();
				break;
		}
	}

	// workaround for what i assume to be a bug
	function updateProgress(prog) {
		$$invalidate(5, progress = prog);
	}

	// this is nightmarish please help
	function loadHandler() {
		// autoplay
		if (__PTAN) {
			$$invalidate(3, fqp.prg_hold = 0, fqp);
			$$invalidate(3, fqp.WFL = false, fqp);
			__PTAN = false;
		}

		if (fqp.prg_hold != undefined && videoReadyState > 0) {
			$$invalidate(5, progress = fqp.prg_hold);
			$$invalidate(6, isPaused = fqp.WFL);
			$$invalidate(3, fqp.readyPip = false, fqp);
			delete fqp.prg_hold;
			VPE.play();
		}
	}

	function video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler() {
		videoReadyState = this.readyState;
		((((($$invalidate(10, videoReadyState), $$invalidate(3, fqp)), $$invalidate(2, quality)), $$invalidate(1, format)), $$invalidate(5, progress)), $$invalidate(6, isPaused));
	}

	function video_play_pause_handler() {
		isPaused = this.paused;
		(((($$invalidate(6, isPaused), $$invalidate(3, fqp)), $$invalidate(2, quality)), $$invalidate(1, format)), $$invalidate(5, progress));
	}

	function video_timeupdate_handler() {
		progress = this.currentTime;
		$$invalidate(5, progress);
	}

	function video_durationchange_handler() {
		duration = this.duration;
		$$invalidate(4, duration);
	}

	function video_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			VPE = $$value;
			$$invalidate(7, VPE);
		});
	}

	function video_volumechange_handler() {
		$playerVolume = this.volume;
		playerVolume.set($playerVolume);
	}

	const click_handler = () => {
		$$invalidate(6, isPaused = !isPaused);
		$$invalidate(11, showFQPicker = false);
	};

	const click_handler_1 = () => $$invalidate(6, isPaused = !isPaused);

	const click_handler_2 = () => $$invalidate(5, progress = (isEpisode(playing) && playing.intro
	? playing.intro
	: [0, 0])[1]);

	const click_handler_3 = () => $$invalidate(5, progress = (isEpisode(playing) && playing.outro ? playing.outro : [])[1] || duration);
	const click_handler_4 = () => $$invalidate(6, isPaused = !isPaused);

	function div1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			seekbar = $$value;
			$$invalidate(9, seekbar);
		});
	}

	const click_handler_5 = () => {
		if ($playerVolume > 0) set_store_value(playerVolume, $playerVolume = 0, $playerVolume); else set_store_value(playerVolume, $playerVolume = 1, $playerVolume);
	};

	const click_handler_6 = () => {
		if (document.fullscreenElement != vplayer) vplayer.requestFullscreen(); else document.exitFullscreen();
	};

	const click_handler_7 = () => $$invalidate(11, showFQPicker = !showFQPicker);

	function select0_change_handler() {
		fqp.format = select_value(this);
		(((($$invalidate(3, fqp), $$invalidate(2, quality)), $$invalidate(1, format)), $$invalidate(5, progress)), $$invalidate(6, isPaused));
		$$invalidate(0, playing);
	}

	function select1_change_handler() {
		fqp.quality = select_value(this);
		(((($$invalidate(3, fqp), $$invalidate(2, quality)), $$invalidate(1, format)), $$invalidate(5, progress)), $$invalidate(6, isPaused));
		$$invalidate(0, playing);
	}

	function div1_binding_1($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			vplayer = $$value;
			$$invalidate(8, vplayer);
		});
	}

	const mouseleave_handler = () => {
		$$invalidate(13, showControls = false);
		$$invalidate(11, showFQPicker = false);
		if (sCTimeout) clearTimeout(sCTimeout);
	};

	const fullscreenchange_handler = () => $$invalidate(16, inFullscreen = document.fullscreenElement == vplayer);

	$$self.$$set = $$props => {
		if ('playing' in $$props) $$invalidate(0, playing = $$props.playing);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*playing, progress, duration*/ 49) {
			// this is probably horrible for performance. Too bad!
			// if anyone knows how to make this better pls lmk
			if (isEpisode(playing) && (settings.userSet.autoskipintro || settings.userSet.autoskipoutro)) {
				if (playing.intro && progress > playing.intro[0] && progress < playing.intro[1] && settings.userSet.autoskipintro) updateProgress(playing.intro[1]); else if (playing.outro && progress > playing.outro[0] && progress < (playing.outro[1] || duration) && settings.userSet.autoskipoutro) updateProgress(playing.outro[1] || duration); // doesn't work if i don't pause and unpause soo
			}
		}

		if ($$self.$$.dirty[0] & /*fqp, quality, format, progress, isPaused*/ 110) {
			if (fqp.quality != quality || fqp.format != format) {
				if (fqp.prg_hold == undefined) {
					$$invalidate(3, fqp.prg_hold = progress, fqp);
					$$invalidate(3, fqp.WFL = isPaused, fqp);
				}

				$$invalidate(6, isPaused = true);
				$$invalidate(2, quality = fqp.quality);
				$$invalidate(1, format = fqp.format);
				$$invalidate(10, videoReadyState = 0); // assume the worst (pls work)
			}
		}

		if ($$self.$$.dirty[0] & /*duration, progress, VPE*/ 176) {
			if (duration && progress == duration && settings.userSet.autoplay && nextEpisode && !VPE.loop) {
				set_store_value(playerTemp_autoplayNext, $playerTemp_autoplayNext = true, $playerTemp_autoplayNext);
				set_store_value(watchPage_episode, $watchPage_episode = nextEpisode.id, $watchPage_episode);
				set_store_value(watchPage_season, $watchPage_season = nextEpisode.parent, $watchPage_season);
			}
		}
	};

	return [
		playing,
		format,
		quality,
		fqp,
		duration,
		progress,
		isPaused,
		VPE,
		vplayer,
		seekbar,
		videoReadyState,
		showFQPicker,
		draggingSeekBar,
		showControls,
		sCTimeout,
		time_tmp,
		inFullscreen,
		$cfg,
		$playerVolume,
		seekUpdate,
		handleActivity,
		startSeeking,
		stopSeeking,
		handleKeypress,
		loadHandler,
		video_loadedmetadata_loadeddata_canplay_canplaythrough_playing_waiting_emptied_handler,
		video_play_pause_handler,
		video_timeupdate_handler,
		video_durationchange_handler,
		video_binding,
		video_volumechange_handler,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4,
		div1_binding,
		click_handler_5,
		click_handler_6,
		click_handler_7,
		select0_change_handler,
		select1_change_handler,
		div1_binding_1,
		mouseleave_handler,
		fullscreenchange_handler
	];
}

class VideoPlayer extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { playing: 0 }, null, [-1, -1]);
	}
}

/* src/svelte/elm/VideoView.svelte generated by Svelte v3.59.1 */

function create_if_block_2$2(ctx) {
	let div;
	let h2;
	let t1;
	let p;
	let t2_value = /*targetVideo*/ ctx[0].notes + "";
	let t2;

	return {
		c() {
			div = element("div");
			h2 = element("h2");
			h2.textContent = "Notes";
			t1 = space();
			p = element("p");
			t2 = text(t2_value);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h2);
			append(div, t1);
			append(div, p);
			append(p, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*targetVideo*/ 1 && t2_value !== (t2_value = /*targetVideo*/ ctx[0].notes + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (56:16) {#if settings.userSet.developerMode}
function create_if_block_1$2(ctx) {
	let div;
	let h2;
	let t1;
	let p;
	let t2_value = JSON.stringify(/*targetVideo*/ ctx[0], null, 3) + "";
	let t2;

	return {
		c() {
			div = element("div");
			h2 = element("h2");
			h2.textContent = "Video";
			t1 = space();
			p = element("p");
			t2 = text(t2_value);
			attr(p, "class", "monospaceText");
			set_style(p, "white-space", `pre-wrap`);
			set_style(p, "overflow-x", `auto`);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h2);
			append(div, t1);
			append(div, p);
			append(p, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*targetVideo*/ 1 && t2_value !== (t2_value = JSON.stringify(/*targetVideo*/ ctx[0], null, 3) + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (65:16) {#if isEpisode(targetVideo) && getEpisodeAfter(targetVideo)}
function create_if_block$4(ctx) {
	let nextepdisplay;
	let current;

	nextepdisplay = new NextEpDisplay({
			props: {
				target: getEpisodeAfter(/*targetVideo*/ ctx[0]) || /*targetVideo*/ ctx[0]
			}
		});

	return {
		c() {
			create_component(nextepdisplay.$$.fragment);
		},
		m(target, anchor) {
			mount_component(nextepdisplay, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const nextepdisplay_changes = {};
			if (dirty & /*targetVideo*/ 1) nextepdisplay_changes.target = getEpisodeAfter(/*targetVideo*/ ctx[0]) || /*targetVideo*/ ctx[0];
			nextepdisplay.$set(nextepdisplay_changes);
		},
		i(local) {
			if (current) return;
			transition_in(nextepdisplay.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(nextepdisplay.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(nextepdisplay, detaching);
		}
	};
}

function create_fragment$4(ctx) {
	let div7;
	let div6;
	let videoplayer;
	let t0;
	let div1;
	let img;
	let img_src_value;
	let img_alt_value;
	let t1;
	let div0;
	let h1;
	let t2_value = /*targetVideo*/ ctx[0].name + "";
	let t2;
	let t3;
	let p0;

	let t4_value = (/*mtdt*/ ctx[2].type != "UNKNOWN" && (/*mtdt*/ ctx[2].type == "movie"
	? `Runtime ${letteredTime(/*targetVideo*/ ctx[0].length)}`
	: `${isEpisode(/*targetVideo*/ ctx[0])
		? getEpisodeLabel(/*targetVideo*/ ctx[0])
		: "❔"} — ${/*mtdt*/ ctx[2].show.name}`)) + "";

	let t4;
	let t5;
	let div5;
	let div3;
	let div2;
	let h2;
	let t7;
	let p1;
	let t8_value = (/*targetVideo*/ ctx[0].description || "No description specified") + "";
	let t8;
	let t9;
	let show_if_1 = isMovie(/*targetVideo*/ ctx[0]) && /*targetVideo*/ ctx[0].notes;
	let t10;
	let t11;
	let div4;
	let show_if = isEpisode(/*targetVideo*/ ctx[0]) && getEpisodeAfter(/*targetVideo*/ ctx[0]);
	let t12;
	let formatdownloader;
	let current;
	let mounted;
	let dispose;

	videoplayer = new VideoPlayer({
			props: { playing: /*targetVideo*/ ctx[0] }
		});

	let if_block0 = show_if_1 && create_if_block_2$2(ctx);
	let if_block1 = settings.userSet.developerMode && create_if_block_1$2(ctx);
	let if_block2 = show_if && create_if_block$4(ctx);

	formatdownloader = new FormatDownloader({
			props: { target: /*targetVideo*/ ctx[0] }
		});

	return {
		c() {
			div7 = element("div");
			div6 = element("div");
			create_component(videoplayer.$$.fragment);
			t0 = space();
			div1 = element("div");
			img = element("img");
			t1 = space();
			div0 = element("div");
			h1 = element("h1");
			t2 = text(t2_value);
			t3 = space();
			p0 = element("p");
			t4 = text(t4_value);
			t5 = space();
			div5 = element("div");
			div3 = element("div");
			div2 = element("div");
			h2 = element("h2");
			h2.textContent = "Description";
			t7 = space();
			p1 = element("p");
			t8 = text(t8_value);
			t9 = space();
			if (if_block0) if_block0.c();
			t10 = space();
			if (if_block1) if_block1.c();
			t11 = space();
			div4 = element("div");
			if (if_block2) if_block2.c();
			t12 = space();
			create_component(formatdownloader.$$.fragment);
			if (!src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[1].host + /*mtdt*/ ctx[2].icon)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = /*targetVideo*/ ctx[0].name + " icon");
			attr(div0, "class", "txt");
			attr(div1, "class", "shortAbout");
			attr(div3, "class", "longAbout");
			attr(div4, "class", "opts");
			attr(div5, "class", "btm_ctn");
			attr(div6, "class", "container");
			attr(div7, "class", "videoView");
			attr(div7, "data-theatremode", settings.userSet.theatre ? "enabled" : "");
		},
		m(target, anchor) {
			insert(target, div7, anchor);
			append(div7, div6);
			mount_component(videoplayer, div6, null);
			append(div6, t0);
			append(div6, div1);
			append(div1, img);
			append(div1, t1);
			append(div1, div0);
			append(div0, h1);
			append(h1, t2);
			append(div0, t3);
			append(div0, p0);
			append(p0, t4);
			append(div6, t5);
			append(div6, div5);
			append(div5, div3);
			append(div3, div2);
			append(div2, h2);
			append(div2, t7);
			append(div2, p1);
			append(p1, t8);
			append(div3, t9);
			if (if_block0) if_block0.m(div3, null);
			append(div3, t10);
			if (if_block1) if_block1.m(div3, null);
			append(div5, t11);
			append(div5, div4);
			if (if_block2) if_block2.m(div4, null);
			append(div4, t12);
			mount_component(formatdownloader, div4, null);
			current = true;

			if (!mounted) {
				dispose = listen(img, "load", load_handler$1);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const videoplayer_changes = {};
			if (dirty & /*targetVideo*/ 1) videoplayer_changes.playing = /*targetVideo*/ ctx[0];
			videoplayer.$set(videoplayer_changes);

			if (!current || dirty & /*$cfg*/ 2 && !src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[1].host + /*mtdt*/ ctx[2].icon)) {
				attr(img, "src", img_src_value);
			}

			if (!current || dirty & /*targetVideo*/ 1 && img_alt_value !== (img_alt_value = /*targetVideo*/ ctx[0].name + " icon")) {
				attr(img, "alt", img_alt_value);
			}

			if ((!current || dirty & /*targetVideo*/ 1) && t2_value !== (t2_value = /*targetVideo*/ ctx[0].name + "")) set_data(t2, t2_value);

			if ((!current || dirty & /*targetVideo*/ 1) && t4_value !== (t4_value = (/*mtdt*/ ctx[2].type != "UNKNOWN" && (/*mtdt*/ ctx[2].type == "movie"
			? `Runtime ${letteredTime(/*targetVideo*/ ctx[0].length)}`
			: `${isEpisode(/*targetVideo*/ ctx[0])
				? getEpisodeLabel(/*targetVideo*/ ctx[0])
				: "❔"} — ${/*mtdt*/ ctx[2].show.name}`)) + "")) set_data(t4, t4_value);

			if ((!current || dirty & /*targetVideo*/ 1) && t8_value !== (t8_value = (/*targetVideo*/ ctx[0].description || "No description specified") + "")) set_data(t8, t8_value);
			if (dirty & /*targetVideo*/ 1) show_if_1 = isMovie(/*targetVideo*/ ctx[0]) && /*targetVideo*/ ctx[0].notes;

			if (show_if_1) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2$2(ctx);
					if_block0.c();
					if_block0.m(div3, t10);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (settings.userSet.developerMode) if_block1.p(ctx, dirty);
			if (dirty & /*targetVideo*/ 1) show_if = isEpisode(/*targetVideo*/ ctx[0]) && getEpisodeAfter(/*targetVideo*/ ctx[0]);

			if (show_if) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty & /*targetVideo*/ 1) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$4(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div4, t12);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			const formatdownloader_changes = {};
			if (dirty & /*targetVideo*/ 1) formatdownloader_changes.target = /*targetVideo*/ ctx[0];
			formatdownloader.$set(formatdownloader_changes);
		},
		i(local) {
			if (current) return;
			transition_in(videoplayer.$$.fragment, local);
			transition_in(if_block2);
			transition_in(formatdownloader.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(videoplayer.$$.fragment, local);
			transition_out(if_block2);
			transition_out(formatdownloader.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div7);
			destroy_component(videoplayer);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			destroy_component(formatdownloader);
			mounted = false;
			dispose();
		}
	};
}

const load_handler$1 = e => {
	e.currentTarget.setAttribute("data-loaded", "");
};

function instance$4($$self, $$props, $$invalidate) {
	let $cfg;
	component_subscribe($$self, cfg, $$value => $$invalidate(1, $cfg = $$value));
	let { targetVideo } = $$props;

	// This is a mess. too bad!
	let mtdt = (isEpisode(targetVideo)
	? (() => {
			let season = IDIndex.get(targetVideo.parent);
			if (!season || !isSeason(season)) return undefined;
			let show = IDIndex.get(season.parent);
			if (!show || !isShow(show)) return undefined;

			return {
				type: "episode",
				icon: show.icon,
				season,
				show,
				season_number: show.seasons.indexOf(season) + 1,
				episode_number: season.episodes.indexOf(targetVideo) + 1
			};
		})()
	: isMovie(targetVideo) && { type: "movie", icon: targetVideo.icon }) || { type: "UNKNOWN", icon: "" };

	$$self.$$set = $$props => {
		if ('targetVideo' in $$props) $$invalidate(0, targetVideo = $$props.targetVideo);
	};

	return [targetVideo, $cfg, mtdt];
}

class VideoView extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { targetVideo: 0 });
	}
}

/* src/svelte/screens/ScreenMovies.svelte generated by Svelte v3.59.1 */

function create_else_block$1(ctx) {
	let div;

	return {
		c() {
			div = element("div");

			div.innerHTML = `<h1>webtv <em>movies</em> 
                    <span><br/>what would you like to watch?</span></h1>`;

			attr(div, "class", "nothingSelected");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (36:8) {#if selectedMovie && selectedId}
function create_if_block$3(ctx) {
	let previous_key = /*selectedMovie*/ ctx[1];
	let key_block_anchor;
	let current;
	let key_block = create_key_block$2(ctx);

	return {
		c() {
			key_block.c();
			key_block_anchor = empty();
		},
		m(target, anchor) {
			key_block.m(target, anchor);
			insert(target, key_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*selectedMovie*/ 2 && safe_not_equal(previous_key, previous_key = /*selectedMovie*/ ctx[1])) {
				group_outros();
				transition_out(key_block, 1, 1, noop);
				check_outros();
				key_block = create_key_block$2(ctx);
				key_block.c();
				transition_in(key_block, 1);
				key_block.m(key_block_anchor.parentNode, key_block_anchor);
			} else {
				key_block.p(ctx, dirty);
			}
		},
		i(local) {
			if (current) return;
			transition_in(key_block);
			current = true;
		},
		o(local) {
			transition_out(key_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(key_block_anchor);
			key_block.d(detaching);
		}
	};
}

// (38:12) {#key selectedMovie}
function create_key_block$2(ctx) {
	let videoview;
	let current;

	videoview = new VideoView({
			props: { targetVideo: /*selectedMovie*/ ctx[1] }
		});

	return {
		c() {
			create_component(videoview.$$.fragment);
		},
		m(target, anchor) {
			mount_component(videoview, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const videoview_changes = {};
			if (dirty & /*selectedMovie*/ 2) videoview_changes.targetVideo = /*selectedMovie*/ ctx[1];
			videoview.$set(videoview_changes);
		},
		i(local) {
			if (current) return;
			transition_in(videoview.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(videoview.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(videoview, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let div1;
	let sidebar;
	let updating_active;
	let updating_items;
	let t;
	let div0;
	let current_block_type_index;
	let if_block;
	let current;

	function sidebar_active_binding(value) {
		/*sidebar_active_binding*/ ctx[6](value);
	}

	function sidebar_items_binding(value) {
		/*sidebar_items_binding*/ ctx[7](value);
	}

	let sidebar_props = { level: 1, width: 250 };

	if (/*selectedId*/ ctx[0] !== void 0) {
		sidebar_props.active = /*selectedId*/ ctx[0];
	}

	if (/*movieList*/ ctx[2] !== void 0) {
		sidebar_props.items = /*movieList*/ ctx[2];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding));
	binding_callbacks.push(() => bind(sidebar, 'items', sidebar_items_binding));
	const if_block_creators = [create_if_block$3, create_else_block$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*selectedMovie*/ ctx[1] && /*selectedId*/ ctx[0]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div1 = element("div");
			create_component(sidebar.$$.fragment);
			t = space();
			div0 = element("div");
			if_block.c();
			attr(div0, "class", "content");
			attr(div1, "class", "screen");
			attr(div1, "id", "screenShow");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(sidebar, div1, null);
			append(div1, t);
			append(div1, div0);
			if_blocks[current_block_type_index].m(div0, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const sidebar_changes = {};

			if (!updating_active && dirty & /*selectedId*/ 1) {
				updating_active = true;
				sidebar_changes.active = /*selectedId*/ ctx[0];
				add_flush_callback(() => updating_active = false);
			}

			if (!updating_items && dirty & /*movieList*/ 4) {
				updating_items = true;
				sidebar_changes.items = /*movieList*/ ctx[2];
				add_flush_callback(() => updating_items = false);
			}

			sidebar.$set(sidebar_changes);
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(div0, null);
			}
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(sidebar);
			if_blocks[current_block_type_index].d();
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let $movies;
	let $ready;
	let $cfg;
	component_subscribe($$self, movies, $$value => $$invalidate(3, $movies = $$value));
	component_subscribe($$self, ready, $$value => $$invalidate(4, $ready = $$value));
	component_subscribe($$self, cfg, $$value => $$invalidate(5, $cfg = $$value));
	let selectedId;
	let selectedMovie;
	let movieList = [];

	function sidebar_active_binding(value) {
		selectedId = value;
		$$invalidate(0, selectedId);
	}

	function sidebar_items_binding(value) {
		movieList = value;
		((($$invalidate(2, movieList), $$invalidate(4, $ready)), $$invalidate(3, $movies)), $$invalidate(5, $cfg));
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$ready, $movies, $cfg*/ 56) {
			{
				if ($ready) {
					$$invalidate(2, movieList = $movies.map((v, x) => {
						return {
							text: v.name,
							id: v.id,
							icon: {
								type: "image",
								circular: true,
								content: $cfg.host + v.icon
							}
						};
					}));
				}
			}
		}

		if ($$self.$$.dirty & /*$ready, selectedId, $movies*/ 25) {
			{
				if ($ready && selectedId) {
					$$invalidate(1, selectedMovie = $movies.find(e => e.id == selectedId));
				} else {
					$$invalidate(1, selectedMovie = undefined);
				}
			}
		}
	};

	return [
		selectedId,
		selectedMovie,
		movieList,
		$movies,
		$ready,
		$cfg,
		sidebar_active_binding,
		sidebar_items_binding
	];
}

class ScreenMovies extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
	}
}

/* src/svelte/screens/ScreenShow.svelte generated by Svelte v3.59.1 */

function create_if_block_5(ctx) {
	let sidebar;
	let updating_active;
	let updating_items;
	let current;

	function sidebar_active_binding_1(value) {
		/*sidebar_active_binding_1*/ ctx[12](value);
	}

	function sidebar_items_binding_1(value) {
		/*sidebar_items_binding_1*/ ctx[13](value);
	}

	let sidebar_props = { level: 0, width: 275 };

	if (/*$watchPage_episode*/ ctx[1] !== void 0) {
		sidebar_props.active = /*$watchPage_episode*/ ctx[1];
	}

	if (/*episodeList*/ ctx[5] !== void 0) {
		sidebar_props.items = /*episodeList*/ ctx[5];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding_1));
	binding_callbacks.push(() => bind(sidebar, 'items', sidebar_items_binding_1));

	return {
		c() {
			create_component(sidebar.$$.fragment);
		},
		m(target, anchor) {
			mount_component(sidebar, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const sidebar_changes = {};

			if (!updating_active && dirty & /*$watchPage_episode*/ 2) {
				updating_active = true;
				sidebar_changes.active = /*$watchPage_episode*/ ctx[1];
				add_flush_callback(() => updating_active = false);
			}

			if (!updating_items && dirty & /*episodeList*/ 32) {
				updating_items = true;
				sidebar_changes.items = /*episodeList*/ ctx[5];
				add_flush_callback(() => updating_items = false);
			}

			sidebar.$set(sidebar_changes);
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(sidebar, detaching);
		}
	};
}

// (138:12) {:else}
function create_else_block_1(ctx) {
	let div;
	let h1;
	let t0_value = (/*selectedSeason_obj*/ ctx[0]?.name || "[ ... ]") + "";
	let t0;
	let t1;
	let span;
	let br;
	let html_tag;

	let raw_value = (settings.userSet.developerMode
	? `sidebar: <span class="monospaceText">${/*$watchPage_season*/ ctx[2]}</span>; obj: <span class="monospaceText">${/*selectedSeason_obj*/ ctx[0]?.id}</span>`
	: "select an episode") + "";

	return {
		c() {
			div = element("div");
			h1 = element("h1");
			t0 = text(t0_value);
			t1 = space();
			span = element("span");
			br = element("br");
			html_tag = new HtmlTag(false);
			html_tag.a = null;
			attr(div, "class", "nothingSelected");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h1);
			append(h1, t0);
			append(h1, t1);
			append(h1, span);
			append(span, br);
			html_tag.m(raw_value, span);
		},
		p(ctx, dirty) {
			if (dirty & /*selectedSeason_obj*/ 1 && t0_value !== (t0_value = (/*selectedSeason_obj*/ ctx[0]?.name || "[ ... ]") + "")) set_data(t0, t0_value);

			if (dirty & /*$watchPage_season, selectedSeason_obj*/ 5 && raw_value !== (raw_value = (settings.userSet.developerMode
			? `sidebar: <span class="monospaceText">${/*$watchPage_season*/ ctx[2]}</span>; obj: <span class="monospaceText">${/*selectedSeason_obj*/ ctx[0]?.id}</span>`
			: "select an episode") + "")) html_tag.p(raw_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (115:12) {#if $watchPage_episode && selectedEpisode_obj}
function create_if_block_3$1(ctx) {
	let previous_key = /*selectedEpisode_obj*/ ctx[3];
	let key_block_anchor;
	let current;
	let key_block = create_key_block$1(ctx);

	return {
		c() {
			key_block.c();
			key_block_anchor = empty();
		},
		m(target, anchor) {
			key_block.m(target, anchor);
			insert(target, key_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*selectedEpisode_obj*/ 8 && safe_not_equal(previous_key, previous_key = /*selectedEpisode_obj*/ ctx[3])) {
				group_outros();
				transition_out(key_block, 1, 1, noop);
				check_outros();
				key_block = create_key_block$1(ctx);
				key_block.c();
				transition_in(key_block, 1);
				key_block.m(key_block_anchor.parentNode, key_block_anchor);
			} else {
				key_block.p(ctx, dirty);
			}
		},
		i(local) {
			if (current) return;
			transition_in(key_block);
			current = true;
		},
		o(local) {
			transition_out(key_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(key_block_anchor);
			key_block.d(detaching);
		}
	};
}

// (79:8) {#if $watchPage_season == "showAbout"}
function create_if_block$2(ctx) {
	let t0;
	let div5;
	let div1;
	let img;
	let img_src_value;
	let t1;
	let div0;
	let h1;
	let t3;
	let p0;
	let t4_value = /*show*/ ctx[7]?.seasons.filter(func$1).length + "";
	let t4;
	let t5;

	let t6_value = ((/*show*/ ctx[7]?.seasons?.filter(func_1).length ?? 0) >= 1
	? /*show*/ ctx[7]?.seasons?.filter(func_2).map(func_3).reduce(func_4)
	: 0) + "";

	let t6;
	let t7;
	let t8;
	let div4;
	let div2;
	let h20;
	let t10;
	let p1;
	let t12;
	let div3;
	let h21;
	let t14;
	let p2;
	let mounted;
	let dispose;
	let if_block0 = /*show*/ ctx[7]?.poster && create_if_block_2$1(ctx);
	let if_block1 = settings.userSet.developerMode && create_if_block_1$1(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t0 = space();
			div5 = element("div");
			div1 = element("div");
			img = element("img");
			t1 = space();
			div0 = element("div");
			h1 = element("h1");
			h1.textContent = `${/*show*/ ctx[7]?.name}`;
			t3 = space();
			p0 = element("p");
			if (if_block1) if_block1.c();
			t4 = text(t4_value);
			t5 = text(" season(s), ");
			t6 = text(t6_value);
			t7 = text(" episode(s)");
			t8 = space();
			div4 = element("div");
			div2 = element("div");
			h20 = element("h2");
			h20.textContent = "Description";
			t10 = space();
			p1 = element("p");
			p1.textContent = `${/*show*/ ctx[7]?.description || "No description"}`;
			t12 = space();
			div3 = element("div");
			h21 = element("h2");
			h21.textContent = "Notes";
			t14 = space();
			p2 = element("p");
			p2.textContent = `${/*show*/ ctx[7]?.notes || "No notes"}`;
			if (!src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[6].host + /*show*/ ctx[7]?.icon)) attr(img, "src", img_src_value);
			attr(img, "alt", /*show*/ ctx[7]?.name);
			attr(div0, "class", "txt");
			attr(div1, "class", "header");
			attr(div4, "class", "otherInfo");
			attr(div5, "class", "showAbout");
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t0, anchor);
			insert(target, div5, anchor);
			append(div5, div1);
			append(div1, img);
			append(div1, t1);
			append(div1, div0);
			append(div0, h1);
			append(div0, t3);
			append(div0, p0);
			if (if_block1) if_block1.m(p0, null);
			append(p0, t4);
			append(p0, t5);
			append(p0, t6);
			append(p0, t7);
			append(div5, t8);
			append(div5, div4);
			append(div4, div2);
			append(div2, h20);
			append(div2, t10);
			append(div2, p1);
			append(div4, t12);
			append(div4, div3);
			append(div3, h21);
			append(div3, t14);
			append(div3, p2);

			if (!mounted) {
				dispose = listen(img, "load", load_handler_1);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (/*show*/ ctx[7]?.poster) if_block0.p(ctx, dirty);

			if (dirty & /*$cfg*/ 64 && !src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[6].host + /*show*/ ctx[7]?.icon)) {
				attr(img, "src", img_src_value);
			}

			if (settings.userSet.developerMode) if_block1.p(ctx, dirty);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t0);
			if (detaching) detach(div5);
			if (if_block1) if_block1.d();
			mounted = false;
			dispose();
		}
	};
}

// (132:20) {:else}
function create_else_block(ctx) {
	let videoview;
	let current;

	videoview = new VideoView({
			props: {
				targetVideo: /*selectedEpisode_obj*/ ctx[3]
			}
		});

	return {
		c() {
			create_component(videoview.$$.fragment);
		},
		m(target, anchor) {
			mount_component(videoview, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const videoview_changes = {};
			if (dirty & /*selectedEpisode_obj*/ 8) videoview_changes.targetVideo = /*selectedEpisode_obj*/ ctx[3];
			videoview.$set(videoview_changes);
		},
		i(local) {
			if (current) return;
			transition_in(videoview.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(videoview.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(videoview, detaching);
		}
	};
}

// (119:20) {#if selectedEpisode_obj.unfinished && !settings.userSet.developerMode}
function create_if_block_4$1(ctx) {
	let div0;
	let img;
	let img_src_value;
	let img_alt_value;
	let t0;
	let div1;
	let h1;
	let t1;
	let span;
	let br;
	let t2;
	let t3_value = /*selectedEpisode_obj*/ ctx[3].name + "";
	let t3;
	let t4;
	let mounted;
	let dispose;

	return {
		c() {
			div0 = element("div");
			img = element("img");
			t0 = space();
			div1 = element("div");
			h1 = element("h1");
			t1 = text("Sorry!\n                                ");
			span = element("span");
			br = element("br");
			t2 = text("\"");
			t3 = text(t3_value);
			t4 = text("\" is still a work in progress. Enable developer mode to bypass this screen.");
			if (!src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[6].host + /*selectedEpisode_obj*/ ctx[3]?.thumbnail)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = /*selectedEpisode_obj*/ ctx[3]?.name);
			attr(div0, "class", "thumbnailBackground");
			attr(div1, "class", "nothingSelected backedByThumbnailBkg");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			append(div0, img);
			insert(target, t0, anchor);
			insert(target, div1, anchor);
			append(div1, h1);
			append(h1, t1);
			append(h1, span);
			append(span, br);
			append(span, t2);
			append(span, t3);
			append(span, t4);

			if (!mounted) {
				dispose = listen(img, "load", load_handler_2);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*$cfg, selectedEpisode_obj*/ 72 && !src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[6].host + /*selectedEpisode_obj*/ ctx[3]?.thumbnail)) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*selectedEpisode_obj*/ 8 && img_alt_value !== (img_alt_value = /*selectedEpisode_obj*/ ctx[3]?.name)) {
				attr(img, "alt", img_alt_value);
			}

			if (dirty & /*selectedEpisode_obj*/ 8 && t3_value !== (t3_value = /*selectedEpisode_obj*/ ctx[3].name + "")) set_data(t3, t3_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t0);
			if (detaching) detach(div1);
			mounted = false;
			dispose();
		}
	};
}

// (117:16) {#key selectedEpisode_obj}
function create_key_block$1(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block_4$1, create_else_block];
	const if_blocks = [];

	function select_block_type_1(ctx, dirty) {
		if (/*selectedEpisode_obj*/ ctx[3].unfinished && !settings.userSet.developerMode) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_1(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (81:8) {#if show?.poster}
function create_if_block_2$1(ctx) {
	let div2;
	let img;
	let img_src_value;
	let t0;
	let div0;
	let t1;
	let div1;
	let mounted;
	let dispose;

	return {
		c() {
			div2 = element("div");
			img = element("img");
			t0 = space();
			div0 = element("div");
			t1 = space();
			div1 = element("div");
			if (!src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[6].host + /*show*/ ctx[7]?.poster)) attr(img, "src", img_src_value);
			attr(img, "alt", /*show*/ ctx[7]?.name);
			attr(div0, "class", "posterOverlay");
			attr(div1, "class", "poBlendFix");
			attr(div2, "class", "poster");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, img);
			append(div2, t0);
			append(div2, div0);
			append(div2, t1);
			append(div2, div1);

			if (!mounted) {
				dispose = listen(img, "load", load_handler);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*$cfg*/ 64 && !src_url_equal(img.src, img_src_value = /*$cfg*/ ctx[6].host + /*show*/ ctx[7]?.poster)) {
				attr(img, "src", img_src_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div2);
			mounted = false;
			dispose();
		}
	};
}

// (96:27) {#if settings.userSet.developerMode}
function create_if_block_1$1(ctx) {
	let span;
	let t1;

	return {
		c() {
			span = element("span");
			span.textContent = `${/*show*/ ctx[7]?.id}`;
			t1 = text(" | ");
			attr(span, "class", "monospaceText");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			insert(target, t1, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(span);
			if (detaching) detach(t1);
		}
	};
}

function create_fragment$2(ctx) {
	let div1;
	let sidebar;
	let updating_active;
	let updating_items;
	let t0;
	let t1;
	let div0;
	let current_block_type_index;
	let if_block1;
	let current;

	function sidebar_active_binding(value) {
		/*sidebar_active_binding*/ ctx[10](value);
	}

	function sidebar_items_binding(value) {
		/*sidebar_items_binding*/ ctx[11](value);
	}

	let sidebar_props = { level: 1, width: 275 };

	if (/*$watchPage_season*/ ctx[2] !== void 0) {
		sidebar_props.active = /*$watchPage_season*/ ctx[2];
	}

	if (/*seasonList*/ ctx[4] !== void 0) {
		sidebar_props.items = /*seasonList*/ ctx[4];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding));
	binding_callbacks.push(() => bind(sidebar, 'items', sidebar_items_binding));
	let if_block0 = /*$watchPage_season*/ ctx[2] != "showAbout" && create_if_block_5(ctx);
	const if_block_creators = [create_if_block$2, create_if_block_3$1, create_else_block_1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*$watchPage_season*/ ctx[2] == "showAbout") return 0;
		if (/*$watchPage_episode*/ ctx[1] && /*selectedEpisode_obj*/ ctx[3]) return 1;
		return 2;
	}

	current_block_type_index = select_block_type(ctx);
	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div1 = element("div");
			create_component(sidebar.$$.fragment);
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			div0 = element("div");
			if_block1.c();
			attr(div0, "class", "content");
			attr(div1, "class", "screen");
			attr(div1, "id", "screenShow");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(sidebar, div1, null);
			append(div1, t0);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t1);
			append(div1, div0);
			if_blocks[current_block_type_index].m(div0, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const sidebar_changes = {};

			if (!updating_active && dirty & /*$watchPage_season*/ 4) {
				updating_active = true;
				sidebar_changes.active = /*$watchPage_season*/ ctx[2];
				add_flush_callback(() => updating_active = false);
			}

			if (!updating_items && dirty & /*seasonList*/ 16) {
				updating_items = true;
				sidebar_changes.items = /*seasonList*/ ctx[4];
				add_flush_callback(() => updating_items = false);
			}

			sidebar.$set(sidebar_changes);

			if (/*$watchPage_season*/ ctx[2] != "showAbout") {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*$watchPage_season*/ 4) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div1, t1);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block1 = if_blocks[current_block_type_index];

				if (!if_block1) {
					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block1.c();
				} else {
					if_block1.p(ctx, dirty);
				}

				transition_in(if_block1, 1);
				if_block1.m(div0, null);
			}
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(sidebar);
			if (if_block0) if_block0.d();
			if_blocks[current_block_type_index].d();
		}
	};
}

const load_handler = e => e.currentTarget.setAttribute("data-loaded", "");
const load_handler_1 = e => e.currentTarget.setAttribute("data-loaded", "");
const func$1 = e => e.type !== "extras";
const func_1 = e => e.type !== "extras";
const func_2 = e => e.type !== "extras";
const func_3 = e => e.episodes.length;
const func_4 = (pv, cv) => pv + cv;
const load_handler_2 = e => e.currentTarget.setAttribute("data-loaded", "");

function instance$2($$self, $$props, $$invalidate) {
	let $watchPage_episode;
	let $ready;
	let $watchPage_season;
	let $tv;
	let $selected;
	let $cfg;
	component_subscribe($$self, watchPage_episode, $$value => $$invalidate(1, $watchPage_episode = $$value));
	component_subscribe($$self, ready, $$value => $$invalidate(9, $ready = $$value));
	component_subscribe($$self, watchPage_season, $$value => $$invalidate(2, $watchPage_season = $$value));
	component_subscribe($$self, tv, $$value => $$invalidate(14, $tv = $$value));
	component_subscribe($$self, selected, $$value => $$invalidate(15, $selected = $$value));
	component_subscribe($$self, cfg, $$value => $$invalidate(6, $cfg = $$value));
	let pSS = "showAbout";

	//let selectedSeason: string = "showAbout";
	set_store_value(watchPage_season, $watchPage_season = "showAbout", $watchPage_season);

	let selectedSeason_obj;

	//let selectedEpisode: string | undefined = "";
	set_store_value(watchPage_episode, $watchPage_episode = "", $watchPage_episode);

	let selectedEpisode_obj;
	let seasonList = [];
	let episodeList = [];

	let showId = ($selected === null || $selected === void 0
	? void 0
	: $selected.slice(5)) || "";

	let show = $tv.find(e => e.id == showId);

	function sidebar_active_binding(value) {
		$watchPage_season = value;
		watchPage_season.set($watchPage_season);
	}

	function sidebar_items_binding(value) {
		seasonList = value;
		(($$invalidate(4, seasonList), $$invalidate(9, $ready)), $$invalidate(7, show));
	}

	function sidebar_active_binding_1(value) {
		$watchPage_episode = value;
		watchPage_episode.set($watchPage_episode);
	}

	function sidebar_items_binding_1(value) {
		episodeList = value;
		(((($$invalidate(5, episodeList), $$invalidate(9, $ready)), $$invalidate(7, show)), $$invalidate(2, $watchPage_season)), $$invalidate(0, selectedSeason_obj));
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$ready*/ 512) {
			{
				if ($ready && show) {
					$$invalidate(4, seasonList = [
						{
							text: "About This Show",
							id: "showAbout",
							icon: {
								type: "image",
								content: "/assets/icons/question.svg"
							}
						},
						...show.seasons.map((v, x) => {
							return {
								text: v.name || (v.type
								? lists.seasonTypeLT[v.type].placeholder
								: `Season ${x + 1}`),
								id: v.id,
								icon: { type: "text", content: getSeasonLabel(v) }
							};
						})
					]);
				}
			}
		}

		if ($$self.$$.dirty & /*$ready, $watchPage_season, selectedSeason_obj*/ 517) {
			{
				if ($ready && show && $watchPage_season != "showAbout") {
					$$invalidate(0, selectedSeason_obj = show.seasons.find(e => e.id == $watchPage_season));

					if (selectedSeason_obj) {
						$$invalidate(5, episodeList = selectedSeason_obj.episodes.map((v, x) => {
							return {
								text: v.name,
								id: v.id,
								icon: {
									type: "text",
									content: `${(x + 1).toString().length < 2 ? "0" : ""}${x + 1}`
								},
								title: v.type ? lists.episodeTypeLT[v.type] : undefined,
								note: v.author
							};
						}));
					}
				} else {
					$$invalidate(0, selectedSeason_obj = undefined);
					$$invalidate(5, episodeList = []);
				}
			}
		}

		if ($$self.$$.dirty & /*pSS, $watchPage_season*/ 260) {
			if (pSS != $watchPage_season) {
				$$invalidate(8, pSS = $watchPage_season);
				set_store_value(watchPage_episode, $watchPage_episode = undefined, $watchPage_episode);
			}
		}

		if ($$self.$$.dirty & /*$ready, selectedSeason_obj, $watchPage_episode*/ 515) {
			if ($ready && selectedSeason_obj) {
				$$invalidate(3, selectedEpisode_obj = selectedSeason_obj.episodes.find(e => e.id == $watchPage_episode));
			}
		}
	};

	return [
		selectedSeason_obj,
		$watchPage_episode,
		$watchPage_season,
		selectedEpisode_obj,
		seasonList,
		episodeList,
		$cfg,
		show,
		pSS,
		$ready,
		sidebar_active_binding,
		sidebar_items_binding,
		sidebar_active_binding_1,
		sidebar_items_binding_1
	];
}

class ScreenShow extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
	}
}

/* src/svelte/screens/ScreenSettings.svelte generated by Svelte v3.59.1 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	return child_ctx;
}

// (33:40) {#if settings.userSet.developerMode}
function create_if_block_4(ctx) {
	let span;
	let t_value = /*item*/ ctx[7].targetSetting + "";
	let t;

	return {
		c() {
			span = element("span");
			t = text(t_value);
			attr(span, "class", "monospaceText");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty & /*currentCategory*/ 2 && t_value !== (t_value = /*item*/ ctx[7].targetSetting + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

// (43:64) 
function create_if_block_3(ctx) {
	let select;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let select_value_value;
	let mounted;
	let dispose;
	let each_value_1 = /*item*/ ctx[7].input;
	const get_key = ctx => /*s*/ ctx[10];

	for (let i = 0; i < each_value_1.length; i += 1) {
		let child_ctx = get_each_context_1(ctx, each_value_1, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
	}

	function change_handler_3(...args) {
		return /*change_handler_3*/ ctx[6](/*item*/ ctx[7], ...args);
	}

	return {
		c() {
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(select, "class", "inp");
		},
		m(target, anchor) {
			insert(target, select, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(select, null);
				}
			}

			select_option(select, settings.userSet[/*item*/ ctx[7].targetSetting]);

			if (!mounted) {
				dispose = listen(select, "change", change_handler_3);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*currentCategory*/ 2) {
				each_value_1 = /*item*/ ctx[7].input;
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, select, destroy_block, create_each_block_1, null, get_each_context_1);
			}

			if (dirty & /*currentCategory*/ 2 && select_value_value !== (select_value_value = settings.userSet[/*item*/ ctx[7].targetSetting])) {
				select_option(select, settings.userSet[/*item*/ ctx[7].targetSetting]);
			}
		},
		d(detaching) {
			if (detaching) detach(select);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			mounted = false;
			dispose();
		}
	};
}

// (41:57) 
function create_if_block_2(ctx) {
	let input;
	let input_value_value;
	let mounted;
	let dispose;

	function change_handler_2(...args) {
		return /*change_handler_2*/ ctx[5](/*item*/ ctx[7], ...args);
	}

	return {
		c() {
			input = element("input");
			attr(input, "class", "inp");
			attr(input, "type", "number");
			input.value = input_value_value = settings.userSet[/*item*/ ctx[7].targetSetting];
		},
		m(target, anchor) {
			insert(target, input, anchor);

			if (!mounted) {
				dispose = listen(input, "change", change_handler_2);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*currentCategory*/ 2 && input_value_value !== (input_value_value = settings.userSet[/*item*/ ctx[7].targetSetting]) && input.value !== input_value_value) {
				input.value = input_value_value;
			}
		},
		d(detaching) {
			if (detaching) detach(input);
			mounted = false;
			dispose();
		}
	};
}

// (39:57) 
function create_if_block_1(ctx) {
	let input;
	let input_value_value;
	let mounted;
	let dispose;

	function change_handler_1(...args) {
		return /*change_handler_1*/ ctx[4](/*item*/ ctx[7], ...args);
	}

	return {
		c() {
			input = element("input");
			attr(input, "class", "inp");
			attr(input, "type", "input");
			input.value = input_value_value = settings.userSet[/*item*/ ctx[7].targetSetting];
		},
		m(target, anchor) {
			insert(target, input, anchor);

			if (!mounted) {
				dispose = listen(input, "change", change_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*currentCategory*/ 2 && input_value_value !== (input_value_value = settings.userSet[/*item*/ ctx[7].targetSetting]) && input.value !== input_value_value) {
				input.value = input_value_value;
			}
		},
		d(detaching) {
			if (detaching) detach(input);
			mounted = false;
			dispose();
		}
	};
}

// (37:24) {#if item.input == "boolean"}
function create_if_block$1(ctx) {
	let input;
	let input_checked_value;
	let mounted;
	let dispose;

	function change_handler(...args) {
		return /*change_handler*/ ctx[3](/*item*/ ctx[7], ...args);
	}

	return {
		c() {
			input = element("input");
			attr(input, "class", "inp");
			attr(input, "type", "checkbox");
			input.checked = input_checked_value = !!settings.userSet[/*item*/ ctx[7].targetSetting];
		},
		m(target, anchor) {
			insert(target, input, anchor);

			if (!mounted) {
				dispose = listen(input, "change", change_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*currentCategory*/ 2 && input_checked_value !== (input_checked_value = !!settings.userSet[/*item*/ ctx[7].targetSetting])) {
				input.checked = input_checked_value;
			}
		},
		d(detaching) {
			if (detaching) detach(input);
			mounted = false;
			dispose();
		}
	};
}

// (46:32) {#each item.input as s (s)}
function create_each_block_1(key_1, ctx) {
	let option;
	let t_value = /*s*/ ctx[10] + "";
	let t;
	let option_value_value;

	return {
		key: key_1,
		first: null,
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*s*/ ctx[10];
			option.value = option.__value;
			this.first = option;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*currentCategory*/ 2 && t_value !== (t_value = /*s*/ ctx[10] + "")) set_data(t, t_value);

			if (dirty & /*currentCategory*/ 2 && option_value_value !== (option_value_value = /*s*/ ctx[10])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (31:16) {#each currentCategory.children as item (item.targetSetting)}
function create_each_block(key_1, ctx) {
	let div;
	let p;
	let t0_value = /*item*/ ctx[7].label + "";
	let t0;
	let t1;
	let t2;
	let t3;
	let if_block0 = settings.userSet.developerMode && create_if_block_4(ctx);

	function select_block_type(ctx, dirty) {
		if (/*item*/ ctx[7].input == "boolean") return create_if_block$1;
		if (/*item*/ ctx[7].input == "string") return create_if_block_1;
		if (/*item*/ ctx[7].input == "number") return create_if_block_2;
		if (typeof /*item*/ ctx[7].input == "object") return create_if_block_3;
	}

	let current_block_type = select_block_type(ctx);
	let if_block1 = current_block_type && current_block_type(ctx);

	return {
		key: key_1,
		first: null,
		c() {
			div = element("div");
			p = element("p");
			t0 = text(t0_value);
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			attr(div, "class", "settingsItem");
			this.first = div;
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, p);
			append(p, t0);
			append(p, t1);
			if (if_block0) if_block0.m(p, null);
			append(div, t2);
			if (if_block1) if_block1.m(div, null);
			append(div, t3);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*currentCategory*/ 2 && t0_value !== (t0_value = /*item*/ ctx[7].label + "")) set_data(t0, t0_value);
			if (settings.userSet.developerMode) if_block0.p(ctx, dirty);

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
				if_block1.p(ctx, dirty);
			} else {
				if (if_block1) if_block1.d(1);
				if_block1 = current_block_type && current_block_type(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(div, t3);
				}
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block0) if_block0.d();

			if (if_block1) {
				if_block1.d();
			}
		}
	};
}

function create_fragment$1(ctx) {
	let div4;
	let sidebar;
	let updating_active;
	let t0;
	let div3;
	let div2;
	let div0;
	let img;
	let img_src_value;
	let img_alt_value;
	let t1;
	let h1;
	let t2_value = /*currentCategory*/ ctx[1].name + "";
	let t2;
	let t3;
	let div1;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let current;

	function sidebar_active_binding(value) {
		/*sidebar_active_binding*/ ctx[2](value);
	}

	let sidebar_props = {
		level: 1,
		width: 250,
		items: settings.suiLinks.map(func)
	};

	if (/*activeEl*/ ctx[0] !== void 0) {
		sidebar_props.active = /*activeEl*/ ctx[0];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding));
	let each_value = /*currentCategory*/ ctx[1].children;
	const get_key = ctx => /*item*/ ctx[7].targetSetting;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			div4 = element("div");
			create_component(sidebar.$$.fragment);
			t0 = space();
			div3 = element("div");
			div2 = element("div");
			div0 = element("div");
			img = element("img");
			t1 = space();
			h1 = element("h1");
			t2 = text(t2_value);
			t3 = space();
			div1 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			if (!src_url_equal(img.src, img_src_value = /*currentCategory*/ ctx[1].icon)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = /*currentCategory*/ ctx[1].name);
			attr(div0, "class", "topic");
			attr(div1, "class", "settingsList");
			attr(div2, "class", "stUI");
			attr(div3, "class", "content");
			attr(div4, "class", "screen");
			attr(div4, "id", "screenSettings");
		},
		m(target, anchor) {
			insert(target, div4, anchor);
			mount_component(sidebar, div4, null);
			append(div4, t0);
			append(div4, div3);
			append(div3, div2);
			append(div2, div0);
			append(div0, img);
			append(div0, t1);
			append(div0, h1);
			append(h1, t2);
			append(div2, t3);
			append(div2, div1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div1, null);
				}
			}

			current = true;
		},
		p(ctx, [dirty]) {
			const sidebar_changes = {};

			if (!updating_active && dirty & /*activeEl*/ 1) {
				updating_active = true;
				sidebar_changes.active = /*activeEl*/ ctx[0];
				add_flush_callback(() => updating_active = false);
			}

			sidebar.$set(sidebar_changes);

			if (!current || dirty & /*currentCategory*/ 2 && !src_url_equal(img.src, img_src_value = /*currentCategory*/ ctx[1].icon)) {
				attr(img, "src", img_src_value);
			}

			if (!current || dirty & /*currentCategory*/ 2 && img_alt_value !== (img_alt_value = /*currentCategory*/ ctx[1].name)) {
				attr(img, "alt", img_alt_value);
			}

			if ((!current || dirty & /*currentCategory*/ 2) && t2_value !== (t2_value = /*currentCategory*/ ctx[1].name + "")) set_data(t2, t2_value);

			if (dirty & /*settings, currentCategory*/ 2) {
				each_value = /*currentCategory*/ ctx[1].children;
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block, null, get_each_context);
			}
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div4);
			destroy_component(sidebar);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

const func = v => {
	return {
		text: v.name,
		id: v.name,
		icon: { type: "image", content: v.icon }
	};
};

function instance$1($$self, $$props, $$invalidate) {
	let activeEl = "Video";

	let currentCategory = settings.suiLinks.find(e => e.name == activeEl) || {
		name: "?",
		icon: "/assets/icons/question.svg",
		children: []
	};

	function sidebar_active_binding(value) {
		activeEl = value;
		$$invalidate(0, activeEl);
	}

	const change_handler = (item, e) => settings.set(item.targetSetting, e.currentTarget.checked);
	const change_handler_1 = (item, e) => settings.set(item.targetSetting, e.currentTarget.value);
	const change_handler_2 = (item, e) => settings.set(item.targetSetting, e.currentTarget.valueAsNumber);
	const change_handler_3 = (item, e) => settings.set(item.targetSetting, e.currentTarget.value);

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*activeEl, currentCategory*/ 3) {
			// sync menu is todo
			$$invalidate(1, currentCategory = settings.suiLinks.find(e => e.name == activeEl) || currentCategory);
		}
	};

	return [
		activeEl,
		currentCategory,
		sidebar_active_binding,
		change_handler,
		change_handler_1,
		change_handler_2,
		change_handler_3
	];
}

class ScreenSettings extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
	}
}

/* src/svelte/App.svelte generated by Svelte v3.59.1 */

function create_if_block(ctx) {
	let div1;
	let div0;
	let t0;
	let sidebar;
	let updating_active;
	let div1_transition;
	let t1;
	let div2;
	let previous_key = /*activeSbElem*/ ctx[0];
	let current;

	function sidebar_active_binding(value) {
		/*sidebar_active_binding*/ ctx[8](value);
	}

	let sidebar_props = {
		width: 250,
		level: 2,
		items: /*sbItems*/ ctx[3]
	};

	if (/*activeSbElem*/ ctx[0] !== void 0) {
		sidebar_props.active = /*activeSbElem*/ ctx[0];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	/*sidebar_binding*/ ctx[7](sidebar);
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding));
	let key_block = create_key_block(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			create_component(sidebar.$$.fragment);
			t1 = space();
			div2 = element("div");
			key_block.c();
			attr(div0, "id", "clgrad");
			attr(div1, "id", "menu");
			attr(div2, "id", "content");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t0);
			mount_component(sidebar, div1, null);
			insert(target, t1, anchor);
			insert(target, div2, anchor);
			key_block.m(div2, null);
			current = true;
		},
		p(ctx, dirty) {
			const sidebar_changes = {};
			if (dirty & /*sbItems*/ 8) sidebar_changes.items = /*sbItems*/ ctx[3];

			if (!updating_active && dirty & /*activeSbElem*/ 1) {
				updating_active = true;
				sidebar_changes.active = /*activeSbElem*/ ctx[0];
				add_flush_callback(() => updating_active = false);
			}

			sidebar.$set(sidebar_changes);

			if (dirty & /*activeSbElem*/ 1 && safe_not_equal(previous_key, previous_key = /*activeSbElem*/ ctx[0])) {
				group_outros();
				transition_out(key_block, 1, 1, noop);
				check_outros();
				key_block = create_key_block(ctx);
				key_block.c();
				transition_in(key_block, 1);
				key_block.m(div2, null);
			} else {
				key_block.p(ctx, dirty);
			}
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);

			add_render_callback(() => {
				if (!current) return;
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 200 }, true);
				div1_transition.run(1);
			});

			transition_in(key_block);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 200 }, false);
			div1_transition.run(0);
			transition_out(key_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			/*sidebar_binding*/ ctx[7](null);
			destroy_component(sidebar);
			if (detaching && div1_transition) div1_transition.end();
			if (detaching) detach(t1);
			if (detaching) detach(div2);
			key_block.d(detaching);
		}
	};
}

// (83:12) {#key activeSbElem}
function create_key_block(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;

	var switch_value = (/*activeSbElem*/ ctx[0] || "scr:home").startsWith("scr:")
	? /*scrTab*/ ctx[4][(/*activeSbElem*/ ctx[0] || "scr:home").slice(4)]
	: ScreenShow;

	function switch_props(ctx) {
		return {};
	}

	if (switch_value) {
		switch_instance = construct_svelte_component(switch_value, switch_props());
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) mount_component(switch_instance, target, anchor);
			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*activeSbElem*/ 1 && switch_value !== (switch_value = (/*activeSbElem*/ ctx[0] || "scr:home").startsWith("scr:")
			? /*scrTab*/ ctx[4][(/*activeSbElem*/ ctx[0] || "scr:home").slice(4)]
			: ScreenShow)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = construct_svelte_component(switch_value, switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

function create_fragment(ctx) {
	let div;
	let current;
	let if_block = /*$ready*/ ctx[1] && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "id", "mc");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*$ready*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*$ready*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $selected;
	let $cfg;
	let $tv;
	let $ready;
	component_subscribe($$self, selected, $$value => $$invalidate(9, $selected = $$value));
	component_subscribe($$self, cfg, $$value => $$invalidate(5, $cfg = $$value));
	component_subscribe($$self, tv, $$value => $$invalidate(6, $tv = $$value));
	component_subscribe($$self, ready, $$value => $$invalidate(1, $ready = $$value));
	let sb;
	let activeSbElem = undefined;

	let scrTab = {
		"home": ScreenHome,
		"embeddables": ScreenEmbeddables,
		"movies": ScreenMovies,
		"settings": ScreenSettings
	};

	let sbItems = [];

	let menuItems = [
		{
			id: "scr:settings",
			text: "Settings",
			icon: {
				type: "image",
				content: "/assets/icons/settings.svg"
			}
		},
		{
			id: "scr:movies",
			text: "Movies",
			icon: {
				type: "image",
				content: "/assets/icons/tv.svg"
			}
		},
		{
			id: "scr:embeddables",
			text: "Embeddables",
			icon: {
				type: "image",
				content: "/assets/icons/embed.svg"
			}
		}
	];

	onMount(() => {
		
	});

	function sidebar_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			sb = $$value;
			$$invalidate(2, sb);
		});
	}

	function sidebar_active_binding(value) {
		activeSbElem = value;
		$$invalidate(0, activeSbElem);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$ready, $tv, $cfg*/ 98) {
			{
				if ($ready) {
					$$invalidate(3, sbItems = [
						...menuItems,
						...$tv.map(show => {
							return {
								text: show.name,
								id: `show:${show.id}`,
								icon: {
									type: "image",
									content: $cfg.host + show.icon,
									circular: true
								}
							};
						})
					]);
				}
			}
		}

		if ($$self.$$.dirty & /*activeSbElem*/ 1) {
			set_store_value(selected, $selected = activeSbElem, $selected);
		}
	};

	return [
		activeSbElem,
		$ready,
		sb,
		sbItems,
		scrTab,
		$cfg,
		$tv,
		sidebar_binding,
		sidebar_active_binding
	];
}

class App extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

new App({
    target: document.body
});
//# sourceMappingURL=main.js.map
