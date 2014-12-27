angular.module('forestWatchers')
  .controller('HomeController', ['$scope', function ($scope) {
    $scope.videoForestWatchers = [
        { "title": "ForestWatchers por Nigini", "url": "http://www.youtube.com/embed/etNwZO4oy7w", },
        { "title": "ForestWatchers por Jader", "url": "http://www.youtube.com/embed/eh6QTAoS0Ew", },
        { "title": "ForestWatchers por Jeymisson", "url": "http://www.youtube.com/embed/veFIHm2U-Uc", },
        { "title": "ForestWatchers por Larissa", "url": "http://www.youtube.com/embed/r611EdwOhIQ", },
        { "title": "ForestWatchers por Pedro Markun", "url": "http://www.youtube.com/embed/eXMlCWmCzEs", },
    ]
  }]);
