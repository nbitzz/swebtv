import { writable } from "svelte/store";

export namespace lists {
    export const quality = [
        "best", // 1080p
        "good", // 720p
        "okay"  // 480p
    ] as const

    export const formats = [
        "main",
        "hardsub",
        "dub"
    ] as const

    export const seasontypes = [
        "extras", // +, use for extra videos/etc
        "special" // ★; if there is a second special, ☆. use for seasons containing shorts, etc
    ] as const
    
    export const episodetypes = [
        //"extra", // + Extra
        "special",
        "music",
        "opening",
        "ending" 
    ] as const

    export const seasonTypeLT: { [x in seasonType]: { icons: string[], placeholder: string } } = {
        extras: {
            icons: ["+"],
            placeholder: "Extras"
        },
        special: {
            icons: ["★","☆"],
            placeholder: "Special season"
        }
    }

    // open ended lke this cause it's possible that more could be added later
    export const episodeTypeLT: { [x in episodeType]: string } = {
        special: "★ Special",
        music: "♫ Music",
        opening: "Opening",
        ending: "Ending"
    }
}

// Types

export type videoQuality = typeof lists.quality[number]
export type videoFormat = typeof lists.formats[number]
export type seasonType = typeof lists.seasontypes[number]
export type episodeType = typeof lists.episodetypes[number]

export interface Common {
    name: string,
    id:   string
}

export interface Video extends Common {

    description?: string,
    thumbnail?: string,
    length: number, // should be in seconds.
                    // may be useful but don't rely on it

    formats: {
        [ x in videoFormat ] : {
            [ x in videoQuality ] : string
        }
    }

    aspectRatio?: string,        // ex. 16 / 9
    unfinished?: boolean

}

export interface Episode extends Video {
    parent: string // should be a Season's id

    type: episodeType
    author: string // use for opening, etc?

    intro?: [ number, number ] // range for when the intro is playing;
                               // allows for skip intro button

    outro?: [ number, number? ] // when the outro plays;
                                // allows for autoplay to skip the outro
                                // specify a second number for a
                                // skip to end of credits scene button
}

export interface Season extends Common {

    parent: string // should be a Show's id

    episodes: Episode[],

    type?: seasonType
    
}

export interface Show extends Common {

    description?: string,
    notes?: string,
    icon: string,
    poster?: string,

    footnote?: string,

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
        keyboardSeek: "5",

        theatre: false,
        theatreFill: "80%",
        skipbutton: true,
        sidebarResize: false,
        developerMode: false
        
    }
    export let userSet: JSONEncodedSettings = {...defaults}
    
    export interface JSONEncodedSettings {
        videoQuality: typeof lists.quality[number],
        videoFormat: typeof lists.formats[number],

        autoplay: boolean,
        autoskipintro: boolean,
        autoskipoutro: boolean,
        keyboardSeek: "0.01" | "0.1" | "1" | "5" | "10", // lazy

        sidebarResize: boolean,
        theatre: boolean,
        theatreFill: "80%" | "100%",
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
                    input: [ ...lists.quality ]
                },
                {
                    label: "Preferred format",
                    targetSetting: "videoFormat",
                    input: [ ...lists.formats ]
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
                    input: [ "0.01", "0.1", "1", "5", "10" ]
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
                    input: [ "80%", "100%" ]
                },
                {
                    label: "Show skip intro/outro buttons",
                    targetSetting: "skipbutton",
                    input: "boolean"
                },
                {
                    label: "Resize oversized sidebar items when the sidebar isn't expanded",
                    targetSetting: "sidebarResize",
                    input: "boolean"
                },
                {
                    label: "Developer mode",
                    targetSetting: "developerMode",
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

export let isCommon = (obj: any): obj is Common => !!( obj.id && obj.name )
export let isVideo = (obj: Common & Partial<Video> ): obj is Video => !!obj.formats
export let isMovie = (video: Video & { icon?: string }): video is Movie => { return !!video.icon }

export let isShow = (obj: Common & Partial<Show> ): obj is Show => !!obj.seasons
export let isSeason = (obj: Common & { episodes?: Episode[] }): obj is Season => !!obj.episodes
export let isEpisode = (video: Video & { parent?: string }): video is Episode => { return !!video.parent }

// utility functions

// these are very redundant; but i guess it means "futureproofing"
export function getBestFormat(video: Video, requested: videoFormat) : videoFormat {
    let availableFormats = Object.keys(video.formats)

    if (video.formats[requested]) return requested
    
    let idxOf = lists.formats.indexOf(requested)
    for (let i = idxOf-1; i > 0; i--) {
        if (lists.formats[i] && availableFormats.includes(lists.formats[i])) return lists.formats[i] 
    }
    return "main"
}

export function getSeasonLabel(season: Season) : string {
    let show = IDIndex.get(season.parent);
    if (!show || !isShow(show)) return "❔"

    // this is a mess LOL
    // oh well

    return season.type
    ? lists.seasonTypeLT[season.type].icons[
        show?.seasons.filter(e => e.type==season.type).indexOf(season) ?? lists.seasonTypeLT[season.type].icons.length-1
      ] || lists.seasonTypeLT[season.type].icons[lists.seasonTypeLT[season.type].icons.length-1]
    : `S${show.seasons.indexOf(season)+1}`
}

export function getEpisodeLabel(episode: Episode) : string {
    let season = IDIndex.get(episode.parent)
    if (!season || !isSeason(season)) return "❔"
    
    let slabel = getSeasonLabel(season)
    return `${slabel}${!season.type ? "E" : ""}${season.episodes.indexOf(episode)+1}`
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

export let cfg = writable<WebTVConfig>()
export let tv = writable<Show[]>()
export let movies = writable<Movie[]>()
export let embeddables = writable<Embeddable[]>()

export let ready = writable<boolean>(false)

export let IDIndex: Map<string, Common> = new Map();

// fetch cfg; tv; movies
// might DRY up this code later

fetch("/db/webtv.json", { cache: "no-store" }).then(res => {
    if (res.status == 200) res.json().then(e => cfg.set(e))
})
.then(() => 
    fetch("/db/tv.json", { cache: "no-store" }).then(res => {
        if (res.status == 200) res.json().then((e: Show[]) => {
            tv.set(e);
            e.forEach(v => {
                IDIndex.set(v.id,v);
                v.seasons.forEach(a => {
                    IDIndex.set(a.id,a);
                    a.episodes.forEach(b => IDIndex.set(b.id,b))
                })
            })
        })
    })
)
.then(() => 
    fetch("/db/movie.json", { cache: "no-store" }).then(res => {
        if (res.status == 200) res.json().then((e: Movie[]) => {
            movies.set(e)

            e.forEach(v => {
                IDIndex.set("movie."+v.id, v)
            })
        })
    })    
)
.then(() => 
    fetch("/db/embeddables.json", { cache: "no-store" }).then(res => {
        if (res.status == 200) res.json().then(e => embeddables.set(e))
    })
).then(() => {
    ready.set(true)
})