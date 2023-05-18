# swebtv

## File layouts

movie.json should be `Movie[]`.
tv.json should be `Show[]`.

Quality should use the following scale:

- **best**
    - Size should top out at 750MiB for movies and 300MiB for episodes
    - Usually, 320kbps audio and 8mbps video re-encoded under h265 will work:
    - `ffmpeg -i input.mp4 -b:a 320k -b:v 8m -vcodec libx265 best.mp4`
- **great**
    - 1080p, slightly lower bitrate
    - `ffmpeg -i input.mp4 -b:a 280k -b:v 7m -vcodec libx265 great.mp4`
- **prettygood**
    - 720p, lower bitrate
    - `ffmpeg -i input.mp4 -b:a 240k -b:v 6m -vcodec libx265 -vf scale=-1:720 good.mp4`
- **good**
    - 720p
    - `ffmpeg -i input.mp4 -b:a 200k -b:v 4m -vcodec libx265 -vf scale=-1:720 good.mp4`
- **ok**
    - 480p
    - `ffmpeg -i input.mp4 -b:a 160k -b:v 2m -vcodec libx265 -vf scale=-1:480 ok.mp4`
- **oatmeal**
    - 480p, very low bitrate
    - `ffmpeg -i input.mp4 -b:a 120k -b:v 500k -vcodec libx265 -vf scale=-1:480 ok.mp4`

## Data structures

### `Movie`

```js
{
    "name": "Name here",
    "description": "Optional description",
    "notes": "Notes here, if need be",
    "icon": "example.png",
    
    "formats": {
        "main": {
            "great": "fileId"
            "best": "fileId"
        }
    }
}
```

### `Show`

```js
{
    name: "Name here",
    description: "Optional description",
    notes: "Notes here, if need be",
    icon: "spg.png",

    seasons: Season[]
}
```

### `Season`

```js
{
    name: "Optional name. If none is specified, 'Season 1', etc will be used in place.",

    episodes: Episode[]
}
```

### `Episode`

```js
{
    name: "Name here",
    description: "Optional description",

    "formats": {
        "main": {
            "great": "fileId"
            "best": "fileId"
        },

        // hardsub and dub are optional
        // user should be able to set their preferred track
        // to either main, hardsub, or dub
        // if dub is unavailable, use hardsub; if hardsub is unavailable, use main
        "hardsub": {
            "great": "fileId"
            "best": "fileId"
        },
        "dub": {
            "great": "fileId"
            "best": "fileId"
        }
    }
}
```