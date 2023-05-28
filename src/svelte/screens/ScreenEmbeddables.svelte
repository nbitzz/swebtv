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
                    content: $cfg.host + e.icon,
                    circular: true
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
            <div class="embList">
                
                <div class="header">
                    <img src={$cfg.host + idx[activeEl].icon} alt={idx[activeEl].name} on:load={e => e.currentTarget.setAttribute("data-loaded","")} />
                    <div class="txt">
                        <h1>{idx[activeEl].name}</h1>
                        <p>{idx[activeEl].urls.length} url(s)</p>
                    </div>
                </div>

                <div class="otherInfo">
                    {#each idx[activeEl].urls as url (url.url)}
                        <p>
                            <a href={url.url}>{url.url}</a>
                            <br />&nbsp;&nbsp;&nbsp;&nbsp;{url.description}
                        </p>
                    {/each}
                </div>

            </div>
        {:else}
            <div class="nothingSelected">
                <h1>
                    webtv <em>embeddables</em>
                    <span>
                        <br>these links embed in discord; send them to your friends & such
                    </span>
                </h1>
            </div>
        {/if}
    </div>
</div>