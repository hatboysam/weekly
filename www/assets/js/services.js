/**
 * Weekday Model
 */
weeklyApp.service('weekdayModel', ['$rootScope', function($rootScope) {
  this.days = [];

  this.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  this.dayTasks = [ [], [], [], [], [], [], [] ];

  for (i = 0; i < this.dayNames.length; i++) {
    this.days.push(new Weekday(this.dayNames[i], i, this.dayTasks[i]));
  }

  this.addTask = function(task, day) {
    this.days[day].addTask(task);
  }

  this.removeTask = function(task) {
    for (i = 0; i < 7; i++) {
      var iDay = this.days[i];
      var dayTasks = iDay.tasks;
      var taskInd = dayTasks.indexOf(task);
      if (taskInd >= 0) {
        dayTasks.splice(taskInd, 1);
      }
    }
  }

  this.addAllFromCal = function(items, completed) {
    items.forEach(function(item) {
      var dateString = item.start.date ? item.start.date : item.start.dateTime;
      var startDate = dateFromString(dateString);
      var task = new Task(item.summary, completed);
      task.setId(item.id);
      this.addTask(task, startDate.getDay());
    }.bind(this));
  }

}]);

/**
 * Google Calendar API
 */
weeklyApp.factory('gCalAPI', ['$rootScope', '$q', function($rootScope, $q) {
  return {
    logIn: function(immed) {
      var loginDefer = $q.defer();

      gapi.auth.authorize({ immediate: immed }, function(response) {
        console.log(response);

        if (response.access_token) {
          loginDefer.resolve(response);
        } else {
          loginDefer.reject("Error: no access_token");
        }
      });

      return loginDefer.promise;
    },

    getInfo: function() {
      var infoDefer = $q.defer(); 

      gapi.client.request({
        path: '/plus/v1/people/me',
        method: 'GET',
        callback: function(infoObj) {
          if (infoObj.id) {
            infoDefer.resolve(infoObj);
          } else {
            infoDefer.reject('Error: could not get info');
          }
        }
      });

      return infoDefer.promise;
    },

    createCalendar: function(name) {
      var calDefer = $q.defer();

      console.log('Creating Calendar: ' + name);
      gapi.client.request({
        path: '/calendar/v3/calendars',
        method: 'POST',
        body: { summary: name },
        callback: function(calObj) {
          if (calObj.id) {
            calDefer.resolve(calObj.id);
          } else {
            calDefer.reject('Error: could not create calendar');
          }
        }
      });

      return calDefer.promise;
    },

    loadEvents: function(id) {
      var loadDefer = $q.defer();
      var basePath = '/calendar/v3/calendars/' + id + '/events';
      var queryOpts = {
        timeMin: dateForDay(0).toISOString(),
        timeMax: dateForDay(6).toISOString()
      };

      console.log('Loading Events...');
      gapi.client.request({ 
        path: basePath + '?' + serialize(queryOpts), 
        callback: function (response) {
          if (response.items) {
            console.log(response.items);
            loadDefer.resolve(response);
          } else {
            loadDefer.reject(response);
          }
        }
      });

      return loadDefer.promise;
    },

    createEvent: function(id, name, date) {
      var eventDefer = $q.defer();
      gapi.client.request({
        path: '/calendar/v3/calendars/' + id + '/events',
        method: 'POST',
        body: {
          summary: name,
          start: {
            date: date
          },
          end: {
            date: date
          }
        },
        callback: function(eventObj) {
          if (eventObj.id) {
            eventDefer.resolve(eventObj);
          } else {
            eventDefer.reject(eventObj);
          }
        }
      });

      return eventDefer.promise;
    },

    moveEvent: function(eventId, fromId, toId) {
      var moveDefer = $q.defer();
      var basePath = '/calendar/v3/calendars/' + fromId + '/events/' + eventId + '/move/';
      var queryOpts = { destination: toId };

      gapi.client.request({
        path: basePath + '?' + serialize(queryOpts),
        method: 'POST',
        callback: function(eventObj) {
          if (eventObj.id) {
            moveDefer.resolve(eventObj.id);
          } else {
            moveDefer.reject('Error: could not move event');
          }
        }
      });

      return moveDefer.promise;
    },

    deleteEvent: function(eventId, calendarId) {
      var deleteDefer = $q.defer();

      gapi.client.request({
        path: '/calendar/v3/calendars/' + calendarId + '/events/' + eventId,
        method: 'DELETE',
        callback: function(resp) {
          if (resp == null) {
            deleteDefer.resolve();
          } else {
            deleteDefer.reject('Error: ' + resp);
          }
        }
      });

      return deleteDefer.promise;
    }
  };
}]);

/**
 * Local Storage API
 */
 weeklyApp.factory('localStorageAPI', ['$rootScope', '$q', function($rootScope, $q) {
  return {
    get: function(key) {
      var getDefer = $q.defer();

      chrome.storage.local.get(key, function(items) {
        if (items[key] && (items[key] != undefined)) {
          getDefer.resolve(items[key]);
        } else {
          getDefer.reject('Error: no entry for ' + key);
        }
      });

      return getDefer.promise;
    },

    set: function(setObj) {
      chrome.storage.local.set(setObj, function() {
        if (chrome.runtime.lastError) {
          console.log('Error storing: ' + chrome.runtime.lastError);
        } else {
          console.log('Stored: ' + JSON.stringify(setObj));
        }
      });
    }
  };
 }]);

/**
 * Request logic
 */
weeklyApp.factory('requestMngr', ['$q', function($q) {
  return {
    tryWith: function(requestFn, recoverFn) {
      var attemptDefer = $q.defer();

      requestFn().then(function(resp) {
        // Request succeeded, first try
        attemptDefer.resolve(resp);
      }, function(err) {
        // Request failed, first try
        // recover and then try again
        return recoverFn().then(requestFn);
      }).then(function(resp) {
        // Request succeeded, second try
        attemptDefer.resolve(resp);
      }, function(err) {
        // Request failed, second try
        attemptDefer.reject(err);
      });

      return attemptDefer.promise;
    }
  };
}]);

/**
 * Parse Constants
 */
weeklyApp.constant('parseAppId', 'OiLq5JyJVut82Dzgr1aTqvgszsur9wUwVkM5xYsX');
weeklyApp.constant('parseRestKey', 'EpvelChqb2YgBY8i69pTTwOa3JYnJJlF6MIgUiZx');

/**
 * Parse API
 */
weeklyApp.factory('parseAPI', 
  ['$q', '$http', 'parseAppId', 'parseRestKey', 
  function($q, $http, parseAppId, parseRestKey) {
    return {
      baseURL: 'https://api.parse.com/1/classes/',
      headers: {
        'X-Parse-Application-Id': parseAppId,
        'X-Parse-REST-API-Key': parseRestKey,
        'Content-Type': 'application/json'
      },

      create: function(clazz, data) {
        var fullURL = this.baseURL + clazz;
        return $http({ 
          method: 'POST',
          url: fullURL,
          headers: this.headers, 
          data: data
        });
      },

      get: function(clazz, objectId) {
        var fullURL = this.baseURL + clazz + '/' + objectId;
        return $http({ 
          method: 'GET',
          url: fullURL,
          headers: this.headers
        });
      },

      query: function(clazz, where) {
        var fullURL = this.baseURL + clazz;
        return $http({ 
          method: 'GET',
          url: fullURL,
          headers: this.headers,
          params: { 'where': where }
        });
      }
    };
}]);

