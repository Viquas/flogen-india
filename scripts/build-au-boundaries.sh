#!/usr/bin/env bash
#
# Build the Australian suburb (SAL) + postcode (POA) boundary archive used by the
# sales-targeting map (components/sales/discovery-map.tsx).
#
# Output: au-boundaries.pmtiles — a single PMTiles archive served over HTTP range
# requests (Supabase Storage / Vercel Blob). No tile server needed; MapLibre reads
# pmtiles:// natively once the protocol is registered.
#
# Prereqs:
#   - tippecanoe   (brew install tippecanoe)
#   - ogr2ogr/GDAL (brew install gdal) to convert shapefile -> GeoJSON
#   - The ABS ASGS Ed.3 boundary files (CC BY 4.0), downloaded + unzipped:
#       SAL_2021_AUST_GDA2020.shp  (Suburbs & Localities, ~15,350 features)
#       POA_2021_AUST_GDA2020.shp  (Postal Areas, ~2,640 features)
#     https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files
#
# Usage:
#   ./scripts/build-au-boundaries.sh /path/to/abs-shapefiles
#
set -euo pipefail

SRC_DIR="${1:?Usage: build-au-boundaries.sh <dir-with-ABS-shapefiles>}"
OUT="au-boundaries.pmtiles"
WORK="$(mktemp -d)"

echo "→ Converting shapefiles to GeoJSON…"
ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$WORK/suburbs.geojson" "$SRC_DIR/SAL_2021_AUST_GDA2020.shp"
ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$WORK/postcodes.geojson" "$SRC_DIR/POA_2021_AUST_GDA2020.shp"

echo "→ Tiling with tippecanoe (simplify aggressively; polygons are for selection, not survey)…"
# --drop-densest-as-needed + -z12 keeps the archive small (single-digit MB) while
# staying clickable at suburb zoom. Layer names must match the map's source-layer.
tippecanoe -o "$OUT" -f \
  -Z4 -z12 \
  --drop-densest-as-needed \
  --simplification=10 \
  --coalesce-densest-as-needed \
  -L suburbs:"$WORK/suburbs.geojson" \
  -L postcodes:"$WORK/postcodes.geojson"

rm -rf "$WORK"

echo "✓ Built $OUT ($(du -h "$OUT" | cut -f1))"
echo
echo "Next:"
echo "  1. Upload $OUT to Supabase Storage (public bucket) or Vercel Blob."
echo "  2. Set env vars (see .env.example):"
echo "       NEXT_PUBLIC_AU_BOUNDARIES_PMTILES=<public-url-to-$OUT>"
echo "       NEXT_PUBLIC_AU_BOUNDARIES_SOURCE_LAYER=suburbs   # or postcodes"
echo "  3. Redeploy. The discovery map will render clickable suburb boundaries."
