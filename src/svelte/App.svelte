<script lang="ts">
    import { onMount, type ComponentType } from "svelte";
    import Sidebar, { type SidebarItem } from "./elm/Sidebar.svelte";

    import ScreenHome from "./screens/ScreenHome.svelte";
    import ScreenEmbeddables from "./screens/ScreenEmbeddables.svelte"
    import ScreenPlaceholder from "./screens/ScreenPlaceholder.svelte";
    import { fade } from "svelte/transition";
    import { cfg, ready, tv } from "../ts/webtv";
    import { selected } from "../ts/stores";
    import ScreenShow from "./screens/ScreenShow.svelte";
    
    let sb:Sidebar
    let activeSbElem:string|undefined = undefined

    let scrTab: {[key:string]: ComponentType} = {
        "home": ScreenHome,
        "embeddables": ScreenEmbeddables,
        "movies": ScreenPlaceholder,
        "settings": ScreenPlaceholder
    }

    let sbItems:SidebarItem[] = []

    let menuItems:SidebarItem[] = [
                {
                    id: "scr:settings",
                    text: "Settings",
                    icon: {
                        type: "image",
                        content: "/assets/icons/settings.svg"
                    }
                },
                {
                    id: "scr:movies",
                    text: "Movies",
                    icon: {
                        type: "image",
                        content: "/assets/icons/tv.svg"
                    }
                },
                {
                    id: "scr:embeddables",
                    text: "Embeddables",
                    icon: {
                        type: "image",
                        content: "/assets/icons/embed.svg"
                    }
                }
            ]

    $: {
        if ($ready) {
            sbItems = [
                ...menuItems,
                ...$tv.map((show):SidebarItem => {
                        return {
                            text: show.name,
                            id: `show:${show.id}`,
                            icon: {
                                type:"image",
                                content: $cfg.host + show.icon,
                                circular: true
                            }
                        } 
                })
            ]
        }
    }

    $: $selected = activeSbElem

    onMount(() => {
        
    })

</script>

<div id="mc">
    {#if $ready}

        <div id="menu" transition:fade={{duration:200}}>
            
            <!-- sidebar -->
            
            <div id="clgrad"></div>
            <Sidebar bind:this={sb} bind:active={activeSbElem} width={250} level={2} items={sbItems} />
            
        </div>

        <div id="content">

            {#key activeSbElem}
                <svelte:component this={(activeSbElem || "scr:home").startsWith("scr:") ? scrTab[(activeSbElem || "scr:home").slice(4)] : ScreenShow} />
            {/key}
        </div>

    {/if}
    
</div>
