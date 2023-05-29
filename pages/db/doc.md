# swebtv

## File layouts

movie.json should be `Movie[]`.
tv.json should be `Show[]`.

Quality should use the following scale:

- **best**
    - Size should top out at 750MiB for movies and 300MiB for episodes
    - this would probably be good enough lawl:
    - `ffmpeg -i input.mp4 -b:a 320k -b:v 8m -vcodec vp9 best.webm`
- **good**
    - 720p
    - `ffmpeg -i input.mp4 -b:a 240k -b:v 6m -vcodec vp9 -vf scale=-1:720 good.webm`
- **okay**
    - 468p
    - go fuck yourself
    - `ffmpeg -i input.mp4 -b:a 160k -b:v 2m -vcodec vp9 -vf scale=-1:468 okay.webm`
- **h264compat**
    - 468p
    - should not be used on anything other than mobi
    - `ffmpeg -i input.mp4 -b:a 160k -b:v 1.5m -vcodec libx264 -vf scale=-1:468 h264compat.mp4`

Oh also it might be a better idea to support ~~ASS~~ Advanced SubStation Alpha Subtitle Files. natively so

## Data structures

God are these outdated. lmao GG IG !!

### `Movie`

```js
{
    "name": "Name here",
    "description": "Optional description",
    "notes": "Notes here, if need be",
    "icon": "example.png",
    "poster": "poster.png",
    
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
    "poster": "poster.png",

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