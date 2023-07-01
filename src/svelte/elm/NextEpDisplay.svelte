<script lang="ts">
    import { letteredTime } from "../../ts/util";
    import { cfg, getBestFormat, settings, type Episode, type Video, type videoFormat, type videoQuality, IDIndex, isSeason, isShow, type Season, type Show, getSeasonLabel, getEpisodeLabel } from "../../ts/webtv";
    import { watchPage_season, watchPage_episode } from "../../ts/stores";

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
    <div class="nuCont">
        <div class="thumbnail" style:aspect-ratio={target.aspectRatio || "16 / 9"}>
            <img src={$cfg.host + target.thumbnail} alt="Thumbnail for {target.name}" on:load={(e) => e.currentTarget.setAttribute("data-loaded", "")} />
        </div>
        <div class="videoData">
            <p class="vTitle">{target.name}</p>
            <p>{getEpisodeLabel(target)} &mdash; {letteredTime(target.length)}</p>
        </div>
        <button class="hitbox" on:click={() => {$watchPage_episode=target.id;$watchPage_season=season.id;}}></button>
    </div>

</div> 