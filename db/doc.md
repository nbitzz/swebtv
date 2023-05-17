# swebtv

## File layouts

movie.json should be `Movie[]`.
tv.json should be `Show[]`.

## Data structures

### `Movie`

```js
{
    name: "Name here",
    description: "Optional description",
    notes: "Notes here, if need be",
    icon: "example.png",
    
    files: {
        "hd720": "example720.mp4",
        "hd1080": "example1080.mp4",
        // etc...
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
    
    files: {
        "hd720": "example720.mp4",
        "hd1080": "example1080.mp4",
        // etc...
    }
}
```