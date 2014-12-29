angular.module('forestWatchers')
  .controller('MainCtrl', ['$scope', function ($scope) {
    $scope.sponsors = [
            {"external_url" : "http://www.soros.org", "image_url": "http://forestwatchers.net/assets/images/logos/soros.png"},
            {"external_url" : "http://www.unitar.org/unosat", "image_url": "http://forestwatchers.net/assets/images/logos/unitar.png"},
            {"external_url" : "http://www.inpe.br", "image_url": "http://forestwatchers.net/assets/images/logos/inpe.png"},
            {"external_url" : "http://www.citizencyberscience.net", "image_url": "http://forestwatchers.net/assets/images/logos/ccc.png"},
            {"external_url" : "http://www.unifesp.br", "image_url": "http://forestwatchers.net/assets/images/logos/unifesp.png"}]
  }])