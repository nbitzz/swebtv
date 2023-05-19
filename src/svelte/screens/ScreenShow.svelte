<script lang="ts">
    import Sidebar, { type SidebarItem } from "../elm/Sidebar.svelte";
    import { cfg, ready, tv, type Season } from "../../ts/webtv";
    import { selected } from "../../ts/stores";

    let selectedSeason: string = "showAbout";
    let selectedSeason_obj: Season | undefined
    let selectedEpisode: string | undefined = "";
    let seasonList:SidebarItem[] = []
    let episodeList: SidebarItem[] = []

    let showId: string = $selected?.slice(5) || ""
    let show = $tv.find( e => e.id == showId )

    $: {
        if ($ready && show) {
            
            seasonList = [
                {
                    text: "About This Show",
                    id: "showAbout",
                    icon: {
                        type: "text",
                        content: `?`
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
            selectedEpisode = undefined
            if (selectedSeason_obj) {
                selectedEpisode = undefined;

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

</script>
<div class="screen" id="screenEmbeddables">
    <Sidebar level={1} width={250} bind:active={selectedSeason} bind:items={seasonList} />

    {#if selectedSeason != "showAbout"}
        <Sidebar level={0} width={250} bind:active={selectedEpisode} bind:items={episodeList} />
    {/if}

    <div class="content">
        {#if selectedSeason != "showAbout"}
            
        {:else}
            
        {/if}
    </div>
</div>