# OpenJSCAD.org in docker

Starts a webserver to serve openjscad on http://localhost:4000/index.html

Converts SVG to JSCAD via /input /output folder. Watches for changes in /input folder.

## Running it

```
docker run -it --rm \
           -v `pwd`/input:/input \
           -v `pwd`/output:/output \
           -p 4000:4000 \
           modig/openjscad
```

Or via repo:

`make`
