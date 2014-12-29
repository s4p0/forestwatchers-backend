angular.module('forestWatchers')
  .controller('HomeController', ['$scope', function ($scope) {
    $scope.photos = [
        { caption: "Forests are in danger", 
           url: "http://forestwatchers.net/assets/images/carousel/forest.jpg", 
           source: "Photo by Leonardo F. Freitas (BY-NC-SA 2.0)" },
        { caption: "Fires, illegal logging, ...", 
           url: "http://forestwatchers.net/assets/images/carousel/burning.jpg", 
           source: "Photo by Leonardo F. Freitas (BY-NC-SA 2.0)" },
        { caption: "But a crowd can help!", 
           url: "http://forestwatchers.net/assets/images/carousel/crowd.jpg", 
           source: "Photo by Kevin McGarry (BY-NC-SA 2.0)" },
    ]

    $scope.videoForestWatchers = [
        { "title": "ForestWatchers por Nigini", "url": "https://www.youtube.com/embed/etNwZO4oy7w", },
        { "title": "ForestWatchers por Jader", "url": "https://www.youtube.com/embed/eh6QTAoS0Ew", },
        { "title": "ForestWatchers por Jeymisson", "url": "https://www.youtube.com/embed/veFIHm2U-Uc", },
        { "title": "ForestWatchers por Larissa", "url": "https://www.youtube.com/embed/r611EdwOhIQ", },
        { "title": "ForestWatchers por Pedro Markun", "url": "https://www.youtube.com/embed/eXMlCWmCzEs", },
    ]
  }]);
