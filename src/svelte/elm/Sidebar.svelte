<script lang="ts">

    interface SidebarItemIcon {
        type: "image" | "text" | "html",
        content: string
    }

    interface SidebarItem {
        id: string,
        text: string,
        icon: SidebarItemIcon,
    }

    export let items:SidebarItem[] = [];

    export let width: number = 200
    export let level: number = 2

</script>

<div class="sidebar" id="sidebar_main" style:--wdth={width} style:--level={`var(--sf${level})`}>

    {#each items as item (item.id)}

    <div class="listItem">
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
    </div>

    <!--
    <div class="listItem">
        <div class="icon">
            <img src="/assets/icons/tv.svg" alt="tv" />
        </div>
        <div class="content">
            <p>Movies</p>
        </div>
    </div>

    <div class="listItem">
        <div class="icon">
            <img src="/assets/icons/embed.svg" alt="embed" />
        </div>
        <div class="content">
            <p>Embeddables</p>
        </div>
    </div>

    <div class="listItem">
        <div class="icon">
            <img src="/assets/icons/settings.svg" alt="settings" />
        </div>
        <div class="content">
            <p>Settings</p>
        </div>
    </div>
    -->

    {/each}

</div>