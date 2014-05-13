/**
 * Day Controller
 */
weeklyApp.controller('DayCtrl', 
  ['$scope', '$q', 'weekdayModel', 'gCalAPI', 'localStorageAPI', 
  function($scope, $q, weekdayModel, gCalAPI, localStorageAPI) {
  
  $scope.days = weekdayModel.days;
  $scope.dayNames = weekdayModel.dayNames;

  /** Google auth token **/
  $scope.token = undefined;

  /** Making a new task **/
  $scope.taskDay = "";
  $scope.taskDesc = "";

  /**
   * Sign in with Google+
   */
  $scope.logIn = function() {
    gCalAPI.logIn().then(function(access_token) {
      console.log('ACCESS TOKEN: ' + access_token);
      showSuccess('Logged in, thanks!');
      $scope.token = access_token;
      $scope.checkCalendarsExist();
    }, function(err) {
      showError('Error: there was a problem logging in.');
    });
  };

  $scope.checkCalendarsExist = function() {
    // COMPLETE CALENDAR
    localStorageAPI.get('completeId').then(function(id) {
      console.log('Complete ID: ' + id);
      $scope.completeId = id;
    }, function(err) {
      console.log(JSON.stringify(err));
      gCalAPI.createCalendar('Weekly Complete').then(function(id) {
          console.log('Complete ID:' + id);
          localStorageAPI.set({ completeId: id });
          $scope.completeId = id;
      });
    });

    // INCOMPLETE CALENDAR
    localStorageAPI.get('incompleteId').then(function(id) {
      console.log('Incomplete ID: ' + id);
      $scope.incompleteId = id;
    }, function(err) {
      console.log(JSON.stringify(err));
      gCalAPI.createCalendar('Weekly Incomplete').then(function(id) {
          console.log('Incomplete ID:' + id);
          localStorageAPI.set({ incompleteId: id });
          $scope.incompleteId = id;
      });
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
        console.log(JSON.stringify(err));
        showError('Error: could not refresh');
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
      console.log(JSON.stringify(err));
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

      // TODO: Expand day when added

      // gCalCreate
      var dateObj = dateForDay(day);
      var dateString = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate();
      gCalAPI.createEvent($scope.incompleteId, desc, dateString)
        .then(function(eventObj) {
          console.log(eventObj);
          // Set the task id once it is returned
          task.setId(eventObj.id);
        }, function(err) {
          console.log(JSON.stringify(err));
        }); 

      // Clear form
      $scope.taskDay = "";
      $scope.taskDesc = "";
    }
  };

  $scope.removeTask = function(task) {
    // Remove from model
    weekdayModel.removeTask(task);

    // Gapi remove
    var calId = task.completed ? $scope.completeId : $scope.incompleteId;
    gCalAPI.deleteEvent(task.id, calId).then(function() {
      // All good
    }, function(err) {
      console.log(err);
    });
  };

}]);


