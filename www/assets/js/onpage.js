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

function dateToString(dateObj) {
  // Format: yyyy-mm-dd
  var yearString = dateObj.getFullYear();
  var monthNum = dateObj.getMonth() + 1;
  var monthString = ("0" + monthNum).slice(-2); // Always 2 digits
  var dateNum = dateObj.getDate();
  var dateString = ("0" + dateNum).slice(-2); // Always 2 digits

  return yearString + "-" + monthString + "-" + dateString;
}

function showError(msg) {
  var alrt = $('#alert-error');
  showMsg('alert-error', msg);
}

function showSuccess(msg) {
  var alrt = $('#alert-success');
  showMsg('alert-success', msg);
}

function showMsg(clazz, msg) {
  var elem = $('#alert');
  elem
    .queue(function() {
      elem.addClass(clazz);
      $(this).dequeue();
    })
    .queue(function() {
      elem.text(msg);
      $(this).dequeue();
    })
    .slideToggle(200)
    .delay(1200)
    .slideToggle(200)
    .queue(function() {
      elem.removeClass(clazz);
      $(this).dequeue();
    });
}

/** STARTUP **/
document.addEventListener('deviceready', function() {
  console.log('DEVICE READY');
  // TODO: Bootstrap angular
}, false);

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
  $('.swipebox').swipebox({
    hideBarsOnMobile: false,
    hideBarsDelay: 100000,
    afterClose: function() {
      // Mark help as viewed
      chrome.storage.local.set({ viewedHelp: true }, function() {});
    }
  });

  // Check if we have never seen the help
  chrome.storage.local.get('viewedHelp', function(items) {
    if (!items.viewedHelp) {
      // Haven't seen it, launch it
      $('#help').trigger('click');
    }
  });

  // Alert div
  $('body').append('<div id="alert" class="alert hide"></div>');
  // $('body').append('<div id="alert-success" class="alert alert-success hide"></div>');

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