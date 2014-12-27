angular.module('forestWatchers')
  .controller('MapsHomeController', ['$scope', function ($scope) {

    // angular.extend($scope, {
        $scope.defaults = {
                interactions: {
                    mouseWheelZoom: false
                }
            }
            
            $scope.center = {
                lat: -10,
                lon: -44.57,
                zoom: 3.75
            }

            $scope.view = {
                rotation: 0,
            }

            $scope.layers = {
                main: {
                    visible: true,
                    source: {
                            // type: 'ImageWMS',
                            type: 'TileWMS',
                            url: 'http://maps-citizenscience.rhcloud.com/geoserver/wms',
                            params: { LAYERS: 'DEFAULT:FAS_BRAZIL', TILED: true},
                        },
                        opacity: 1
                }
            }
            
            $scope.controls = {
                zoom: true,
                fullscreen: true,
                rotate: true
            }

  }]);
