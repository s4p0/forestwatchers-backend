angular.module('forestWatchers')
  .controller('ResultController', ['$rootScope','$scope','MapsService', function ($rootScope,$scope, MapsService) {
    
    $scope.getLayers = function(){
        MapsService.listWMSLayers()
        .then(function(result){
            var menuLayers = result.data.layer;
            $rootScope.$broadcast('addLayers',{
                "menuLayers" : menuLayers
            });
        })
    }
    $scope.getLayers();
    

    // $rootScope.$broadcast('addLayers',function(event, args){
    //                   return {
    //                     "layers" : [{
    //                         "a" : 1,
    //                         "b" : 2
    //                     }]
    //                   }
    //                 });
  }])