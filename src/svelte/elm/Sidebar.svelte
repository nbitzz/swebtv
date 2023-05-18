<script lang="ts">

    import { writable } from "svelte/store";

    interface SidebarItemIcon {
        type: "image" | "text" | "html",
        content: string
    }

    interface SidebarItem {
        id: string,
        text: string,
        icon: SidebarItemIcon,
    }

    export const items: SidebarItem[] = [];

    export let width: number = 200
    export let level: number = 2

    export const active = writable<string>();

</script>

<div class="sidebar" id="sidebar_main" style:--wdth={`${width}px`} style:--level={`var(--sf${level})`}>

    {#each items as item (item.id)}

        <div class="listItem" data-active={item.id == $active ? "true" : "false"}>
            <div class="icon">
                {#if item.icon.type == "image"}
                    <img src={item.icon.content} alt={item.text} />
                {:else if item.icon.type == "text"}
                    <p>{item.icon.content}</p>
                {:else if item.icon.type == "html"}
                    {@html item.icon.content}
                {/if}
            </div>
            <div class="content">
                <p>{item.text}</p>
            </div>
            <button class="hitbox" on:click={() => $active = item.id}></button>
        </div>

    {/each}

</div>