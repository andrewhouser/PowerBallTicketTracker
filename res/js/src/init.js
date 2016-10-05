// Create a global variable hook for console debugging
var vm = null;

document.addEventListener('DOMContentLoaded', function ( evt ) {
	vm = new ViewModel();
	ko.applyBindings(vm);

	vm.init();
});