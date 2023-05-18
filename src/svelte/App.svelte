<script lang="ts">
    import { onMount } from "svelte";
    import Sidebar from "./elm/Sidebar.svelte";

    onMount(() => {
        console.log("mounted")
    })
    
    let sb:Sidebar

</script>

<div id="mc">
    <div id="menu">
        
        <!-- sidebar -->
        
        <div id="clgrad"></div>
        <Sidebar bind:this={sb} width={250} level={2} items={[
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

        <div class="screen" id="screenHome">
            <h1>
                webtv
                <span>
                    <br>simple and sweet. let's get started. {sb ? `${sb.active}` : "notfound"}
                </span>
            </h1>
        </div>

    </div>
    
</div>
