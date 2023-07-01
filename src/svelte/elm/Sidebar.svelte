<script lang="ts" context="module">
    export interface SidebarItemIcon {
        type: "image" | "text" | "html",
        content: string,
        circular?: boolean
    }

    export interface SidebarItem {
        id: string,
        text: string,
        icon: SidebarItemIcon,
        title?: string
        note?: string
    }
</script>
<script lang="ts">

    import { settings } from "../../ts/webtv";

    export let items: SidebarItem[] = [];

    export let width: number = 200
    export let level: number = 2
    export let dft:string|undefined = undefined

    export let active = dft
    //export const active = writable<string>(dft);

</script>

<div class="sidebar" id="sidebar_main" style:--wdth={`${width}px`} style:--level={`var(--sf${level})`}>

    {#each items as item (item.id)}

        <div class="listItem" data-active={item.id == active ? "true" : "false"}>
            <div class="icon" data-circular={item.icon.circular}>
                {#if item.icon.type == "image"}
                    <div class="icontainer">
                        <img src={item.icon.content} alt={item.text} on:load={(e) => e.currentTarget.setAttribute("data-loaded","")} />
                    </div>
                {:else if item.icon.type == "text"}
                    <p>{item.icon.content}</p>
                {:else if item.icon.type == "html"}
                    {@html item.icon.content}
                {/if}
            </div>
            <div class="content">
                {#if item.title} 
                    <p class="note">{item.title}</p>
                {/if}

                <p>{item.text}</p>

                <!-- have to do this otherwise svt errors; just a workaround for a bug -->
                {#if item.note||settings.userSet.developerMode} 
                    <p class="note">{item.note||""}{@html item.note && settings.userSet.developerMode ? "<br>" : ""}{settings.userSet.developerMode ? item.id : ""}</p>
                {/if}
            </div>
            <button class="hitbox" on:click={() => active = item.id}></button>
        </div>

    {/each}

</div>