<script lang="ts">
    import { onMount } from "svelte";
    import Sidebar from "./elm/Sidebar.svelte";

    onMount(() => {
        console.log("mounted")
    })
    
</script>

<div id="mc">
    <div id="menu">
        
        <!-- sidebar -->
        
        <div id="clgrad"></div>
        <Sidebar width={250} level={2} items={[
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
                    content: "/assets/icons/embeddables.svg"
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
                    <br>simple and sweet. let's get started.
                </span>
            </h1>
        </div>

    </div>
    
</div>
