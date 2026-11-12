# Films

One folder per film, named after it (lowercase, dashes, no spaces), e.g. `red-and-white`.

```
film/films/
  red-and-white/
    source/        <- your originals: the master file and raw stills.
                      Git ignores this folder, so it never gets uploaded.
    stills/
      01.jpg       <- web copies, numbered in the order they show
      02.jpg
    film.mp4       <- web copy of the film (under 100 MB)
```

Drop the master and the stills (any names, any format) into a new film's
`source/` folder and tell Claude the title, year and your role. Claude makes
the web copies and adds the film to the page.

Why web copies: GitHub refuses files over 100 MB, and visitors would wait
forever on a 4K master. The web film is 1080p at about 2.5 Mbps.
