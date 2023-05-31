<script lang="ts">
    import { fade } from "svelte/transition";
    import { colonTime } from "../../ts/util";
    import { getBestFormat, type Video, cfg, type videoFormat, settings, type videoQuality, isVideo, isEpisode } from "../../ts/webtv";

    export let playing: Video
    
    let format: videoFormat = getBestFormat( playing, settings.userSet.videoFormat )
    let quality: videoQuality = settings.userSet.videoQuality

    let fqp: {format: videoFormat, quality: videoQuality, prg_hold: number|undefined, WFL: boolean} = { // use for the format/quality picker - holds tmp stuf
        format, quality,
        prg_hold : undefined,
        WFL: false
    }

    let duration: number
    let progress: number
    let isPaused: boolean = true

    let vplayer: HTMLDivElement
    let seekbar: HTMLDivElement
    let videoReadyState: number
    let showFQPicker = false

    let draggingSeekBar = false

    let lastMouseInteraction = 0

    let showControls = false
    let sCTimeout: number
    
    let time_tmp: number
    let old_state = true;

    let inFullscreen = false;

    function seekUpdate(e:MouseEvent) {
        if (!duration || !draggingSeekBar) return
        let rect = seekbar.getBoundingClientRect()
        let ler = (e.clientX-rect.left)/rect.width

        time_tmp = duration*Math.min(Math.max(ler,0),1)
    }

    function handleActivity() {
        showControls = true;
        if (sCTimeout) clearTimeout(sCTimeout);
        sCTimeout = setTimeout(() => {
            showControls = false;
            showFQPicker = false;
        },2500)
    }

    function startSeeking(e:MouseEvent) {
        draggingSeekBar=true;
        old_state=isPaused;
        isPaused=true;
        time_tmp=progress;
        seekUpdate(e)
    }

    function stopSeeking() {
        if (!draggingSeekBar) return;
        draggingSeekBar=false;
        progress=time_tmp;
        isPaused=old_state;
        old_state=false;
    }

    function handleKeypress(e: KeyboardEvent) {
        switch(e.code) {
            case "Space":
                isPaused = !isPaused
                handleActivity()
                e.preventDefault();
                break
            case "ArrowRight":
                progress = Math.min(Math.max(progress+5,0),duration)
                break;
            case "ArrowLeft":
                progress = Math.min(Math.max(progress-5,0),duration)
                break;
            case "KeyF":
                if (document.fullscreenElement != vplayer) vplayer.requestFullscreen(); 
                else document.exitFullscreen()
                break;
        }
    }

    // this is probably horrible for performance. Too bad!
    // if anyone knows how to make this better pls lmk
    $: if (isEpisode(playing) && (settings.userSet.autoskipintro || settings.userSet.autoskipoutro)) {
        if (
            playing.intro 
            && progress > playing.intro[0] 
            && progress < playing.intro[1]
            && settings.userSet.autoskipintro
        ) progress = playing.intro[1]
        else if (
            playing.outro 
            && progress > playing.outro[0] 
            && progress < (playing.outro[1]||duration)
            && settings.userSet.autoskipoutro
        ) progress = playing.outro[1]||duration
    }

    // this is nightmarish please help

    function loadHandler() {
        if (fqp.prg_hold && videoReadyState > 0) {
            progress = fqp.prg_hold
            isPaused = fqp.WFL
            delete fqp.prg_hold;
        }
    }

    $: if (fqp.quality != quality || fqp.format != format) {

        fqp.prg_hold = progress;
        fqp.WFL = isPaused;
        isPaused = true;
        quality = fqp.quality;
        format = fqp.format;

    }

</script>

<svelte:document on:keydown={handleKeypress} />

<div class="videoPlayer" 
    bind:this={vplayer} 
    on:mousemove={handleActivity} 
    on:mouseleave={()=>{showControls=false; showFQPicker = false;if (sCTimeout) clearTimeout(sCTimeout)}} 
    style:aspect-ratio={playing.aspectRatio || "16 / 9"}
    on:fullscreenchange={() => inFullscreen = document.fullscreenElement == vplayer}
