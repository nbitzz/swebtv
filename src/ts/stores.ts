import { writable, type Writable } from "svelte/store";

export let selected:Writable<string|undefined> = writable()

// I'm lazy, fight me

export let watchPage_season = writable<string>("showAbout")
export let watchPage_episode = writable<string|undefined>()

export let playerVolume = writable<number>(1)
export let playerTemp_autoplayNext = writable<boolean>(false)