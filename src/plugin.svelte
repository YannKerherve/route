"""
Splits a master GeoJSON (Windy Navigation Seamarks format, with
properties.display_rules and a mix of Point/LineString/Polygon features)
into 10x10 degree grid tiles, as plain static .geojson files.

These are served over HTTP (e.g. via jsDelivr pointed at your GitHub repo)
and fetched at runtime by the Nav tool Windy plugin — they are NOT bundled
by Rollup. (A previous version of this script generated .ts modules meant
to be dynamically import()-ed; that breaks the Windy plugin build, because
its Rollup config outputs a single dist/plugin.js file and cannot emit the
extra chunks a local `import()` requires. Plain fetch() of a static file
sidesteps the bundler entirely.)

Grid convention:
  - Longitude band (number, 1-36): 10 degree slices starting at 0 deg E,
    going east all the way around the globe.  band = floor(lon_mod360/10)+1
  - Latitude band (letter, A-R): 10 degree slices starting at 90N.
    A = 90N-80N, B = 80N-70N, ... I = 10N-0N, J = 0-10S, ... R = 80S-90S
  - Tile code = "{band}{letter}", e.g. "1A" = 90N-80N / 0E-10E
                                        "3J" = 0S-10S / 20E-30E

Usage:
  python split_tiles.py --in seamarks.geojson --outdir tiles
"""
import argparse
import json
from pathlib import Path
from collections import defaultdict


def lon_band(lon: float) -> int:
    l = ((lon % 360) + 360) % 360
    return int(l // 10) + 1  # 1..36


def lat_band_letter(lat: float) -> str:
    idx = int((90 - lat) // 10)
    idx = max(0, min(17, idx))
    return chr(ord('A') + idx)


def tile_code(lat: float, lon: float) -> str:
    return f"{lon_band(lon)}{lat_band_letter(lat)}"


def representative_point(geom: dict):
    t = geom.get('type')
    if t == 'Point':
        lon, lat = geom['coordinates']
        return lat, lon
    if t == 'LineString':
        coords = geom['coordinates']
        lon, lat = coords[len(coords) // 2]
        return lat, lon
    if t == 'Polygon':
        ring = geom['coordinates'][0]
        lons = [c[0] for c in ring]
        lats = [c[1] for c in ring]
        return sum(lats) / len(lats), sum(lons) / len(lons)
    if t == 'MultiPolygon':
        ring = geom['coordinates'][0][0]
        lons = [c[0] for c in ring]
        lats = [c[1] for c in ring]
        return sum(lats) / len(lats), sum(lons) / len(lons)
    if t == 'MultiLineString':
        line = geom['coordinates'][0]
        lon, lat = line[len(line) // 2]
        return lat, lon
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--in', dest='inp', required=True, help='master GeoJSON file')
    ap.add_argument('--outdir', default='tiles', help='output folder for the .geojson tiles')
    ap.add_argument('--clean', action='store_true',
                     help='delete .geojson files in --outdir that this run did not (re)write '
                          '(use when a region loses all its data between exports)')
    args = ap.parse_args()

    data = json.loads(Path(args.inp).read_text(encoding='utf-8'))
    display_rules = data.get('properties', {}).get('display_rules', {})

    buckets = defaultdict(list)
    skipped = 0
    for f in data.get('features', []):
        geom = f.get('geometry')
        if not geom:
            skipped += 1
            continue
        rp = representative_point(geom)
        if rp is None:
            skipped += 1
            continue
        lat, lon = rp
        buckets[tile_code(lat, lon)].append(f)

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    written = set()
    for code, feats in sorted(buckets.items()):
        fc = {
            "type": "FeatureCollection",
            "properties": {"display_rules": display_rules},
            "features": feats,
        }
        out_path = outdir / f"{code}.geojson"
        out_path.write_text(json.dumps(fc, ensure_ascii=False), encoding='utf-8')
        written.add(out_path.name)

    if args.clean:
        removed = 0
        for existing in outdir.glob('*.geojson'):
            if existing.name not in written:
                existing.unlink()
                removed += 1
        if removed:
            print(f"Removed {removed} stale tile(s) no longer present in this export")

    print(f"Generated {len(buckets)} tile(s) into {outdir}/")
    print(f"Skipped {skipped} feature(s) without usable geometry\n")
    for code in sorted(buckets):
        print(f"  {code}: {len(buckets[code])} features")


if __name__ == '__main__':
    main()
