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
      $(this).siblings('.task').slideToggle();
      $(this).find('.badge').fadeToggle();
  });

});