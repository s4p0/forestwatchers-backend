angular.module('forestWatchers')
  .controller('MapsHomeController', ['$rootScope','$scope','MapsService', function ($rootScope, $scope, MapsService) {

    // angular.extend($scope, {
        $scope.defaults = MapsService.defaults;
        $scope.controls = MapsService.controls;

        $scope.center = {
            lat: -10,
            lon: -44.57,
            zoom: 3.75
        }

        $scope.view = {
            rotation: 0,
        }

        $scope.layers = {
            // main: {
            //     visible: true,
            //     source: {
            //             // type: 'ImageWMS',
            //             type: 'TileWMS',
            //             url: 'http://maps-citizenscience.rhcloud.com/geoserver/wms',
            //             params: { LAYERS: 'DEFAULT:FAS_BRAZIL', TILED: true},
            //         },
            //         opacity: 1
            // },
            main: {
                visible: true,
                opacity: 0.5,
                source: {
                    type: 'TileJSON',
                    url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp'
                }
            },
        }

        $scope.deactiveMapFullScreen = function(){
                MapsService.controls.fullscreen = false;
        }

        $scope.enableMouseWheelZoom = function(){
                MapsService.defaults.interactions.mouseWheelZoom = true;
                $scope.layers.mapbox_geographyclass.visible = false;
        }

        $rootScope.$on('showOrHideLayer', function(event, data){
            $scope.layers[data.menuLayer] = {
                visible: true,
                source: {
                        // type: 'ImageWMS',
                        type: 'TileWMS',
                        // type: 'WMTS',
                        url: 'http://maps-citizenscience.rhcloud.com/geoserver/gwc/service/wms?',
                        params: { LAYERS: data.menuLayer, TILED: true, WIDTH: 512, HEIGHT: 512, VERSION: "1.1.1"},
                        serverType: 'geoserver'
                    },
                    opacity: 1
            }
        });


  }]);
