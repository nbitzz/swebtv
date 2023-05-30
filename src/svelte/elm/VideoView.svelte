<script lang="ts">
    import { letteredTime } from "../../ts/util";
    import { IDIndex, isEpisode, isMovie, isShow, type Video, cfg, isSeason, type Show, type Season } from "../../ts/webtv";
    import FormatDownloader from "./FormatDownloader.svelte";
    import VideoPlayer from "./VideoPlayer.svelte";

    export let targetVideo: Video

    // This is a mess. too bad!

    let mtdt: {
        type: "movie",
        icon: string
    } | {
        type: "episode",
        icon: string,
        season_number: number,
        episode_number: number,

        season: Season,
        show: Show,
    } | {type: "UNKNOWN", icon: string} = 
        (isEpisode(targetVideo) 
        ? ( 
            (()=>{
                let season = IDIndex.get(targetVideo.parent)
                if (!season || !isSeason(season)) return undefined;
                let show = IDIndex.get(season.parent)
                if (!show || !isShow(show)) return undefined;

                return {
                    type: "episode",
                    icon: show.icon,
                    season, show,

                    season_number: show.seasons.indexOf(season) + 1,
                    episode_number: season.episodes.indexOf(targetVideo) + 1
                }
            })()
        ) 
        : ( isMovie(targetVideo) && {
            type: "movie",
            icon: targetVideo.icon
        } )) || { type:"UNKNOWN", icon: "" };

</script>

<div class="videoView">
    
    <div class="container">
        
        <VideoPlayer playing={targetVideo} />

        <div class="shortAbout">

            <img src={$cfg.host + mtdt.icon} alt={targetVideo.name + " icon"} on:load={(e) => {e.currentTarget.setAttribute("data-loaded","")}}/>
            <div class="txt">
                <h1>{targetVideo.name}</h1>
                <p>{mtdt.type != "UNKNOWN" && (mtdt.type == "movie" ? `Runtime ${letteredTime(targetVideo.length)}` : `${letteredTime(targetVideo.length)}; S${mtdt.season_number}E${mtdt.episode_number} — ${mtdt.show.name}`)}</p>
            </div>
        </div>

        <div class="btm_ctn">
            <div class="longAbout">
                <div>
                    <h2>Description</h2>
                    <p>{targetVideo.description || "No description specified"}</p>
                </div>
                {#if isMovie(targetVideo) && targetVideo.notes}    
                    <div>
                        <h2>Notes</h2>
                        <p>{targetVideo.notes}</p>
                    </div>
                {/if}
            </div>

            <div class="opts">
                <FormatDownloader target={targetVideo} />
            </div>
        </div>

    </div>

</div> 