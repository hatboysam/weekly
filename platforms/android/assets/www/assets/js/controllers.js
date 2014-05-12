/**
 * Day Controller
 */
weeklyApp.controller('DayCtrl', 
  ['$scope', '$q', 'weekdayModel', 'gCalAPI', 'localStorageAPI', 
  function($scope, $q, weekdayModel, gCalAPI, localStorageAPI) {
  
  $scope.days = weekdayModel.days;
  $scope.dayNames = weekdayModel.dayNames;

  /** Log In button text **/
  $scope.loginMsg = "Log In";

  /** Google auth token **/
  $scope.token = "";

  /** Making a new task **/
  $scope.taskDay = "";
  $scope.taskDesc = "";

  /** Expanded **/
  $scope.expanded = [false, false, false, false, false, false, false];
  $scope.expanded[(new Date()).getDay()] = true;

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
    localStorageAPI.get('completeId').then(function(id) {
      console.log('Complete ID: ' + id);
      $scope.completeId = id;
    }, function(err) {
      console.log(err);
      gCalAPI.createCalendar('Weekly Complete').then(function(id) {
          console.log('Complete ID:' + id);
          localStorageAPI.set({ completeId: id });
      });
    });

    // INCOMPLETE CALENDAR
    localStorageAPI.get('incompleteId').then(function(id) {
      console.log('Incomplete ID: ' + id);
      $scope.incompleteId = id;
    }, function(err) {
      console.log(err);
      gCalAPI.createCalendar('Weekly Incomplete').then(function(id) {
          console.log('Incomplete ID:' + id);
          localStorageAPI.set({ inompleteId: id });
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
  },

  $scope.expandDay = function(day) {
    $scope.expanded[day.ind] = !($scope.expanded[day.ind]);
  }

}]);


