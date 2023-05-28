<script lang="ts">
    import Sidebar, { type SidebarItem } from "../elm/Sidebar.svelte";
    import { cfg, ready, movies, type Movie, settings } from "../../ts/webtv";
    import { selected } from "../../ts/stores";
    import VideoView from "../elm/VideoView.svelte";

    let selectedId : string | undefined
    let selectedMovie: Movie | undefined
    let movieList:SidebarItem[] = []

    $: {
        if ($ready) {    
            movieList = $movies.map((v,x):SidebarItem => {
                return {
                    text: v.name,
                    id: v.id,
                    icon: {
                        type: "image",
                        circular: true,
                        content: $cfg.host + v.icon
                    }
                }
            })
        }
    }

    $: {
        if ($ready && selectedId) {
            selectedMovie = $movies.find(e => e.id == selectedId)
        } else { selectedMovie = undefined; }
    }

</script>
<div class="screen" id="screenShow">
    <Sidebar level={1} width={250} bind:active={selectedId} bind:items={movieList} />

    <div class="content">
        {#if selectedMovie && selectedId}

            {#key selectedMovie}
                <VideoView targetVideo={selectedMovie} />
            {/key}
        
        {:else}

            <div class="nothingSelected">
                <h1>
                    webtv <em>movies</em>
                    <span>
                        <br>what would you like to watch?
                    </span>
                </h1>
            </div>

        {/if}
    </div>
</div>