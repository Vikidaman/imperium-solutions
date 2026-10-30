#!/usr/bin/env python3
"""
Global ADM1 Administrative Boundaries Ingestion Script
Fetches, normalizes, validates, and optimizes first-level administrative boundaries
(states, provinces, regions, governorates, prefectures) from geoBoundaries gbOpen.
"""

import json
import os
import sys
import time
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "public" / "data" / "boundaries" / "adm1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MANIFEST_PATH = BASE_DIR / "public" / "data" / "boundaries" / "manifest.json"

# Sovereign nations catalog with primary ISO-3 codes
COUNTRIES_TO_INGEST = [
    {"iso3": "COD", "name": "Democratic Republic of the Congo", "planet": "Earth"},
    {"iso3": "USA", "name": "United States of America", "planet": "Earth"},
    {"iso3": "GBR", "name": "United Kingdom", "planet": "Earth"},
    {"iso3": "FRA", "name": "France", "planet": "Earth"},
    {"iso3": "DEU", "name": "Germany", "planet": "Earth"},
    {"iso3": "JPN", "name": "Japan", "planet": "Earth"},
    {"iso3": "CHN", "name": "China", "planet": "Earth"},
    {"iso3": "IND", "name": "India", "planet": "Earth"},
    {"iso3": "BRA", "name": "Brazil", "planet": "Earth"},
    {"iso3": "CAN", "name": "Canada", "planet": "Earth"},
    {"iso3": "AUS", "name": "Australia", "planet": "Earth"},
    {"iso3": "RUS", "name": "Russia", "planet": "Earth"},
    {"iso3": "ZAF", "name": "South Africa", "planet": "Earth"},
    {"iso3": "IDN", "name": "Indonesia", "planet": "Earth"},
    {"iso3": "SGP", "name": "Singapore", "planet": "Earth"},
    {"iso3": "ITA", "name": "Italy", "planet": "Earth"},
    {"iso3": "ESP", "name": "Spain", "planet": "Earth"},
    {"iso3": "MEX", "name": "Mexico", "planet": "Earth"},
    {"iso3": "KOR", "name": "South Korea", "planet": "Earth"},
    {"iso3": "SAU", "name": "Saudi Arabia", "planet": "Earth"},
    {"iso3": "TUR", "name": "Turkey", "planet": "Earth"},
    {"iso3": "NGA", "name": "Nigeria", "planet": "Earth"},
    {"iso3": "ARG", "name": "Argentina", "planet": "Earth"},
    {"iso3": "EGY", "name": "Egypt", "planet": "Earth"},
    {"iso3": "KEN", "name": "Kenya", "planet": "Earth"},
    {"iso3": "NLD", "name": "Netherlands", "planet": "Earth"},
    {"iso3": "SWE", "name": "Sweden", "planet": "Earth"},
    {"iso3": "CHE", "name": "Switzerland", "planet": "Earth"},
    {"iso3": "POL", "name": "Poland", "planet": "Earth"},
]

def round_coords(coords, precision=4):
    """Recursively rounds coordinates to reduce payload size while preserving boundary fidelity."""
    if isinstance(coords, (list, tuple)):
        if len(coords) == 2 and isinstance(coords[0], (int, float)) and isinstance(coords[1], (int, float)):
            return [round(coords[0], precision), round(coords[1], precision)]
        return [round_coords(item, precision) for item in coords]
    return coords

