angular.module('forestWatchers')
.controller('NavBarDefaultController',['$rootScope','$scope','$location','MapsService',function($rootScope, $scope, $location, MapsService){

      $scope.isActiveLink = function(menu){
        return $location.$$url  == menu.url.replace("#", "/");
      }

      $scope.menuLayers = []

      $rootScope.$on('addLayers',
        function(event, data){
            $scope.menuLayers = data.menuLayers;        
      });

      $scope.showOrHideLayer = function(layer){
        $rootScope.$broadcast('showOrHideLayer',{
            "menuLayer" : layer
        });
      }



      $scope.menus = [
            {
                "url": "#",
                "icon": "fa fa-home",
                "label": "Home",
            },
            {
                "url": "#mission",
                "icon": "fa fa-star",
                "label": "Mission",
            },
            {
                "url": "#team",
                "icon": "fa fa-user",
                "label": "Team",

            },
            {
                "url": "#contact",
                "icon": "fa fa-envelope",
                "label": "Contact",
            },
            {
                "url": "#result",
                "icon": "fa fa-map-marker",
                "label": "Last Results",
            },
      ]

      $scope.layers = {
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
      }


}]);