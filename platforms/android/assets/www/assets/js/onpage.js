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

  // Track whether form is open
  var formOpen = false;

  function closeForm() {
    $('#task-form').slideUp(200);
    $('.new-task').text('+');
    formOpen = false;
  };

  function openForm() {
    $('#task-form').slideDown(200);
    $('.new-task').html('&#x00D7;');
    formOpen = true;
  };

  // Show and hide the new task form
  $(document).on('click', '.new-task', function() {
    if (formOpen) {
      closeForm();
    } else {
      openForm();
    }
  });

  $(document).on('click', '.check-btn', function() {
    closeForm();
  });

});