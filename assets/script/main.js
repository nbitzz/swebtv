function noop() { }
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
function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
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

/* src/svelte/elm/Sidebar.svelte generated by Svelte v3.59.1 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (20:51) 
function create_if_block_2(ctx) {
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

// (18:51) 
function create_if_block_1(ctx) {
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

// (16:16) {#if item.icon.type == "image"}
function create_if_block(ctx) {
	let img;
	let img_src_value;
	let img_alt_value;

	return {
		c() {
			img = element("img");
			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[6].icon.content)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = /*item*/ ctx[6].text);
		},
		m(target, anchor) {
			insert(target, img, anchor);
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
			if (detaching) detach(img);
		}
	};
}

// (12:4) {#each items as item (item.id)}
function create_each_block(key_1, ctx) {
	let div2;
	let div0;
	let t0;
	let div1;
	let p;
	let t1_value = /*item*/ ctx[6].text + "";
	let t1;
	let t2;
	let button;
	let t3;
	let div2_data_active_value;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*item*/ ctx[6].icon.type == "image") return create_if_block;
		if (/*item*/ ctx[6].icon.type == "text") return create_if_block_1;
		if (/*item*/ ctx[6].icon.type == "html") return create_if_block_2;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type && current_block_type(ctx);

	function click_handler() {
		return /*click_handler*/ ctx[5](/*item*/ ctx[6]);
	}

	return {
		key: key_1,
		first: null,
		c() {
			div2 = element("div");
			div0 = element("div");
			if (if_block) if_block.c();
			t0 = space();
			div1 = element("div");
			p = element("p");
			t1 = text(t1_value);
			t2 = space();
			button = element("button");
			t3 = space();
			attr(div0, "class", "icon");
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
			if (if_block) if_block.m(div0, null);
			append(div2, t0);
			append(div2, div1);
			append(div1, p);
			append(p, t1);
			append(div2, t2);
			append(div2, button);
			append(div2, t3);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if (if_block) if_block.d(1);
				if_block = current_block_type && current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div0, null);
				}
			}

			if (dirty & /*items*/ 2 && t1_value !== (t1_value = /*item*/ ctx[6].text + "")) set_data(t1, t1_value);

			if (dirty & /*items, active*/ 3 && div2_data_active_value !== (div2_data_active_value = /*item*/ ctx[6].id == /*active*/ ctx[0]
			? "true"
			: "false")) {
				attr(div2, "data-active", div2_data_active_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div2);

			if (if_block) {
				if_block.d();
			}

			mounted = false;
			dispose();
		}
	};
}

function create_fragment$4(ctx) {
	let div;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let each_value = /*items*/ ctx[1];
	const get_key = ctx => /*item*/ ctx[6].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
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
			if (dirty & /*items, active*/ 3) {
				each_value = /*items*/ ctx[1];
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);
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

function instance$2($$self, $$props, $$invalidate) {
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

		init(this, options, instance$2, create_fragment$4, safe_not_equal, {
			items: 1,
			width: 2,
			level: 3,
			dft: 4,
			active: 0
		});
	}
}

/* src/svelte/screens/ScreenHome.svelte generated by Svelte v3.59.1 */

function create_fragment$3(ctx) {
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
		init(this, options, null, create_fragment$3, safe_not_equal, {});
	}
}

var lists;
(function (lists) {
    lists.quality = [
        "best",
        "good",
        "ok" // 480p
    ];
    lists.formats = [
        "main",
        "hardsub",
        "dub"
    ];
})(lists || (lists = {}));
// set up svt stores
let cfg = writable();
let tv = writable();
let movies = writable();
let embeddables = writable();
// fetch cfg; tv; movies
// might DRY up this code later
fetch("/db/webtv.json").then(res => {
    if (res.status == 200)
        res.json().then(e => cfg.set(e));
}).catch(e => console.error(e))
    .then(() => fetch("/db/tv.json").then(res => {
    if (res.status == 200)
        res.json().then(e => tv.set(e));
}).catch())
    .then(() => fetch("/db/movie.json").then(res => {
    if (res.status == 200)
        res.json().then(e => movies.set(e));
}).catch())
    .then(() => fetch("/db/embeddables.json").then(res => {
    if (res.status == 200)
        res.json().then(e => embeddables.set(e));
}).catch());

/* src/svelte/screens/ScreenEmbeddables.svelte generated by Svelte v3.59.1 */

