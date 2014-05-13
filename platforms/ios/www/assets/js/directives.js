weeklyApp.directive('toggleClass', function() {
  return {
    restrict: 'A',
    compile: function($element, $attrs) {
      var linkFunction = function($scope, $element, $attrs) {
        // Put the class on at the start, if needed
        // TODO: Move this to compile
        var startOn = ($attrs.toggleStartOn == "true");
        if (startOn) {
          $element.addClass($attrs.toggleClass);
        }

        // Toggle the class on click
        var toggleClick = function(){
          $element.toggleClass($attrs.toggleClass);
        }

        // Set as click listener
        $element.click(toggleClick);
      };

      return linkFunction;
    }
  };
});