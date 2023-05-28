import { writable } from "svelte/store";

export namespace lists {
    export const quality = [
        "best", // 1080p
        "good", // 720p
        "okay"    // 480p
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

    description?: string,
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
                                // allows for autoplay to skip the outro
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

    icon: string
    notes?: string

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

// settings

export namespace settings {

    export let defaults: JSONEncodedSettings = {

        videoQuality: "good",
        videoFormat: "hardsub",

        autoplay: true,
        autoskipintro: false,
        autoskipoutro: false,

        skipbutton: true,
        developerMode: false
        
    }
    export let userSet: JSONEncodedSettings = defaults
    
    export interface JSONEncodedSettings {
        videoQuality: typeof lists.quality[number],
        videoFormat: typeof lists.formats[number],

        autoplay: boolean,
        autoskipintro: boolean,
        autoskipoutro: boolean,

        developerMode: boolean,
        skipbutton: boolean,

        syncToken?: string // probably not secure but oh well
    }

    export type SettingsInput = "string" | "number" | "boolean" | string[]

    export interface SettingsItem {
        label: string,
        targetSetting: keyof JSONEncodedSettings,
        input: SettingsInput
    }

    export interface SettingsCategory {
        name: string,
        icon: string,
        children: SettingsItem[]
    }

    // controls ui elements in the settings menu
    export let suiLinks: SettingsCategory[] = [
        {
            name: "Video",
            icon: "/assets/icons/video.svg",
            children: [
                {
                    label: "Preferred quality",
                    targetSetting: "videoQuality",
                    input: [ "best", "good", "okay" ]
                },
                {
                    label: "Preferred format",
                    targetSetting: "videoFormat",
                    input: [ "main", "hardsub", "dub" ]
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
                }
            ]
        },
        {
            name: "Interface",
            icon: "/assets/icons/window.svg",
            children: [
                {
                    label: "Developer mode",
                    targetSetting: "developerMode",
                    input: "boolean"
                },
                {
                    label: "Show skip intro/outro buttons",
                    targetSetting: "skipbutton",
                    input: "boolean"
                }
            ]
        }
    ]

    // ok this is just painful i gave up here
    export function set( setting: keyof JSONEncodedSettings, value: string | boolean | number ) {
        //@ts-ignore
        userSet[ setting ] = value;
    }

}

// typeguards

export let isEpisode = (video: Video & { parent?: string }): video is Episode => { return !!video.parent }
export let isMovie = (video: Video & { icon?: string }): video is Movie => { return !!video.icon }

// set up svt stores

export let cfg = writable<WebTVConfig>()
export let tv = writable<Show[]>()
export let movies = writable<Movie[]>()
export let embeddables = writable<Embeddable[]>()

export let ready = writable<boolean>(false)

// fetch cfg; tv; movies
// might DRY up this code later

fetch("/db/webtv.json", { cache: "no-store" }).then(res => {
    if (res.status == 200) res.json().then(e => cfg.set(e))
})
.then(() => 
    fetch("/db/tv.json", { cache: "no-store" }).then(res => {
        if (res.status == 200) res.json().then(e => tv.set(e))
    })
)
.then(() => 
    fetch("/db/movie.json", { cache: "no-store" }).then(res => {
        if (res.status == 200) res.json().then(e => movies.set(e))
    })    
)
.then(() => 
    fetch("/db/embeddables.json", { cache: "no-store" }).then(res => {
        if (res.status == 200) res.json().then(e => embeddables.set(e))
    })
).then(() => {
    ready.set(true)
})