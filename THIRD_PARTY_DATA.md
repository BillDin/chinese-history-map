# Third-party data and services

The Apache License 2.0 in this repository covers only the original software in this repository. It does not cover any historical data, map data, map tiles, styles, fonts, or other resources retrieved from third parties.

## CHGIS

Historical placename information is retrieved on demand from the [CHGIS Temporal Gazetteer API](https://chgis.hudci.org/tgw/). CHGIS is not bundled with this project. The application does not download, mirror, persist, or redistribute CHGIS downloadable datasets. Users and deployers remain responsible for complying with the applicable CHGIS terms.

The current canonical API responses identify the service as “China Historical GIS, Harvard University and Fudan University” and state `CC BY-NC 4.0`. The CHGIS Version 6 publication page supplies this citation:

> CHGIS, Version: 6. (c) Fairbank Center for Chinese Studies of Harvard University and the Center for Historical Geographical Studies at Fudan University, 2016.

See the official [CHGIS V6 publication and license information](https://chgis.fas.harvard.edu/data/chgis/v6/) and the [Creative Commons Attribution-NonCommercial 4.0 license](https://creativecommons.org/licenses/by-nc/4.0/). CHGIS data is not covered by this repository's Apache-2.0 license.

## Basemap

The default MapLibre style is served by [OpenFreeMap](https://openfreemap.org/). OpenFreeMap's service, styles, fonts, and other assets remain subject to its own terms and licenses; they are not bundled or relicensed here.

The default style uses [OpenStreetMap](https://www.openstreetmap.org/copyright) data. OpenStreetMap data is available under the Open Data Commons Open Database License (ODbL). MapLibre displays the style-provided attribution on the map, and the application must not hide it.

Deployers may substitute another MapLibre-compatible style with `NEXT_PUBLIC_MAP_STYLE_URL` and are responsible for its attribution and licensing requirements.
