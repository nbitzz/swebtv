<script lang="ts">
    import { letteredTime } from "../../ts/util";
    import { cfg, getBestFormat, settings, type Episode, type Video, type videoFormat, type videoQuality, IDIndex, isSeason, isShow, type Season, type Show } from "../../ts/webtv";

    export let target: Episode;
   
    let season: Season
    let show: Show

    let season_tmp = IDIndex.get(target.parent);
    if (season_tmp && isSeason(season_tmp)) {
        season = season_tmp
        let tmp = IDIndex.get(season.parent)
        if (tmp && isShow(tmp)) show = tmp
    }

</script>

<div class="nextUp">

    <h2>Next episode</h2>
    <div class="thumbnail" style:aspect-ratio={target.aspectRatio || "16 / 9"}>
        <img src={$cfg.host + target.thumbnail} alt="Thumbnail for {target.name}" on:load={(e) => e.currentTarget.setAttribute("data-loaded", "")} />
    </div>
    <div class="videoData">
        <p class="vTitle">{target.name}</p>
        <p>S{show.seasons.indexOf(season)+1}E{season.episodes.indexOf(target)+1} &mdash; {letteredTime(target.length)}</p>
    </div>

</div> 