// Declare app level module which depends on filters, and services
angular.module('forestWatchers', ['ngResource', 'ngRoute', 'ui.bootstrap', 'ui.date', 'openlayers-directive'])
.config(function($sceProvider) {
   $sceProvider.enabled(false);
})
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'js/home/home.html', 
        controller: 'HomeController'
    })
      .when('/mission', {
        templateUrl: 'js/mission/mission.html', 
    })
      .when('/contact', {
        templateUrl: 'js/contact/contact.html', 
    })
      .when('/team', {
        templateUrl: 'js/team/team.html', 
    })
      .otherwise({redirectTo: '/'});
  }]);
