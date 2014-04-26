$(document).ready(function() {

  // Show and hide tasks
  $('.day').on({
    click: function() {
      $(this).siblings('.task').slideToggle();
      $(this).find('.badge').fadeToggle();
    }
  });

});