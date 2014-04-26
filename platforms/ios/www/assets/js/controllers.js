/**
 * Define the app
 */
var weeklyApp = angular.module('weeklyApp', []);

/**
 * Weekday object
 */
function Weekday(name, tasks) {
  this.name = name;
  this.tasks = tasks;
}

Weekday.prototype.addTask = function(task) {
  this.tasks.push(task);
}

Weekday.prototype.numTasks = function() {
  return this.tasks.length;
}

Weekday.prototype.hasTasks = function() {
  return (this.tasks.length > 0);
}

/**
 * Task object
 */
function Task(description) {
  this.description = description;
}

/**
 * Weekday Model
 */
weeklyApp.service('weekdayModel', ['$rootScope', function($rootScope) {
  this.days = [];

  dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  dayTasks = [ 
    [new Task('Something')], 
    [], 
    [], 
    [new Task('One Thing'), new Task('Two Things')],
    [],
    [new Task('Friday Task')],
    []
  ];

  for (i = 0; i < dayNames.length; i++) {
    this.days.push(new Weekday(dayNames[i], dayTasks[i]));
  }
}]);

/**
 * Day Controller
 */
weeklyApp.controller('DayCtrl', ['$scope', 'weekdayModel', function($scope, weekdayModel) {
  $scope.days = weekdayModel.days;

  /**
   * Sign in with Google+
   */
  $scope.signIn = function() {
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
      $scope.token = token;
      console.log(token);
      console.log(chrome.runtime.lastError);
    });
  }
}]);