>

    <div class="vbking">
        <h1>webtv</h1>
    </div>

    <!-- sorta unneeded due to the hardsub track -->
    <!-- no i am not writing an ASS implementation -->
    <!-- fuck you -->
    <!-- svelte-ignore a11y-media-has-caption -->
    <video 
        poster={playing.thumbnail && $cfg.host + playing.thumbnail || ""} 
        src={$cfg.host + playing.formats[format][quality]} bind:readyState={videoReadyState} 
        bind:paused={isPaused} bind:currentTime={progress} 
        bind:duration={duration}

        on:click={() => { isPaused = !isPaused; showFQPicker = false; }}
        on:loadeddata={loadHandler}
        style:cursor={(showControls) ? "default" : "none"}
    />

    {#if videoReadyState < 2}
        <!-- makes it possible to click to pause/unpause while buffering... i think -->
        <!-- svelte-ignore a11y-click-events-have-key-events --> 
        <div class="loadingOverlay" transition:fade|local={{duration:200}} on:click={() => isPaused = !isPaused}>
            <div class="loadingSpinner" />
        </div>
    {/if}
    
    <!-- probably a better way to do this; too lazy to find it -->
    {#if isEpisode(playing) && settings.userSet.skipbutton}
        {#if playing.intro && progress >= playing.intro[0] && progress < playing.intro[1]}
            <!-- have yto do this cause svelte -->
            <button 
                transition:fade={{duration:200}} 
                class="skipButton" 
                on:click={() => progress = (isEpisode(playing) && playing.intro ? playing.intro : [0,0])[1]}
            >
                Skip intro
            </button>
        {/if}

        {#if playing.outro && progress >= playing.outro[0] && progress < (playing.outro[1]||duration)}
            <button 
                transition:fade={{duration:200}} 
                class="skipButton" 
                on:click={() => progress = (isEpisode(playing) && playing.outro ? playing.outro : [])[1] || duration}
            >
                Skip outro
            </button>
        {/if}
    {/if}

    {#if showControls}
        <!-- so that you don't need to stay within a 10 px range -->
        <div class="controls" 
            transition:fade|local={{duration: 200}}
            on:mousemove={seekUpdate} 
            on:mouseup={stopSeeking}
            on:mouseleave={stopSeeking}
        >

            <button on:click={() => isPaused = !isPaused }>
                <img src={ 
                    isPaused
                    ? "/assets/icons/player/play.svg" 
                    : "/assets/icons/player/pause.svg" 
                } alt="Play/pause content" />
            </button>

            <div class="seekbar" 
                bind:this={seekbar} 
                on:mousedown={startSeeking} 
            >
                <div class="progress" style:width={`${((draggingSeekBar ? time_tmp : (progress || 0))/duration || -1) * 100}%`} />
            </div>

            <div class="timeDenotation">
                <p>{colonTime(draggingSeekBar ? time_tmp : (progress || fqp.prg_hold || 0))} <span>/ {colonTime(duration || playing.length)}</span></p>
            </div>

            <button on:click={() => {if (document.fullscreenElement != vplayer) vplayer.requestFullscreen(); else document.exitFullscreen() }}>
                <img src={ 
                    inFullscreen
                    ? "/assets/icons/player/fullscreenExit.svg" 
                    : "/assets/icons/player/fullscreen.svg" 
                } alt="Toggle fullscreen" />
            </button>

            <button on:click={() => showFQPicker = !showFQPicker}><img src="/assets/icons/player/options.svg" alt="More options" /></button>

            {#if showFQPicker}
                <div class="fqpicker" transition:fade={{duration: 200}}>
                    <select bind:value={fqp.format}>
                        {#each Object.keys(playing.formats) as fmt}
                            <option>{fmt}</option>
                        {/each}
                    </select>
                    <select bind:value={fqp.quality}>
                        {#each Object.keys(playing.formats[format]) as qual}
                            <option>{qual}</option>
                        {/each}
                    </select>
                </div>
            {/if}
        </div>
    {/if}

</div> 