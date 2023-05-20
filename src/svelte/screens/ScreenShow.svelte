<script lang="ts">
    import Sidebar, { type SidebarItem } from "../elm/Sidebar.svelte";
    import { cfg, ready, tv, type Season, type Show } from "../../ts/webtv";
    import { selected } from "../../ts/stores";

    let pSS: string = "showAbout"
    let selectedSeason: string = "showAbout";
    let selectedSeason_obj: Season | undefined

    let selectedEpisode: string | undefined = "";
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
                        text: (v.name || `Season ${x+1}`),
                        id: v.id,
                        icon: {
                            type: "text",
                            content: `S${x+1}`
                        }
                    }
                })
            ]

        }
    }

    $: {
        if ($ready && show && selectedSeason != "showAbout") {
            selectedSeason_obj = show.seasons.find(e => e.id == selectedSeason)

            if (selectedSeason_obj) {
                episodeList = selectedSeason_obj.episodes.map((v,x):SidebarItem => {
                    return {
                        text: v.name,
                        id: v.id,
                        icon: {
                            type: "text",
                            content: `${(x+1).toString().length < 2 ? "0" : ""}${x+1}`
                        }
                    }
                })
            }
        } else { selectedSeason_obj = undefined; episodeList = []; }
    }

    $: if (pSS != selectedSeason) {
            pSS = selectedSeason;
            selectedEpisode = undefined;
    }

</script>
<div class="screen" id="screenShow">
    <Sidebar level={1} width={250} bind:active={selectedSeason} bind:items={seasonList} />

    {#if selectedSeason != "showAbout"}
        <Sidebar level={0} width={250} bind:active={selectedEpisode} bind:items={episodeList} />
    {/if}

    <div class="content">
        {#if selectedSeason == "showAbout"}
            
        {#if show?.poster}
            <div class="poster">
                <img src={$cfg.host + show?.poster} alt={show?.name} on:load={e => e.currentTarget.setAttribute("data-loaded","")}>
                <div class="posterOverlay" />
            </div>
        {/if}

            <div class="showAbout">
                
                <div class="header">
                    <img src={$cfg.host + show?.icon} alt={show?.name} on:load={e => e.currentTarget.setAttribute("data-loaded","")} />
                    <div class="txt">
                        <h1>{show?.name}</h1>
                        <p>{show?.seasons?.length} season(s), {show?.seasons?.map(e => e.episodes.length).reduce((pv, cv) => pv+cv)} episode(s)</p>
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

            </div>

        {:else}
            
            {#if selectedEpisode}

                

            {:else}

                <div class="nothingSelected">
                    <h1>
                        {selectedSeason_obj?.name || "[ ... ]"}
                        <span>
                            <br>select an episode
                        </span>
                    </h1>
                </div>

            {/if}

        {/if}
    </div>
</div>