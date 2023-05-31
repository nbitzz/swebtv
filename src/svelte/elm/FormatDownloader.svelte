<script lang="ts">
    import { cfg, getBestFormat, settings, type Video, type videoFormat, type videoQuality } from "../../ts/webtv";

    export let target: Video

    let selectedFormat: videoFormat = getBestFormat(target, settings.userSet.videoFormat);
    let quality: videoQuality = settings.userSet.videoQuality;
   
</script>

<div class="downloadPicker">

    <div class="left">
        <select bind:value={selectedFormat} class="fPicker">
            {#each Object.keys(target.formats) as fmt}
                <option>{fmt}</option>
            {/each}
        </select>
        <span class="qPicker"> / </span>
        <select bind:value={quality} class="qPicker">
            {#each Object.keys(target.formats[selectedFormat]) as qual}
                <option>{qual}</option>
            {/each}
        </select>
    </div>
    <button {...((!selectedFormat || !quality) ? ["disabled"] : [])} on:click={() => {
        let TMP = document.createElement("a")
        TMP.setAttribute("href", $cfg.host + target.formats[selectedFormat][quality] + "?attachment=1");
        TMP.setAttribute("download",`${target.id}.${selectedFormat}-${quality}`);
        TMP.click();
        TMP.remove();
    }}>
        <img src="/assets/icons/download.svg" alt="Download" />
    </button>

</div> 