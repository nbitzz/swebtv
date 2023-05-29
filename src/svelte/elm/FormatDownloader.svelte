<script lang="ts">
    import { cfg, getBestFormat, settings, type Video, type videoFormat, type videoQuality } from "../../ts/webtv";

    export let target: Video

    let selectedFormat: videoFormat = getBestFormat(target, settings.userSet.videoFormat);
    let quality: videoQuality = settings.userSet.videoQuality;
   
</script>

<div class="downloadPicker">

    <select bind:value={selectedFormat}>
        {#each Object.keys(target.formats) as fmt}
            <option>{fmt}</option>
        {/each}
    </select>
    <select bind:value={quality} {...(!selectedFormat ? ["disabled"] : [])}>
        {#each Object.keys(target.formats[selectedFormat]) as qual}
            <option>{qual}</option>
        {/each}
    </select>
    <button {...((!selectedFormat || !quality) ? ["disabled"] : [])} on:click={() => {
        let TMP = document.createElement("a")
        TMP.setAttribute("href", $cfg.host + target.formats[selectedFormat][quality] + "?attachment=1");
        TMP.setAttribute("download",`${target.id}.${selectedFormat}-${quality}`);
        TMP.click();
        TMP.remove();
    }}>Download</button>

</div> 