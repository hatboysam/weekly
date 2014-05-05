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

Weekday.prototype.clearTasks = function() {
  this.tasks = [];
}

/**
 * Task object
 */
function Task(description) {
  this.description = description;
}

function dateFromString(dateString) {
  var splitArr = dateString.split("-");
  var year = parseInt(splitArr[0]);
  var month = parseInt(splitArr[1]) - 1;
  var day = parseInt(splitArr[2]);

  return new Date(year, month, day);
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

  /** Log In button text **/
  $scope.loginMsg = "Log In";

  /** Google auth token **/
  $scope.token = "";

  /** Base calendar URL **/
  $scope.baseURL = "https://www.googleapis.com/calendar/v3/";

  /**
   * Sign in with Google+
   */
  $scope.logIn = function() {
    gapi.auth.authorize({}, function(response) {
      console.log(response);

      if (response.access_token) {
        console.log('Checking for calendars...')
        $scope.checkCalendarsExist();
      }
    });
  };

  $scope.checkCalendarsExist = function() {
    // COMPLETE CALENDAR
    chrome.storage.local.get('completeId', function(items) {
      if (items.completeId) {
        // Calendar exists for complete
        console.log(items.completeId);
        $scope.completeId = items.completeId;
      } else {
        // Create calendar for complete
        console.log('NEED TO CREATE COMPLETE');
        $scope.createCalendar('Weekly Complete', function(calObj) {
          if (calObj.id) {
            chrome.storage.local.set({ completeId: calObj.id });
          }
        });
      }
    });

    // INCOMPLETE CALENDAR
    chrome.storage.local.get('incompleteId', function(items) {
      if (items.incompleteId) {
        // Calendar does not exist for complete
        console.log(items.incompleteId)
        $scope.incompleteId = items.incompleteId;
      } else {
        // Create calendar for incomplete
        console.log('NEED TO CREATE INCOMPLETE');
        $scope.createCalendar('Weekly Incomplete', function(calObj) {
          if (calObj.id) {
            chrome.storage.local.set({ incompleteId: calObj.id });
          }
        });
      }
    });
  }

  /**
   * Create a calendar with a given name
   */
  $scope.createCalendar = function(name, callback) {
    console.log('Creating Calendar...');
    gapi.client.request({
      path: '/calendar/v3/calendars',
      method: 'POST',
      body: { summary: name },
      callback: callback
    });
  }

  $scope.refresh = function() {
    $scope.loadEvents($scope.incompleteId, function(response) {
      console.log(response);
      if (response.items) {
        // Clear tasks
        weekdayModel.days.forEach(function(day) {
          day.clearTasks();
        });

        // Add back
        response.items.forEach(function(item) {
          var startDate = dateFromString(item.start.date);
          var startDay = weekdayModel.days[startDate.getDay()];
          startDay.addTask(new Task(item.summary));
        });

        // Add to scope
        $scope.days = weekdayModel.days;
        $scope.$digest();
      }
    });
  };

  /**
   * Load all events from a calendar name
   */
  $scope.loadEvents = function(id, callback) {
    console.log('Loading Events...');
    gapi.client.request({ 
      path: '/calendar/v3/calendars/' + id + '/events', 
      callback: callback
    });
  }

}]);


