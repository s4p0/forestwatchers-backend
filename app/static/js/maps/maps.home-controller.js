angular.module('forestWatchers')
  .controller('MapsHomeController', ['$scope', function ($scope) {

    angular.extend($scope, {
        defaults: {
                interactions: {
                    mouseWheelZoom: false
                }
            },
            center: {
                lat: -10,
                lon: -44.57,
                zoom: 3.75
            },
            view: {
                rotation: 0,
            },
            layers: {
                main: {
                    visible: true,
                    source: {
                            // type: 'ImageWMS',
                            type: 'TileWMS',
                            url: 'http://maps-citizenscience.rhcloud.com/geoserver/wms',
                            params: { LAYERS: 'DEFAULT:FAS_BRAZIL', TILED: true},
                        },
                        opacity: 1
                },
                mapbox_geographyclass: {
                    visible: true,
                    opacity: 0.5,
                    source: {
                        type: 'TileJSON',
                        url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp'
                    }
                },
                BingMaps: {
                    visible: false,
                        source: {
                            // "type": "OSM"
                            type: 'BingMaps',
                            key: 'Aj6XtE1Q1rIvehmjn2Rh1LR2qvMGZ-8vPS9Hn3jCeUiToM77JFnf-kFRzyMELDol',
                            imagerySet: 'AerialWithLabels'
                        },
                        opacity: 0.5
                    },
                topojson: {
                    visible: false,
                    source: {
                        type: 'TopoJSON',
                        url: 'json/world.topo.json'
                    },
                    style: {
                        fill: {
                            color: 'rgba(255, 0, 0, 0.6)'
                        },
                        stroke: {
                            color: 'white',
                            width: 3
                        }
                    }
                }
            },
            controls: {
                zoom: true,
                fullscreen: true,
                rotate: false
            }
        })




        // angular.extend($scope, {
    //     defaults: {
    //         layers: {
    //             main: {
    //                 source: {
    //                     type: "OSM",
    //                     url: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
    //                 }
    //             }
    //         },
    //         maxZoom: 14,
    //     },
    //     controls: {
    //             zoom: true,
    //             fullscreen: true,
    //             rotate: false
    //         }
    // })

  }]);
