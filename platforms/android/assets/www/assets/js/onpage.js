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

function showError(msg) {
  var alrt = $('#alert');
  alrt.addClass('alert-error');
  alrt.text(msg);
  alrt.slideToggle(200);
  setTimeout(function() {
    alrt.text('');
    alrt.slideToggle(200);
    alrt.removeClass('alert-error');
  }, 2000);
}

function showSuccess(msg) {
  var alrt = $('#alert');
  alrt.addClass('alert-success');
  alrt.text(msg);
  alrt.slideToggle(200);
  setTimeout(function() {
    alrt.text('');
    alrt.slideToggle(200);
    alrt.removeClass('alert-success');
  }, 2000);
}

/** DOCUMENT LOAD **/
$(document).ready(function() {

  // Fastclick
  FastClick.attach(document.body);

  // Side Panel menu
  var jPM = $.jPanelMenu({
    menu: '#menu',
    trigger: '.menu-trigger',
    excludedPanelContent: '#title',
    animated: true
  });
  jPM.on();
  $('.jPanelMenu-panel').find('.sidemenu').remove();

  // Swipebox
  $('.swipebox').swipebox();

  // Alert div
  $('body').append('<div id="alert" class="alert hide"></div>');

  // Black overlay
  $('body').append('<div id="overlay" ng-hide="!blockingLoad"></div>');

  // Add Spinner
  var spinner = new Spinner({ color: 'white' }).spin();
  $('#overlay').append(spinner.el);

  // Clicking a side panel menu item
  $(document).on('click', '.menu-item', function() {
    jPM.close();
  })

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

  // Close the new task form when a task is added
  $(document).on('click', '.check-btn', function() {
    closeForm();
  });

});