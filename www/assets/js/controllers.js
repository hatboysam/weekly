var weeklyApp = angular.module('weeklyApp', []);

weeklyApp.controller('DayCtrl', function($scope) {
  $scope.days = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday'];
});