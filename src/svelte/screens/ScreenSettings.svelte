<script lang="ts">
    import Sidebar, { type SidebarItem } from "../elm/Sidebar.svelte";
    import { cfg, embeddables, type Embeddable, settings } from "../../ts/webtv";
    import { children } from "svelte/internal";

    let activeEl: string | undefined = "Video";
    let currentCategory: settings.SettingsCategory = settings.suiLinks.find( e => e.name == activeEl ) || {name:"?",icon:"/assets/icons/question.svg",children:[]}

    // sync menu is todo

    $: currentCategory = settings.suiLinks.find( e => e.name == activeEl ) || currentCategory

</script>
<div class="screen" id="screenSettings">
    <Sidebar level={1} width={250} bind:active={activeEl} items={settings.suiLinks.map((v) => {
        return {
            text: v.name,
            id: v.name,
            icon: {
                type: "image",
                content: v.icon
            }
        }
    })} />

    <div class="content">
        
        <div class="stUI"> 
            
            <div class="topic">
                <img src={currentCategory.icon} alt={currentCategory.name} />
                <h1>{currentCategory.name}</h1>
            </div>

            <div class="settingsList">
                {#each currentCategory.children as item (item.targetSetting)}
                    <div class="settingsItem">
                        <p>{item.label}</p>

                        <!-- TODO: probably clean up this mess lmao -->
                        
                        {#if item.input == "boolean"}
                            <input class="inp" type="checkbox" checked={!!settings.userSet[item.targetSetting]} on:change={ (e) => settings.set(item.targetSetting, e.currentTarget.checked) } />
                        {:else if item.input == "string"}
                            <input class="inp" type="input" value={settings.userSet[item.targetSetting]} on:change={ (e) => settings.set(item.targetSetting, e.currentTarget.value) } />
                        {:else if item.input == "number"}
                            <input class="inp" type="number" value={settings.userSet[item.targetSetting]} on:change={ (e) => settings.set(item.targetSetting,e.currentTarget.valueAsNumber) }>
                        {:else if typeof item.input == "object"}

                            <select class="inp" value={settings.userSet[item.targetSetting]} on:change={ (e) => settings.set(item.targetSetting, e.currentTarget.value) }>
                                {#each item.input as s (s)}
                                    <option>{s}</option>
                                {/each}
                            </select>
                        
                        {/if}
                    </div>
                {/each}
            </div>

        </div>
        
    </div>
</div>