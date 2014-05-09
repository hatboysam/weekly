/**
 * Weekday Model
 */
weeklyApp.service('weekdayModel', ['$rootScope', function($rootScope) {
  this.days = [];

  dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  dayTasks = [ [], [], [], [], [], [], [] ];

  for (i = 0; i < dayNames.length; i++) {
    this.days.push(new Weekday(dayNames[i], dayTasks[i]));
  }

  this.addTask = function(task, day) {
    this.days[day].addTask(task);
  }

  this.addAllFromCal = function(items) {
    items.forEach(function(item) {
      var dateString = item.start.date ? item.start.date : item.start.dateTime;
      var startDate = dateFromString(dateString);
      this.addTask(new Task(item.summary), startDate.getDay());
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
    }
  };
}]);