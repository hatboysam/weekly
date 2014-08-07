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
  $scope.taskDay = $scope.dayNames[0];
  $scope.taskDesc = "";

  /**
   * Sign in with Google+
   */
  $scope.logIn = function(immed) {
    $scope.blockingLoad = true;

    localStorageAPI.getAlways('email').then(function(email) {
      // Get email, then log in
      $scope.email = email;
      return gCalAPI.logIn(immed, $scope.email);
    }).then(function(resp) {
      console.log('LOGIN: Basic request done');
      console.log(JSON.stringify(resp));
      console.log('ACCESS TOKEN: ' + resp.access_token);
      $scope.token = resp.access_token;

      // Get user info
      var infoRecoverFn = function() {
        return $scope.logOut().then(function() {
          return gCalAPI.logIn(false, $scope.email);
        });
      };
      var infoPromise = requestMngr.tryWith(function() {
        return gCalAPI.getInfo();
      }, infoRecoverFn);

      return infoPromise;
    }).then(function(infoObj) {
      // Got user info
      console.log('LOGIN: Got user info');
      showSuccess('Logged in, thanks!');
      localStorageAPI.set({ firstLogIn: true });
      $scope.id = infoObj.id;
      $scope.email = infoObj.emails[0].value;
      localStorageAPI.set({ email: $scope.email });

      // Check for calendars
      return $scope.checkCalendarsExist();
    }).then(function(ids) {
      // Refresh
      console.log('LOGIN: Checked for calendars');
      $scope.blockingLoad = false;
      console.log('LOGIN: Starting auto-refresh')
      $scope.refresh();
    }, function(err) {
      // CATCHALL BLOCK
      // There was an error somewhere along the way
      $scope.blockingLoad = false;
      if ($scope.token) {
        $scope.logOut();
      }
      console.log('LOGIN: Error: ' + JSON.stringify(err));
      showError('Error: there was a problem logging in');
    });
  };

  $scope.logOut = function() {
    var logoutDefer = $q.defer();

    // Remove cached auth token
    console.log('REMOVING TOKEN: ' + $scope.token);
    chrome.identity.removeCachedAuthToken({ token: $scope.token }, function() {
      console.log('TOKEN REMOVED');
      logoutDefer.resolve();
    });

    // Clear token
    $scope.token = undefined;

    return logoutDefer.promise;
  }

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
            calDefer.reject('Error: everything failed. ' + JSON.stringify(err));
          });
        } else {
          // Got result from parse
          var firstResult = results[0];
          var id = firstResult.calId;
          console.log(title + ': ' + id);

          // Store in scope
          $scope[name] = id;

          // Cache in local storage
          calObj = {};
          calObj[name] = id;
          localStorageAPI.set(calObj);

          // Resolve promise
          calDefer.resolve(id);
        }
      });
    });

    return calDefer.promise;
  }

  $scope.refresh = function() {
    $scope.blockingLoad = true;

    // Check if we need to move last week's events
    var weekKey = dateToString(dateForDay(0));
    localStorageAPI.getAlways(weekKey).then(function(seenWeek) {
      if (!seenWeek) {
        $scope.beginNewWeek();
      }
    });

    // Recovery function if a request errors out, returns promise
    var recoverFn = function() {
      // Remove cached access token
      var logOutLogInPromise = $scope.logOut()
      .then(function() {
        // Log in again
        return gCalAPI.logIn(false, $scope.email);
      })
      .then(function(resp) {
        // Save the new access tokem
        $scope.token = resp.access_token;
      });

      return logOutLogInPromise;
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
      $scope.cacheDays();

      // Notify
      showSuccess('Refreshed');
      $scope.blockingLoad = false;
    }, function(err) {
      // Notify
      showError('Error: could not refresh');
      $scope.blockingLoad = false;
      console.log('REFRESH failed');
      console.log(JSON.stringify(err));
      // $scope.restoreDays();

      // Set as logged out
      // TODO: Maybe replace with logOut()
      $scope.token = undefined;
    });
  };

  $scope.beginNewWeek = function() {
    console.log('Starting new week');

    // Get all incomplete from last week
    var lastSunday = -7;
    var lastSaturday = -1;
    gCalAPI.loadEvents($scope.incompleteId, lastSunday, lastSaturday).then(function(eventResp) {
      console.log('LAST WEEK INCOMPLETE');
      var events = eventResp.items;
      console.log(events);

      // Move them to this sunday
      var sundayDateString = dateToString(dateForDay(0));
      var updatePromises = [];
      for (var i = 0; i < events.length; i++) {
        // Change to sunday
        var thisEvent = events[i];
        thisEvent.start.date = sundayDateString;
        thisEvent.end.date = sundayDateString;

        // Make update request
        var thisEventPromise = gCalAPI.updateEvent($scope.incompleteId, thisEvent);
        updatePromises.push(thisEventPromise);

        // Update sequence
        thisEvent.sequence = thisEvent.sequence + 1;
      }

      // Add events locally for instant result
      weekdayModel.addAllFromCal(events, false);

      // Return all promises bunched
      return $q.all(updatePromises);
    }).then(function(updateResults) {
      console.log('BEGAN NEW WEEK');

      // Mark that we started this week
      var weekKey = dateToString(dateForDay(0));
      var setObj = {};
      setObj[weekKey] = true;
      localStorageAPI.set(setObj);

      // Cache
      $scope.cacheDays();
    });
  };

  $scope.toggle = function(task) {
    if (task.dragging) {
      return;
    }
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
      var dateString = dateToString(dateObj);
      gCalAPI.createEvent($scope.incompleteId, desc, dateString)
        .then(function(eventObj) {
          console.log(eventObj);
          // Set the task id once it is returned
          task.setId(eventObj.id);
          // Cache
          $scope.cacheDays();
        }, function(err) {
          console.log(JSON.stringify(err));
        }); 

      // Clear form
      $scope.taskDay = $scope.dayNames[0];
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
      $scope.cacheDays();
    }, function(err) {
      console.log(JSON.stringify(err));
    });
  };

  $scope.restoreDays = function() {
    // Restore cached tasks
    weekdayModel.clearAll();

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

  $scope.cacheDays = function() {
    localStorageAPI.set({ days: $scope.days });
  }

  $scope.taskDragStart = function(evt, ui, task, day) {
    console.log('DRAG START');
    task.dragging = true;
    $scope.draggedTask = task;
    $scope.draggedTaskDay = day;

    // TODO: Get this jQuery out of here!
    $('#day-' + day.ind).droppable('disable');
  }

  $scope.taskDragStop = function(evt, ui, task, day) {
    console.log('DRAG STOP');
    task.dragging = false;

    // TODO: Get this jQuery out of here!
    $('.day').droppable('enable');
  }

  $scope.dayDrop = function(evt, ui, day) {
    console.log('DROP');
    if (day.ind == $scope.draggedTaskDay.ind) {
      // Dropped on same day
      console.log('SAME DAY');
      return;
    }

    // Remove from old day
    $scope.draggedTaskDay.removeTask($scope.draggedTask);

    // Add to new day
    day.addTask($scope.draggedTask);
    $scope.draggedTask.dragging = false;

    // HTTP
    var newDateString = dateToString(dateForDay(day.ind));
    var calendardId = $scope.draggedTask.completed ? $scope.completeId : $scope.incompleteId;
    var taskEvent = {
      id: $scope.draggedTask.id,
      start: { date: newDateString },
      end: { date: newDateString },
      summary: $scope.draggedTask.description,
      sequence: $scope.draggedTask.sequence
    }
    
    gCalAPI.updateEvent(calendardId, taskEvent).then(function(id) {
      // Cache days
      $scope.cacheDays();
    }, function(err) {
      // Decrement sequence on error
      $scope.draggedTask.setSequence($scope.draggedTask.sequence - 1);
    });

    // Update event sequence (without knowing success or not)
    $scope.draggedTask.setSequence($scope.draggedTask.sequence + 1)
  }

  $scope.taskDragOpts = {
    axis: 'y',
    handle: '.task-drag',
    revert: 'invalid',
    revertDuration: 150,
    snap: '.day',
    snapMode: 'inner'
  }

  $scope.dayDropOpts = {
    activeClass: 'glowing'
  }

  $scope.attemptLogin = function() {
    localStorageAPI.getAlways('firstLogIn').then(function(firstLogIn) {
      if (firstLogIn) {
        // Not the first log in, so get tasks
        var numPerDay = $scope.days.map(function(day) { return day.numTasks() });
        var totalTasks = numPerDay.reduce(function(a, b) { return a + b});
        console.log('TOTAL ' + totalTasks);
        if (totalTasks < 1) {
          $scope.restoreDays();
        }
        $scope.logIn(false);
      } else {
        // First log in. Just hang out ... wait for them to log in
        console.log('WAITING FOR FIRST LOG IN');
      }
    });
  }

  $scope.setNotification = function() {
    console.log('SETTING NOTIFICATIONS');
    if (window.plugin && window.plugin.notification) {
      console.log('PLUGIN EXISTS');
      window.plugin.notification.local.add({
        id: '1',
        message: 'Get things done',
        title: 'This is the title',
        autoCancel: true
      });
    } else {
        console.log('PLUGIN DOES NOT EXIST');
    }
  }

  /**
   * STARTUP TASKS
   */
  $scope.attemptLogin();


  /**
   * DETECT RESUME EVENT (Cordova)
   */
  document.addEventListener('resume', function() {
    console.log('RESUME INSIDE ANGULAR');
    if ($scope.token) {
      // Already logged in, refresh
      console.log('RESUME - REFRESHING');
      $scope.refresh();
      $scope.setNotification();
    } else {
      // Not yet logged in, log in and refresh
      console.log('RESUME - LOGGING IN');
      //$scope.logIn(false);
      $scope.attemptLogin();
    }
  }, false);


}]);


