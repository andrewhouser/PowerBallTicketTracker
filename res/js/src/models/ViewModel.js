var ViewModel = function () {
	var self = this;

	// Collection of drawing data pulled from PowerBall.com
	self.drawings				= ko.observableArray([]);
	// Current estimated jackpot value pulled from PowerBall.com
	self.jackpot				= ko.observable( null );
	// Calculated date of the next drawing
	self.nextDrawDate			= ko.observable( null );
	// Whether the newly entered ticket has the PowerPlay option
	self.newTicketPP			= ko.observable( false );
	// Drawing Date of the new ticket numbers
	self.newTicketDate			= ko.observable( null );
	// Collection of tickets already entered and stored in Web Storage
	self.storedTickets			= ko.observableArray([]);
	// Ticket numbers for the specified drawing date
	self.newTicketNumbers		= ko.observable('');
	// Array of the ticket numbers, split
	self.newTicketNumbersArr	= ko.observableArray([]);

	// Collection of dollar amount payouts awarded by PowerBall lottery
	self.winnings			= [];
	self.winnings[0] 		= [0, 4];
	self.winnings[1] 		= [0, 4];
	self.winnings[2] 		= [0, 7];
	self.winnings[3] 		= [7, 100];
	self.winnings[4] 		= [100, 50000];
	self.winnings[5] 		= [1000000, 'Grand Prize'];


	/**
	* Validates the user entry when entering ticket drawing numbers
	* Tries to make it easier for user entry my auto formatting numbers
	* into two-digit entries.
	*
	* Assumes that the last set of numbers entered is the PowerBall
	*
	* @method checkNumbers
	* @param {Object} obj DOM object which invoked the event
	* @param {Event} e Key event
	* @return {Boolean} false
	*/
	self.checkNumbers = function ( obj, e ) {
		var charsToDel = 1,                  // When the delete key is pressed, how many
		                                     // characters to remove
		    key = e.keyCode || e.charCode,   // Which key was pressed
		    del = ( key == 8 || key ==46 ),  // Determine the delete/backspace keys by number
		    val = '',                        // Raw input
		    values = [],                     // Holds numbers after splitting
		    newVal = '';                     // output to element

		// If the delete/backspace key was pressed, determine how many characters to remove.
		if ( del ) {
			// If the charcter "backed over" was a space, then back up two spaces.
			charsToDel = ( self.newTicketNumbers().substr( self.newTicketNumbers().length - 1 ) == ' ' ) ? 2 : 1;
			// Read the value, accounting for any characters we want to omit.
			val = self.newTicketNumbers().substr(0, self.newTicketNumbers().length - charsToDel);
		}
		else {
			// Otherwise, we are adding a new character to the input
			// Read the observable value and tack on the new character
			val = self.newTicketNumbers() + String.fromCharCode( key );
		}

		// Split the input value into individual sets of characters, using any non-numeric
		// value (A-Z, spaces, etc) as a delimiter. Further filter this array to exclude
		// any blank values
		values = val.split(/[^0-9]+/g).filter( function (v) { return v !== '' } );

		// Walk over each element in the array to validate each number
		values.forEach( function (v, i, a) {
			// Create a Number, ensuring it is no longer than 2 characters (99)
			var num = parseInt( v.substr(0,2) );

			// If the Number is within the allowable range for PowerBall
			// (up to 69) replace the current array index with this Number
			if ( num <= 69) {
				a[i] = num;
			}
			// Otherwise, the Number is invalid and must be removed from the array
			else {
				a.splice(i,1);
			}
		});

		// Once all the numbers have been validated, if there are more than
		// 6 numbers (5 numbers plus 1 PowerBall), remove any numbers beyond 6.
		if ( values.length > 6 ) {
			values = values.splice(0, 6);
		}

		// Set the local observable to the collection of numbers
		self.newTicketNumbersArr( values );

		// Format the output by joining the collection of numbers, separated
		// by a space.
		newVal = values.join(' ');

		// If the output does not end in a space and the last number already has
		// 2 digits and the Numbers collection has less than 6 items, add a space
		// to the end of the input to ready the input for the next set of numbers.
		if (newVal && ( val.substr( val.length - 1 ) == ' ' ||  values[values.length-1].toString().length == 2 ) && values.length < 6 ) {
			newVal += ' ';
		}

		// Set the observable to this new output value
		self.newTicketNumbers( newVal );

		// Prevent event bubbling
		return false;
	};


	/**
	* Computed observable that returns a list of Drawing Dates from the
	* data returned by the PowerBall data plus the date of the next
	* drawing
	*
	* @method dates
	* @return {Array}
	*/
	self.dates = ko.computed( function () {
		var i = 0,
		    aTemp = [];

		// Loop over each drawing and extract the DrawDate member
		for ( ; i < self.drawings().length; i++ ) {
			aTemp.push( self.drawings()[i].DrawDate );
		}

		// Add the next Drawing Date to the front of the collection
		aTemp.unshift( self.nextDrawDate() );

		return aTemp;
	});


	/**
	* Returns a drawing that corresponds to the provided ticket's
	* DrawDate member. If a drawing was found, it will be compared
	* against the provided ticket and any matches will be flagged.
	* Additionally, other metadata about the ticket will be stored
	* as members of the drawing as they impact the drawing results
	* in other methods.
	*
	* @method drawResults
	* @param {Object} oTicket Instance of a PowerBallTicket
	* @return {Object|Null}
	*/
	self.drawResults = function ( oTicket ) {
		var i = 0,
		    iMatches = 0,
		    oDraw = self.getDrawingByDate( oTicket.DrawDate );

		// If a drawing was returned, look at it's Numbers property
		// and determine if any of them match the provided ticket's
		// Numbers collection
		if ( oDraw ) {

			// Set the ball match boolean for each bal drawn
			for ( ; i < oDraw.Numbers.length; i++ ) {
				if ( oTicket.Numbers.indexOf( oDraw.Numbers[i] ) > -1 ) {
					oDraw['WB' + ( i + 1 ) + 'match'] = true;
					++iMatches;
				}
				else {
					oDraw['WB' + ( i + 1 ) + 'match'] = false;
				}
			}

			// Set whether the PowerBall matched or not
			oDraw['PBmatch'] = ( oDraw.PB == oTicket.PB );

			// Set now many balls matched the provided ticket
			oDraw['matches'] = iMatches;

			// Store the PowerPlay option from the ticket for winning
			// calculations later
			oDraw['isPowerPlay'] = oTicket.PP;
		}

		return oDraw;
	};


	/**
	* Locates a PowerBall Drawing matching the provided date
	*
	* @method getDrawingByDate
	* @param {String} sDate
	* @return {Object|Null}
	*/
	self.getDrawingByDate = function ( sDate ) {
		for ( ticket in self.drawings() ) {
			if ( self.drawings()[ticket].DrawDate == sDate ) {
				return self.drawings()[ticket];
			}
		}

		return null;
	};


	/**
	* Loads saved tickets from the Web Storage and converts
	* them to PowerBallTicket objects
	*
	* @method getStoredTickets
	* @return none
	*/
	self.getStoredTickets = function () {
		var aTemp = [],                           // Temp collection to avoid
		                                          // observable binding early fires
		    data = Store.get('powerballtickets'), // Get the keyed storage
		    i = 0;                                // Standard increment

		// Loop over the found data (Array), and turn each one into a
		// PowerBallTicket object and add that to the temporary collection
		for ( ;  i < data.length; i++ ) {
			aTemp.push( new PowerBallTicket( data[i] ) );
		}

		// Store the temporary collection as the storedTickets observable.
		self.storedTickets( aTemp );
	};


	/**
	* Initialize the ViewModel
	*
	* @method init
	* @return none
	*/
	self.init = function () {
		// Get the latest (or stored) PowerBall data from the API service
		$.ajax({
			url: 'service/powerball.php',
			method: 'GET',
			dataType: 'json',
			success: self.processPowerBallData
		});

		// Initialize the Select2 UI helper
		$('select').select2({ dropdownAutoWidth: true });

		// Retrieve any stored tickets from the Web Storage
		self.getStoredTickets();
	};


	/**
	* Returns the prize awarded based on the numbers matched
	*
	* @method prizeAwarded
	* @param {Object} oData
	* @return {String|Null}
	*/
	self.prizeAwarded = function ( oData ) {
		var amt = 0,
		    idx = 0,
		    sAward = null;

		if ( oData.matches > 0 || oData.PBmatch ) {
			idx = ( oData.PBmatch ) ? 1 : 0;
			amt = self.winnings[ oData.matches ][ idx ];

			if ( amt != 0 ) {
				if ( amt == 'Grand Prize' ) {
					sAward = amt;
				}
				else {
					if ( oData.isPowerPlay ) {
						amt *= parseInt( oData.PP );
					}

					sAward = '$'+ amt.toLocaleString('en-US');
				}
			}
		}

		return sAward;
	};


	/**
	* Processes PowerBall data once received
	*
	* @method processPowerBallData
	* @param {Object} oData
	* @return none
	*/
	self.processPowerBallData = function ( oData ) {
		var aTemp = [],     // Temp collection to avoid
		                    // observable binding early fires
		    i = 0;          // Standard increment

		self.jackpot( oData.jackpot );
		self.nextDrawDate( oData.nextDrawDate );

		// Loop over the found data (Array), and turn each one into a
		// PowerBallTicket object and add that to the temporary collection
		for ( ; i < oData.draws.length; i++ ) {
			aTemp.push( new PowerBallTicket( oData.draws[i] ) );
		}

		// Store the temporary collection as the drawings observable.
		self.drawings( aTemp );
	};


	/**
	* Removes the specified object from the storedTickets collection
	* and then calls the Web Storage helper to save the data
	*
	* @method removeTicket
	* @param {Object} oData
	* @return none
	*/
	self.removeTicket = function ( oData ) {
		self.storedTickets.remove( oData );

		// Call the Web Store helper to store the array of stored tickets
		self.saveStoredTickets();
	};


	/**
	* Web Storage transaction
	*
	* @method saveStoredTickets
	* @return none
	*/
	self.saveStoredTickets = function () {
		// Call the Web Store helper to store the array of stored tickets
		Store.set( 'powerballtickets', self.storedTickets());
	};


	/**
	* Push the entered ticket data to the Web Storage
	*
	* @method storeTicket
	* @return none
	*/
	self.storeTicket = function () {
		// Add the current ticket data to the known stored ticket collection
		self.storedTickets.push({
			DrawDate: self.newTicketDate(),
			PB: self.newTicketNumbersArr[5],
			PP: self.newTicketPP(),
			WB1: self.newTicketNumbersArr[0],
			WB2: self.newTicketNumbersArr[1],
			WB3: self.newTicketNumbersArr[2],
			WB4: self.newTicketNumbersArr[3],
			WB5: self.newTicketNumbersArr[4]
		});

		// Call the Web Store helper to store the array of stored tickets
		self.saveStoredTickets();
	};


	/*
	* Creates a subscription to the observable newTicketDate. Whenever this
	* value changes, the ticket number input should be cleared.
	*/
	self.newTicketDate.subscribe( function ( newVal ) {
		self.newTicketNumbers( null );
		self.newTicketNumbersArr.removeAll();
	});

	// Return the ViewModel
	return self;
}