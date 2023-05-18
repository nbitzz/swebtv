<script lang="ts">
    import { onMount, type ComponentType } from "svelte";
    import Sidebar from "./elm/Sidebar.svelte";

    import ScreenHome from "./screens/ScreenHome.svelte";
    import ScreenEmbeddables from "./screens/ScreenEmbeddables.svelte"
    import ScreenPlaceholder from "./screens/ScreenPlaceholder.svelte";
    import { fade } from "svelte/transition";
    import { ready } from "../ts/webtv";
    
    let sb:Sidebar
    let activeSbElem:string|undefined = undefined

    let scrTab: {[key:string]: ComponentType} = {
        "home": ScreenHome,
        "embeddables": ScreenEmbeddables,
        "movies": ScreenPlaceholder,
        "settings": ScreenPlaceholder
    }

    onMount(() => {
        
    })

</script>

<div id="mc">
    {#if $ready}

        <div id="menu" transition:fade={{duration:200}}>
            
            <!-- sidebar -->
            
            <div id="clgrad"></div>
            <Sidebar bind:this={sb} bind:active={activeSbElem} width={250} level={2} items={[
                {
                    id: "movies",
                    text: "Movies",
                    icon: {
                        type: "image",
                        content: "/assets/icons/tv.svg"
                    }
                },
                {
                    id: "embeddables",
                    text: "Embeddables",
                    icon: {
                        type: "image",
                        content: "/assets/icons/embed.svg"
                    }
                },
                {
                    id: "settings",
                    text: "Settings",
                    icon: {
                        type: "image",
                        content: "/assets/icons/settings.svg"
                    }
                }
            ]} />
            
        </div>

        <div id="content">

            <svelte:component this={scrTab[activeSbElem || "home"]} />

        </div>

    {/if}
    
</div>
