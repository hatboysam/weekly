/**
 * Day Controller
 */
weeklyApp.controller('DayCtrl', 
  ['$scope', '$q', 'weekdayModel', 'gCalAPI', 'localStorageAPI', 'requestMngr', 'parseAPI', 
  function($scope, $q, weekdayModel, gCalAPI, localStorageAPI, requestMngr, parseAPI) {
  
  $scope.days = weekdayModel.days;
  $scope.dayNames = weekdayModel.dayNames;

  $scope.blockingLoad = false;

  /** Google auth token **/
  $scope.token = undefined;

  /** Google+ user id **/
  $scope.id = undefined;
  $scope.email = undefined;

  /** Making a new task **/
  $scope.taskDay = "";
  $scope.taskDesc = "";

  /**
   * Sign in with Google+
   */
  $scope.logIn = function(inter) {
    $scope.blockingLoad = true;

    localStorageAPI.getAlways('email').then(function(email) {
      // Get email, then log in
      $scope.email = email;
      return gCalAPI.logIn(inter, $scope.email);
    }).then(function(resp) {
      console.log(JSON.stringify(resp));
      console.log('ACCESS TOKEN: ' + resp.access_token);
      showSuccess('Logged in, thanks!');
      $scope.blockingLoad = false;
      $scope.token = resp.access_token;

      // Get user info
      return gCalAPI.getInfo();
    }).then(function(infoObj) {
      // Got user info
      console.log(infoObj);
      $scope.id = infoObj.id;
      $scope.email = infoObj.emails[0].value;
      localStorageAPI.set({ email: $scope.email });

      // Check for calendars
      return $scope.checkCalendarsExist();
    }, function(err) {
      $scope.blockingLoad = false;
      showError('Error: there was a problem logging in');
    }).then(function(ids) {
      // Refresh
      $scope.refresh();
    });
  };

  $scope.checkCalendarsExist = function() {

    var completePromise = $scope.getCalendar('completeId', 'Weekly Complete');
    var incompletePromise = $scope.getCalendar('incompleteId', 'Weekly Incomplete');

    return $q.all(completePromise, incompletePromise);
  }

  $scope.getCalendar = function(name, title) {
    var calDefer = $q.defer();

    // Check localstorage
    localStorageAPI.get(name).then(function(id) {
      console.log(title + ': ' + id);
      $scope[name] = id;
      calDefer.resolve(id);
    }, function(err) {
      // Check parse
      parseAPI.query(name, { personId: $scope.id }).then(function(resp) {
        console.log('QUERYING PARSE:');
        var results = resp.data.results;
        console.log(results);

        // Check if query came back with anything
        if (results.length < 1) {
          // Nothing from parse, need to create
          gCalAPI.createCalendar(title).then(function(id) {
            // Created, store in scope and resolve promise
            console.log('Created ' + title + ' with ' + id);
            $scope[name] = id;
            calDefer.resolve(id);

            // Cache in local storage
            calObj = {};
            calObj[name] = id;
            localStorageAPI.set(calObj);

            // Store on Parse
            parseAPI.create(name, { personId: $scope.id, calId: id });
          }, function(err) {
            // If you get here, everything is really fucked
            calDefer.reject('Error: everything failed');
          });
        } else {
          // Got result from parse
          var firstResult = results[0];
          var id = firstResult.calId;
          console.log(title + ': ' + id);

          // Store in scope and resolve promise
          $scope[name] = id;
          calDefer.resolve(id);

          // Cache in local storage
          calObj = {};
          calObj[name] = id;
          localStorageAPI.set(calObj);
        }
      });
    });

    return calDefer.promise;
  }

  $scope.refresh = function() {

    // Recovery: silent log in
    var recoverFn = function() { 
      return gCalAPI.logIn(false, $scope.email); 
    };

    // Get incomplete tasks
    var incompletePromise = requestMngr.tryWith(function() {
      return gCalAPI.loadEvents($scope.incompleteId);
    }, recoverFn);

    // Get complete tasks
    var completePromise = requestMngr.tryWith(function() {
      return gCalAPI.loadEvents($scope.completeId);
    }, recoverFn);

    // When we have fetched both incomplete and complete
    $q.all([incompletePromise, completePromise]).then(function(results) {
      // Clear old tasks
      weekdayModel.clearAll();

      // Add to model
      incompleteResp = results[0];
      completeResp = results[1];
      weekdayModel.addAllFromCal(incompleteResp.items, false);
      weekdayModel.addAllFromCal(completeResp.items, true);

      // Cache
      localStorageAPI.set({ days: $scope.days });

      // Notify
      showSuccess('Refreshed');
    }, function(err) {
      // Restore old days
      showError('Error: could not refresh');
      console.log('REFRESH failed');
      console.log(JSON.stringify(err));
      // $scope.restoreDays();

      // Set as logged out
      $scope.token = undefined;
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
      console.log(JSON.stringify(err));
    });
  };

  $scope.restoreDays = function() {
    // Restore cached tasks
    // TODO: Don't bother if they're not for the right week, check
    localStorageAPI.get('days').then(function(days) {
      days.forEach(function(day) {
        day.tasks.forEach(function(task) {
          var taskObj = new Task(task.description, task.completed);
          taskObj.setId(task.id);
          weekdayModel.addTask(taskObj, day.ind);
        });
      });
    });
  }

  /**
   * STARTUP TASKS
   */
  $scope.logIn(false);

  /**
   * DETECT RESUME EVENT (Cordova)
   */
  document.addEventListener('resume', function() {
    console.log('RESUME INSIDE ANGULAR');
    if ($scope.token) {
      // Refresh
      console.log('RESUME - REFRESHING');
      $scope.refresh();
    } else {
      // Log in and refresh
      console.log('RESUME - LOGGING IN');
      $scope.logIn(false);
    }
  }, false);

}]);


