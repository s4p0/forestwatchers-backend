angular.module('forestWatchers')
  .factory('MapsService',  function($http, $q){
      return {
        controls: {
                zoom: true,
                fullscreen: true,
                rotate: true
            },
        defaults:{
            interactions: {
                mouseWheelZoom: false
            }
        },
        listWMSLayers: function(){
            return $http.get('http://maps-citizenscience.rhcloud.com/geoserver/gwc/rest/layers.xml',{
                // headers : {"Content-type": "text/xml", "Accept": "*/*"},
                transformResponse : function(data){
                    var x2js = new X2JS();
                    var jsonObj = x2js.xml_str2json(data)
                    return jsonObj.layers;
                }
            })
        }
      }
  });