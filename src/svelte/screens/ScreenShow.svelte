<script lang="ts">
    import Sidebar, { type SidebarItem } from "../elm/Sidebar.svelte";
    import { cfg, ready, tv, type Season, type Show, type Episode, settings, lists, getSeasonLabel, getEpisodeLabel } from "../../ts/webtv";
    import { selected, watchPage_episode, watchPage_season } from "../../ts/stores";
    import VideoView from "../elm/VideoView.svelte";
    import DOMPurify from "dompurify";

    let pSS: string = "showAbout"
    //let selectedSeason: string = "showAbout";
    $watchPage_season = "showAbout"
    let selectedSeason_obj: Season | undefined

    //let selectedEpisode: string | undefined = "";
    $watchPage_episode = ""
    let selectedEpisode_obj: Episode | undefined;
    let seasonList:SidebarItem[] = []
    let episodeList: SidebarItem[] = []

    let showId: string = $selected?.slice(5) || ""
    let show: Show | undefined = $tv.find( e => e.id == showId )

    $: {
        if ($ready && show) {
            
            seasonList = [
                {
                    text: "About This Show",
                    id: "showAbout",
                    icon: {
                        type: "image",
                        content: "/assets/icons/question.svg"
                    }
                },
                ...show.seasons.map((v,x):SidebarItem => {
                    return {
                        text: (v.name || (v.type ? lists.seasonTypeLT[v.type].placeholder : `Season ${x+1}`)),
                        id: v.id,
                        icon: {
                            type: "text",
                            content: getSeasonLabel(v)
                        }
                    }
                })
            ]

        }
    }

    $: {
        if ($ready && show && $watchPage_season != "showAbout") {
            selectedSeason_obj = show.seasons.find(e => e.id == $watchPage_season)

            if (selectedSeason_obj) {
                episodeList = selectedSeason_obj.episodes.map((v,x):SidebarItem => {
                    return {
                        text: v.name,
                        id: v.id,
                        icon: {
                            type: "text",
                            content: `${(x+1).toString().length < 2 ? "0" : ""}${x+1}`
                        },
                        title: v.type ? lists.episodeTypeLT[v.type] : undefined,
                        note: v.author
                    }
                })
            }
        } else { selectedSeason_obj = undefined; episodeList = []; }
    }

    $: if (pSS != $watchPage_season) {
            pSS = $watchPage_season;
            $watchPage_episode = undefined;
    }

    $: if ($ready && selectedSeason_obj) {                                                     
        selectedEpisode_obj = selectedSeason_obj.episodes.find(e => e.id == $watchPage_episode)
    }

</script>
<div class="screen" id="screenShow">
    <Sidebar level={1} width={275} bind:active={$watchPage_season} bind:items={seasonList} />

    {#if $watchPage_season != "showAbout"}
        <Sidebar level={0} width={275} bind:active={$watchPage_episode} bind:items={episodeList} />
    {/if}

    <div class="content">
        {#if $watchPage_season == "showAbout"}
            
        {#if show?.poster}
            <div class="poster">
                <img src={$cfg.host + show?.poster} alt={show?.name} on:load={e => e.currentTarget.setAttribute("data-loaded","")}>
                <div class="posterOverlay" />
                <!-- lazy quick fix for in case theres a little sliver left with the overlay -->
                <div class="poBlendFix" />
            </div>
        {/if}

            <div class="showAbout">
                
                <div class="header">
                    <img src={$cfg.host + show?.icon} alt={show?.name} on:load={e => e.currentTarget.setAttribute("data-loaded","")} />
                    <div class="txt">
                        <h1>{show?.name}</h1>
                        <p>{#if settings.userSet.developerMode} <span class="monospaceText">{show?.id}</span> | {/if}{show?.seasons.filter(e => e.type !== "extras").length} season(s), {(show?.seasons?.filter(e => e.type !== "extras").length??0) >= 1 ? show?.seasons?.filter(e => e.type !== "extras").map(e => e.episodes.length).reduce((pv, cv) => pv+cv) : 0} episode(s)</p>
                    </div>
                </div>

                <div class="otherInfo">
                    <div>
                        <h2>Description</h2>
                        <p>{show?.description || "No description"}</p>
                    </div>
                    <div>
                        <h2>Notes</h2>
                        <p>{show?.notes || "No notes"}</p>
                    </div>
                </div>

                {#if show?.footnote}
                    <p class="showFootnote">{@html DOMPurify.sanitize(show.footnote)}</p>
                {/if}

            </div>

        {:else}
            
            {#if $watchPage_episode && selectedEpisode_obj}

                {#key selectedEpisode_obj}

                    {#if selectedEpisode_obj.unfinished && !settings.userSet.developerMode}
                        <div class="thumbnailBackground">
                            <img src={$cfg.host + selectedEpisode_obj?.thumbnail} alt={selectedEpisode_obj?.name} on:load={e => e.currentTarget.setAttribute("data-loaded","")}>
                        </div>
            
                        <div class="nothingSelected backedByThumbnailBkg">
                            <h1>
                                Sorry!
                                <span>
                                    <br>"{selectedEpisode_obj.name}" is still a work in progress. Enable developer mode to bypass this screen.
                                </span>
                            </h1>
                        </div>
                    {:else}
                        <VideoView targetVideo={selectedEpisode_obj} />
                    {/if}
                
                {/key}

            {:else}

                <div class="nothingSelected">
                    <h1>
                        {selectedSeason_obj?.name || "[ ... ]"}
                        <span>
                            <br>{@html DOMPurify.sanitize(settings.userSet.developerMode ? `sidebar: <span class="monospaceText">${$watchPage_season}</span>; obj: <span class="monospaceText">${selectedSeason_obj?.id}</span>` : "select an episode") }
                        </span>
                    </h1>
                </div>

            {/if}

        {/if}
    </div>
</div>