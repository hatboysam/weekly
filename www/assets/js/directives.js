weeklyApp.directive('toggleClass', function() {
  return {
    restrict: 'A',
    transclude: true,
    template: '<div ng-click="toggleClick()" ng-transclude></div>',
    compile: function($element, $attrs) {
      var linkFunction = function($scope, $element, $attrs) {
        // Put the class on at the start, if needed
        // TODO: Move this to compile
        var startOn = ($attrs.toggleStartOn == "true");
        if (startOn) {
          $element.addClass($attrs.toggleClass);
        }

        // Toggle the class on click
        $scope.toggleClick = function(){
          $element.toggleClass($attrs.toggleClass);
        }
      };

      return linkFunction;
    }
  };
});