import { writable, type Writable } from "svelte/store";

export let selected:Writable<string|undefined> = writable()