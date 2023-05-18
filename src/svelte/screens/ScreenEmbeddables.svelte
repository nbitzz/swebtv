<script lang="ts">
    import Sidebar, { type SidebarItem } from "../elm/Sidebar.svelte";
    import { cfg, embeddables, type Embeddable } from "../../ts/webtv";

    let activeEl: string | undefined = undefined;
    let sbItems:SidebarItem[] = []
    let idx: {[key:string]:Embeddable} = {}

    $: {
        sbItems = $embeddables.map((e) => {
            return {
                id: e.name,
                text: e.name,
                icon: {
                    type: "image",
                    content: $cfg.host + e.icon
                }
            }
        })

        $embeddables.forEach((v) => {
            idx[v.name] = v
        })
    }

</script>
<div class="screen" id="screenEmbeddables">
    <Sidebar level={1} width={250} bind:active={activeEl} bind:items={sbItems} />

    <div class="content">
        {#if activeEl}
            {#each idx[activeEl].urls as url (url.url)}
                <p class="u">
                    <a href={url.url}>{url.url}</a>
                    [ {url.description} ]
                </p>
            {/each}
        {:else}
            <div class="nothingSelected">
                <h1>
                    embeddables
                    <span>
                        <br>these links embed in discord; send them to your friends & such
                        <br>try selecting something!
                    </span>
                </h1>
            </div>
        {/if}
    </div>
</div>