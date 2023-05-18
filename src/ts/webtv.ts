import { writable } from "svelte/store";

export namespace lists {
    export const quality = [
        "best", // 1080p
        "good", // 720p
        "ok"    // 480p
    ] as const

    export const formats = [
        "main",
        "hardsub",
        "dub"
    ] as const
}

// Types

export type videoQuality = typeof lists.quality[number]
export type videoFormat = typeof lists.formats[number]

export interface Object {
    name: string,
    id:   string
}

export interface Video extends Object {

    thumbnail?: string,
    length: number, // should be in seconds.
                    // may be useful but don't rely on it

    formats: {
        [ x in videoFormat ] : {
            [ x in videoQuality ] : string
        }
    }

}

export interface Episode extends Video {
    parent: string // should be a Season's id

    intro?: [ number, number ] // range for when the intro is playing;
                               // allows for skip intro button

    outro?: [ number, number? ] // when the outro plays;
                                // allows for autoplay to skip the intro
                                // specify a second number for a
                                // skip to end of credits scene button
}

export interface Season extends Object {

    parent: string // should be a Show's id

    episodes: Episode[]
    
}

export interface Show extends Object {

    description?: string,
    notes?: string,
    icon: string,
    poster?: string,

    seasons: Season[]

}

export interface Movie extends Video {

    notes?: string,
    icon: string,
    poster?: string

}

export interface Embeddable {
    name: string,
    icon: string,

    urls: {
        url: string,
        description: string
    }[]
}

export interface WebTVConfig {
    host: string
}

// set up svt stores

export let cfg = writable<WebTVConfig>()
export let tv = writable<Show[]>()
export let movies = writable<Movie[]>()
export let embeddables = writable<Embeddable[]>()

export let ready = writable<boolean>(false)

// fetch cfg; tv; movies

fetch("/db/webtv")