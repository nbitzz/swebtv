<script lang="ts" context="module">
    export interface SidebarItemIcon {
        type: "image" | "text" | "html",
        content: string
    }

    export interface SidebarItem {
        id: string,
        text: string,
        icon: SidebarItemIcon,
    }
</script>
<script lang="ts">

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
            <div class="icon">
                {#if item.icon.type == "image"}
                    <img src={item.icon.content} alt={item.text} on:load={(e) => e.currentTarget.setAttribute("data-loaded","")} />
                {:else if item.icon.type == "text"}
                    <p>{item.icon.content}</p>
                {:else if item.icon.type == "html"}
                    {@html item.icon.content}
                {/if}
            </div>
            <div class="content">
                <p>{item.text}</p>
            </div>
            <button class="hitbox" on:click={() => active = item.id}></button>
        </div>

    {/each}

</div>