function create_fragment$2(ctx) {
	let div;
	let sidebar;
	let updating_active;
	let current;

	function sidebar_active_binding(value) {
		/*sidebar_active_binding*/ ctx[1](value);
	}

	let sidebar_props = { level: 1, width: 300 };

	if (/*activeEl*/ ctx[0] !== void 0) {
		sidebar_props.active = /*activeEl*/ ctx[0];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding));

	return {
		c() {
			div = element("div");
			create_component(sidebar.$$.fragment);
			attr(div, "class", "screen");
			attr(div, "id", "screenEmbeddables");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(sidebar, div, null);
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
			if (detaching) detach(div);
			destroy_component(sidebar);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let activeEl = undefined;

	function sidebar_active_binding(value) {
		activeEl = value;
		$$invalidate(0, activeEl);
	}

	return [activeEl, sidebar_active_binding];
}

class ScreenEmbeddables extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$2, safe_not_equal, {});
	}
}

/* src/svelte/screens/ScreenPlaceholder.svelte generated by Svelte v3.59.1 */

function create_fragment$1(ctx) {
	let div;

	return {
		c() {
			div = element("div");

			div.innerHTML = `<h1>501
        <span><br/>not implemented</span></h1>`;

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

class ScreenPlaceholder extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$1, safe_not_equal, {});
	}
}

/* src/svelte/App.svelte generated by Svelte v3.59.1 */

function create_fragment(ctx) {
	let div3;
	let div1;
	let div0;
	let t0;
	let sidebar;
	let updating_active;
	let t1;
	let div2;
	let switch_instance;
	let current;

	function sidebar_active_binding(value) {
		/*sidebar_active_binding*/ ctx[4](value);
	}

	let sidebar_props = {
		width: 250,
		level: 2,
		items: [
			{
				id: "movies",
				text: "Movies",
				icon: {
					type: "image",
					content: "/assets/icons/tv.svg"
				}
			},
			{
				id: "embeddables",
				text: "Embeddables",
				icon: {
					type: "image",
					content: "/assets/icons/embed.svg"
				}
			},
			{
				id: "settings",
				text: "Settings",
				icon: {
					type: "image",
					content: "/assets/icons/settings.svg"
				}
			}
		]
	};

	if (/*activeSbElem*/ ctx[1] !== void 0) {
		sidebar_props.active = /*activeSbElem*/ ctx[1];
	}

	sidebar = new Sidebar({ props: sidebar_props });
	/*sidebar_binding*/ ctx[3](sidebar);
	binding_callbacks.push(() => bind(sidebar, 'active', sidebar_active_binding));
	var switch_value = /*scrTab*/ ctx[2][/*activeSbElem*/ ctx[1] || "home"];

	function switch_props(ctx) {
		return {};
	}

	if (switch_value) {
		switch_instance = construct_svelte_component(switch_value, switch_props());
	}

	return {
		c() {
			div3 = element("div");
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			create_component(sidebar.$$.fragment);
			t1 = space();
			div2 = element("div");
			if (switch_instance) create_component(switch_instance.$$.fragment);
			attr(div0, "id", "clgrad");
			attr(div1, "id", "menu");
			attr(div2, "id", "content");
			attr(div3, "id", "mc");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div1);
			append(div1, div0);
			append(div1, t0);
			mount_component(sidebar, div1, null);
			append(div3, t1);
			append(div3, div2);
			if (switch_instance) mount_component(switch_instance, div2, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const sidebar_changes = {};

			if (!updating_active && dirty & /*activeSbElem*/ 2) {
				updating_active = true;
				sidebar_changes.active = /*activeSbElem*/ ctx[1];
				add_flush_callback(() => updating_active = false);
			}

			sidebar.$set(sidebar_changes);

			if (dirty & /*activeSbElem*/ 2 && switch_value !== (switch_value = /*scrTab*/ ctx[2][/*activeSbElem*/ ctx[1] || "home"])) {
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
					mount_component(switch_instance, div2, null);
				} else {
					switch_instance = null;
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div3);
			/*sidebar_binding*/ ctx[3](null);
			destroy_component(sidebar);
			if (switch_instance) destroy_component(switch_instance);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let sb;
	let activeSbElem = undefined;

	let scrTab = {
		"home": ScreenHome,
		"embeddables": ScreenEmbeddables,
		"movies": ScreenPlaceholder,
		"settings": ScreenPlaceholder
	};

	onMount(() => {
		
	});

	function sidebar_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			sb = $$value;
			$$invalidate(0, sb);
		});
	}

	function sidebar_active_binding(value) {
		activeSbElem = value;
		$$invalidate(1, activeSbElem);
	}

	return [sb, activeSbElem, scrTab, sidebar_binding, sidebar_active_binding];
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
