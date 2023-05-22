<script lang="ts">
    import Sidebar, { type SidebarItem } from "../elm/Sidebar.svelte";
    import { cfg, embeddables, type Embeddable } from "../../ts/webtv";

    let activeEl: string | undefined = "video";

</script>
<div class="screen" id="screenEmbeddables">
    <Sidebar level={1} width={250} bind:active={activeEl} items={[
        {
            text: "Video",
            id: "video",
            icon: {
                type: "image",
                content: "/assets/icons/video.svg"
            }
        },
        {
            text: "Player",
            id: "player",
            icon: {
                type: "image",
                content: "/assets/icons/player.svg"
            }
        },
        {
            text: "Sync",
            id: "sync",
            icon: {
                type: "image",
                content: "/assets/icons/sync.svg"
            }
        }
    ]} />

    <div class="content">
        
        
    </div>
</div>