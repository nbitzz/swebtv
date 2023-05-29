<script lang="ts">
    import { getBestFormat, type Video, cfg, type videoFormat, settings, type videoQuality } from "../../ts/webtv";

    export let playing: Video
    
    let format: videoFormat = getBestFormat( playing, settings.userSet.videoFormat )
    let quality: videoQuality = settings.userSet.videoQuality


    let duration: number
    let progress: number
    let isPaused: boolean

    let vplayer: HTMLDivElement

</script>

<div class="videoPlayer" bind:this={vplayer}>

    <!-- sorta unneeded due to the hardsub track -->
    <!-- no i am not writing an ASS implementation -->
    <!-- fuck you -->
    <!-- svelte-ignore a11y-media-has-caption -->
    <video src={$cfg.host + playing.formats[format][quality]} bind:paused={isPaused} bind:currentTime={progress} bind:duration={duration}/>

    <div class="controls">
        <button on:click={() => isPaused = !isPaused }>Play/Pause</button>
        <progress value={(progress / duration) || -1}/>
        <button on:click={() => vplayer.requestFullscreen()}>Fullscreen</button>
        <button>Quality & Format</button>
    </div>

</div> 