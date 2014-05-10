/**
 * Day Controller
 */
weeklyApp.controller('DayCtrl', ['$scope', '$q', 'weekdayModel', 'gCalAPI', function($scope, $q, weekdayModel, gCalAPI) {
  
  $scope.days = weekdayModel.days;
  $scope.dayNames = weekdayModel.dayNames;

  /** Log In button text **/
  $scope.loginMsg = "Log In";

  /** Google auth token **/
  $scope.token = "";

  /** Making a new task **/
  $scope.taskDay = "";
  $scope.taskDesc = "";

  /**
   * Sign in with Google+
   */
  $scope.logIn = function() {
    gCalAPI.logIn().then(function(access_token) {
      $scope.checkCalendarsExist();
    })
  };

  $scope.checkCalendarsExist = function() {
    // COMPLETE CALENDAR
    chrome.storage.local.get('completeId', function(items) {
      if (items.completeId && (items.completeId != undefined)) {
        // Calendar exists for complete
        console.log('Complete ID:' + items.completeId);
        $scope.completeId = items.completeId;
      } else {
        // Create calendar for complete
        console.log('NEED TO CREATE COMPLETE');
        gCalAPI.createCalendar('Weekly Complete').then(function(id) {
          console.log('ID:' + id);
          chrome.storage.local.set({ completeId: id });
        });
      }
    });

    // INCOMPLETE CALENDAR
    chrome.storage.local.get('incompleteId', function(items) {
      if (items.incompleteId && (items.incompleteId != undefined)) {
        // Calendar does not exist for complete
        console.log('Incomplete ID:' + items.incompleteId)
        $scope.incompleteId = items.incompleteId;
      } else {
        // Create calendar for incomplete
        console.log('NEED TO CREATE INCOMPLETE');
        gCalAPI.createCalendar('Weekly Incomplete').then(function(id) {
          console.log('ID:' + id);
          chrome.storage.local.set({ incompleteId: id });
        });
      }
    });
  }

  $scope.refresh = function() {
    // Back up
    // TODO: This does not work, make a copy.
    var oldDaysBackup = $scope.days;

    // Clear old tasks
    weekdayModel.days.forEach(function(day) {
      day.clearTasks();
    });

    gCalAPI.loadEvents($scope.incompleteId).then(function(response) {
        console.log('Incomplete is good');
        weekdayModel.addAllFromCal(response.items, false); 
        return gCalAPI.loadEvents($scope.completeId);
    }).then(function(response) {
        console.log('Complete is good');
        weekdayModel.addAllFromCal(response.items, true); 
    }).then(function() {
        $scope.days = weekdayModel.days;
    }, function(err) {
        console.log('Error');
        console.log(err);
        $scope.days = oldDaysBackup;
    });
  };

  $scope.toggle = function(task) {
    // Calendars to move
    var fromId = task.completed ? $scope.completeId : $scope.incompleteId;
    var toId = task.completed ? $scope.incompleteId : $scope.completeId;

    // Toggle locallt
    task.completed = !task.completed;

    gCalAPI.moveEvent(task.id, fromId, toId).then(function(id) {
      // All good
      console.log("Event moved");
    }, function(err) {
      // Switch back
      console.log(err);
      task.completed = !task.completed;
    });
  };

  $scope.newTask = function() {
    // Day name to to day index
    var day = $scope.dayNames.indexOf($scope.taskDay);
    if (day >= 0) {
      // Get from form
      var desc = $scope.taskDesc;
      var task = new Task(desc, false);

      // Add task
      weekdayModel.addTask(task, day);

      // gCalCreate
      var dateObj = dateForDay(day);
      var dateString = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate();
      gCalAPI.createEvent($scope.incompleteId, desc, dateString)
        .then(function(eventObj) {
          console.log(eventObj);
          // Set the task id once it is returned
          task.setId(eventObj.id);
        }, function(errorObj) {
          console.log(errorObj);
        }); 

      // Clear form
      $scope.taskDay = "";
      $scope.taskDesc = ""
    }
  }

}]);


