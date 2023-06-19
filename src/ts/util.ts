import type { Episode } from "./webtv";
import { isShow } from "./webtv";
import { isSeason } from "./webtv";
import { IDIndex } from "./webtv";

export function getPVs(time:number) {

    return {
        hours: Math.floor(time / 3600),
        minutes: Math.floor(time % 3600 / 60),
        seconds: Math.floor(time % 60)
    }

}

export function colonTime(time:number) { // ex. 5:30:02
    let PVs = getPVs(time);
    return ([
            // only include hours if specified
            ...(PVs.hours ? [PVs.hours] : []), PVs.minutes, PVs.seconds
        ])
            .map((v,x) => 
                v < 10 && x > 0 
                ? `0${v}` 
                : v.toString()
            ) // add zeros
            .join(":"); // join
}

let seps = [ "h", "m", "s" ].reverse()

export function letteredTime(time:number) { // ex. 15m32s
    let PVs = getPVs(time);
    return ([
            // only include hours if specified
            ...(PVs.hours ? [PVs.hours] : []), PVs.minutes, PVs.seconds
        ]).reverse()
            .map((v,x) => `${v}${seps[x]}`
            ) // add seps
            .reverse()
            .join(""); // join
}

export function getEpisodeAfter(episode:Episode) {
    // get parent show and season
    let season = IDIndex.get(episode.parent)
    if (!season || !isSeason(season)) return;
    let show = IDIndex.get(season.parent)
    if (!show || !isShow(show)) return;

    // return episode which follows
    let epIdx = season.episodes.indexOf(episode);
    let seIdx = show.seasons.indexOf(season);

    return season.episodes[epIdx + 1]
        || show.seasons[
            seIdx+1
        ]?.episodes?.[0]
}