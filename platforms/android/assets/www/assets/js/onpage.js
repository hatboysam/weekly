function gapiIsLoaded() {
  console.log('GAPI is Loaded');
}

function serialize(obj) {
   var str = [];
   for(var p in obj){
       if (obj.hasOwnProperty(p)) {
           str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
       }
   }
   return str.join("&");
}

function dateFromString(dateString) {
  var splitArr = dateString.split("-");
  var year = parseInt(splitArr[0]);
  var month = parseInt(splitArr[1]) - 1;
  var day = parseInt(splitArr[2]);

  return new Date(year, month, day);
}

function dateForDay(dayInd) {
  var now = new Date();
  now.setHours(0, 0, 0, 0);

  var nowDay = now.getDay();
  var dayDiff = nowDay - dayInd;
  var oneDay = 24 * 60 * 60 * 1000;

  var thatDay = new Date(now.getTime() - (dayDiff * oneDay));

  return thatDay;
}

$(document).ready(function() {

  // Side Panel menu
  var jPM = $.jPanelMenu({
    menu: '#menu',
    trigger: '.menu-trigger',
    excludedPanelContent: '#title',
    animated: true
  });
  jPM.on();

  // Clicking a side panel menu item
  $('.menu-item').on({
    click: function() {
      // Close the menu
      jPM.close();
    }
  });

  // Show and hide tasks
  $(document).on('click', '.day', function() {
      $(this).siblings('.task').slideToggle(200);
      $(this).find('.badge').fadeToggle(200);
      $(this).toggleClass('collapsed');
  });

  // Show and hide the new task form
  $(document).on('click', '.new-task', function() {
    $('#task-form').slideToggle(200);
  })

  $(document).on('click', '.x-btn', function() {
    $('#task-form').slideUp(200);
  });
  $(document).on('click', '.check-btn', function() {
    $('#task-form').slideUp(200);
  });

});