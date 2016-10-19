var assert = require('assert');
global.ko = require('../js/src/lib/knockout-3.4.0.js');
var ViewModel = require('../js/src/models/ViewModel.js');
global.vm = ViewModel.ViewModel();


describe('ViewModel', function () {

	// runs before each test in this block
	beforeEach(function() {
		global.vm = new ViewModel.ViewModel();
	});

	describe('#canAddTicket()', function () {
		it('should return false when there are less than 6 numbers entered', function () {
			vm.newTicketNumbersArr([1, 2, 3, 4, 5]);
			assert.equal( false, vm.canAddTicket() );
		});

		it('should return true when there are 6 numbers entered', function () {
			vm.newTicketNumbersArr([1, 2, 3, 4, 5, 6]);
			assert.equal( true, vm.canAddTicket() );
		});

		it('should return false if there are more than 6 numbers entered', function () {
			vm.newTicketNumbersArr([1, 2, 3, 4, 5, 6, 7]);
			assert.equal( false, vm.canAddTicket() );
		});
	});

	describe('#formatPrizeAwarded()', function () {
		it('should return the award formatted correctly', function () {
			var val = vm.formatPrizeAwarded(1000);
			assert.equal('$1,000', val);
		});
	});

	describe('#getUrlParameterByName', function () {
		it('Should return the requested parameter value', function () {
			var val = vm.getUrlParameterByName('first', 'http://test.com/?first=Andrew&last=Houser');
			assert.equal('Andrew', val);
		});

		it('Should return null when the requested parameter is not found', function () {
			var val = vm.getUrlParameterByName('cat', 'http://test.com/?first=Andrew&last=Houser');
			assert.equal(null, val);
		});

		it('Should return a blank string if there is a found parameter but no value', function () {
			var val = vm.getUrlParameterByName('last', 'http://test.com/?first=Andrew&last=');
			assert.equal('', val);
		});
	});

	describe('#isLoading', function () {
		beforeEach(function() {
			global.vm = new ViewModel.ViewModel();
		});

		it('Should return true when there is no jackpot and no dates', function () {
			assert.equal(true, vm.isLoading() );
		});

		it('Should return false when there is a jackpot value', function () {
			vm.jackpot('136');
			assert.equal(false, vm.isLoading() );
		});

		it('Should return false when there are dates', function () {
			vm.drawings.push({ DrawDate: '1/1/1970' });
			assert.equal(false, vm.isLoading() );
		});

		it('Should return false when there is a jackpot and dates', function () {
			vm.jackpot('136');
			vm.drawings.push({ DrawDate: '1/1/1970' });
			assert.equal(false, vm.isLoading() );
		});
	});

	describe('#resetTicketInput()', function () {
		beforeEach(function() {
			vm.newTicketNumbers('1 2 3 4 5 6');
			vm.newTicketNumbersArr([1, 2, 3, 4, 5, 6]);
		});

		it('Should set the newTicketNumbers observable to a blank string', function () {
			vm.resetTicketInput();
			assert.equal('', vm.newTicketNumbers() );
		});

		it('Should set the newTicketNumbersArr observable to an empty array', function () {
			vm.resetTicketInput();
			assert.deepStrictEqual([], vm.newTicketNumbersArr() );
		});
	});
});