def fetch_country_adm1(iso3, country_name):
    print(f"\nProcessing {iso3} - {country_name}...")
    api_url = f"https://www.geoboundaries.org/api/current/gbOpen/{iso3}/ADM1/"
    headers = {"User-Agent": "ImperiumSimulator/2.0 (Geospatial Research)"}

    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as response:
            meta = json.loads(response.read().decode("utf-8"))

        geo_url = meta.get("simplifiedGeometryGeoJSON") or meta.get("gjDownloadURL")
        if not geo_url:
            print(f"  [WARN] No GeoJSON URL returned for {iso3}")
            return None

        # Download simplified GeoJSON
        req_geo = urllib.request.Request(geo_url, headers=headers)
        with urllib.request.urlopen(req_geo, timeout=20) as resp_geo:
            raw_geojson = json.loads(resp_geo.read().decode("utf-8"))

        features = raw_geojson.get("features", [])
        print(f"  Downloaded {len(features)} ADM1 features from geoBoundaries.")

        normalized_features = []
        for i, feat in enumerate(features):
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            name = props.get("shapeName") or props.get("NAME_1") or props.get("ADM1_NAME") or f"Region {i+1}"
            iso = props.get("shapeISO") or props.get("ISO_1") or props.get("HASC_1") or f"{iso3}-{i+1}"
            shape_type = props.get("shapeType") or "ADM1"

            # Clean and round coordinates
            if geom and "coordinates" in geom:
                geom["coordinates"] = round_coords(geom["coordinates"], precision=4)

            normalized_features.append({
                "type": "Feature",
                "id": f"{iso3}_{i+1}",
                "properties": {
                    "id": f"{iso3}_{i+1}",
                    "name": name.strip(),
                    "iso": iso.strip() if isinstance(iso, str) else str(iso),
                    "type": shape_type,
                    "countryIso3": iso3,
                    "countryName": country_name,
                },
                "geometry": geom,
            })

        output_payload = {
            "type": "FeatureCollection",
            "countryIso3": iso3,
            "countryName": country_name,
            "boundaryType": "ADM1",
            "source": "geoBoundaries gbOpen (CC-BY 4.0)",
            "license": "CC-BY 4.0",
            "boundaryDate": meta.get("boundaryYearRepresented") or "2024",
            "featureCount": len(normalized_features),
            "features": normalized_features,
        }

        output_file = OUTPUT_DIR / f"{iso3}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output_payload, f, separators=(",", ":"))

        size_kb = output_file.stat().st_size / 1024
        print(f"  Saved {output_file.name} ({size_kb:.1f} KB, {len(normalized_features)} subdivisions)")

        return {
            "iso3": iso3,
            "name": country_name,
            "featureCount": len(normalized_features),
            "source": "geoBoundaries gbOpen",
            "license": "CC-BY 4.0",
            "boundaryDate": meta.get("boundaryYearRepresented") or "2024",
            "file": f"/data/boundaries/adm1/{iso3}.json",
            "sizeKb": round(size_kb, 1),
            "status": "AVAILABLE",
        }

    except Exception as e:
        print(f"  [ERROR] Failed to ingest {iso3}: {e}")
        return {
            "iso3": iso3,
            "name": country_name,
            "status": "FAILED",
            "error": str(e),
        }

def main():
    manifest_entries = {}
    success_count = 0

    print("=== Starting Global ADM1 Boundaries Ingestion ===")
    for c in COUNTRIES_TO_INGEST:
        res = fetch_country_adm1(c["iso3"], c["name"])
        if res and res.get("status") == "AVAILABLE":
            manifest_entries[c["iso3"]] = res
            success_count += 1
        else:
            manifest_entries[c["iso3"]] = res or {"iso3": c["iso3"], "status": "UNAVAILABLE"}
        # Courteous pacing for geoBoundaries servers
        time.sleep(0.3)

    manifest = {
        "version": "1.0.0",
        "description": "Global First-Level Administrative Boundaries (ADM1) Catalog for Imperium Solutions",
        "provider": "geoBoundaries gbOpen (William & Mary GeoLab)",
        "license": "CC-BY 4.0",
        "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalCountries": len(COUNTRIES_TO_INGEST),
        "availableCountries": success_count,
        "countries": manifest_entries,
    }

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n=== Ingestion Complete! Manifest written to: {MANIFEST_PATH} ===")
    print(f"Successfully processed {success_count} / {len(COUNTRIES_TO_INGEST)} countries.")

if __name__ == "__main__":
    main()

