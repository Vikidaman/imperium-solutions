/**
 * Imperium Solutions — Map Basemap Tile Providers
 * OpenStreetMap standard tile provider.
 */

export const MAP_PROVIDERS = {
  osm: {
    id: "osm",
    name: "OpenStreetMap (Standard)",
    shortName: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
    theme: "osm",
  },
};
