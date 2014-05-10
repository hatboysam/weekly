/**
 * Weekday Model
 */
weeklyApp.service('weekdayModel', ['$rootScope', function($rootScope) {
  this.days = [];

  this.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  this.dayTasks = [ [], [], [], [], [], [], [] ];

  for (i = 0; i < this.dayNames.length; i++) {
    this.days.push(new Weekday(this.dayNames[i], this.dayTasks[i]));
  }

  this.addTask = function(task, day) {
    this.days[day].addTask(task);
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
    logIn: function() {
      var loginDefer = $q.defer();

      gapi.auth.authorize({ interactive: true, immediate: false }, function(response) {
        console.log(response);

        if (response.access_token) {
          loginDefer.resolve(response.access_token);
          // TODO: Check calendars exit
        } else {
          loginDefer.reject("Error: no access_token");
        }
      });

      return loginDefer.promise;
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
      // TODO: Get for this week only!
      // use dateForDay(0) for the start of the week
      var loadDefer = $q.defer();

      console.log('Loading Events...');
      gapi.client.request({ 
        path: '/calendar/v3/calendars/' + id + '/events', 
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
      var fullPath = basePath + '?destination=' + toId;

      gapi.client.request({
        path: fullPath,
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
    }
  };
}]);