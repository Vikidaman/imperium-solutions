/**
 * Imperium Solutions — Map Basemap Tile Providers
 * Authoritative global and regional tile providers supported in interactive cartography.
 */

export const MAP_PROVIDERS = {
  osm: {
    id: "osm",
    name: "OpenStreetMap (Standard)",
    shortName: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
    theme: "osm",
  },
  carto_dark: {
    id: "carto_dark",
    name: "CartoDB Dark Matter",
    shortName: "Dark Matter",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
    theme: "dark",
  },
  esri_satellite: {
    id: "esri_satellite",
    name: "Esri World Satellite",
    shortName: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, USGS, USDA",
    subdomains: "abc",
    maxZoom: 18,
    theme: "satellite",
  },
  carto_voyager: {
    id: "carto_voyager",
    name: "CartoDB Voyager",
    shortName: "Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
    theme: "light",
  },
};

