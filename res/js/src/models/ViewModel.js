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
	self.winnings				= [];
	self.winnings[0]			= [0, 4];
	self.winnings[1]			= [0, 4];
	self.winnings[2]			= [0, 7];
	self.winnings[3]			= [7, 100];
	self.winnings[4]			= [100, 50000];
	self.winnings[5]			= [1000000, 'JACKPOT'];


	self.canAddTicket = ko.computed( function () {
		return ( self.newTicketNumbersArr().length == 6 );
	});

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
		var aNumbers = [],                     // Holds numbers after splitting
		    charsToDel = 1,                  // When the delete key is pressed, how many
		                                     // characters to remove
		    key = e.keyCode || e.charCode,   // Which key was pressed
		    del = ( key == 8 || key ==46 ),  // Determine the delete/backspace keys by number
		    val = '',                        // Raw input
		    newVal = '';                     // output to element

		/**
		* INNER FUNCTION
		* This function benefits from closure and checks the input to determine
		* if a space should be added to the end of the input line to facilitate
		* a better user experience when entering numbers
		*
		* @method padInput
		* @return {String}
		*/
		function padInput () {
			// Format the output by joining the collection of numbers, separated
			// by a space.
			var str = aNumbers.join(' ')

			// If the output does not end in a space and the last number already has
			// 2 digits and the Numbers collection has less than 6 items, add a space
			// to the end of the input to ready the input for the next set of numbers.
			if (str && ( val.substr( val.length - 1 ) == ' ' ||  aNumbers[aNumbers.length-1].toString().length == 2 ) && aNumbers.length < 6 ) {
				str += ' ';
			}

			return str;
		};

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
		aNumbers = val.split(/[^0-9]+/g).filter( function (v) { return v !== '' } );

		// Walk over each element in the array to validate each number
		aNumbers.forEach( function (v, i, a) {
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
		if ( aNumbers.length > 6 ) {
			aNumbers = aNumbers.splice(0, 6);
		}


		// Run a first pass on creating an output string
		newVal = padInput()

		// Now that the output string has been generated, it can be evaluated.
		// If the last character is a space, then a distinct number has been
		// entered. This allows for unique numbers to be checked and for false
		// positives - like 4 matching against the first character in 43 - from
		// impeding user entry.
		if ( newVal.lastIndexOf(' ') == newVal.length - 1 ) {
			// Filter out all numbers so that they appear only
			// once in the input
			aNumbers = aNumbers.filter( function( v, i, a ) {
				return a.indexOf( v ) === i;
			});

			// Re-run the output constructor now that the collection of values
			// is unique
			newVal = padInput();
		}

		// Set the local observable to the collection of numbers
		self.newTicketNumbersArr( aNumbers );

		// Set the observable to this new output value
		self.newTicketNumbers( newVal );

		// Prevent event bubbling
		return false;
	};


	/**
	* Removes old tickets (older than last four drawings) which do not have an
	* award amount
	*
	* @method cleanOldTickets
	* @return none
	*/
	self.cleanOldTickets = function () {
		var aTemp = self.storedTickets(), // Create a working copy
		    i = aTemp.length-1,           // Standard decrement
		    idx = -1,                     // DrawingDate index
		    iNumDraws = 4,                // Cut-off
		    oDraw = null;                 // Instance of a drawing

		// Walk over each stored ticket
		for ( ; i >= 0; i-- ) {
			// Get the index of the Drawing Date
			idx = self.getDrawingIndexByDate( aTemp[ i ].DrawDate );

			// Get a drawing validated against the ticket
			oDraw = self.validatedTicket( aTemp[i] );

			// If the drawing date is more than 2 weeks and there was
			// no award on the ticket, remove it from the collection
			if ( idx > (iNumDraws - 1) && oDraw.award == 0 ) {
				aTemp = aTemp.slice(0, i);
			}
		}

		// Set the stored tickets observed collection to the new
		// trimmed down collection of tickets
		self.storedTickets( aTemp );

		// Update the Web Storage with the newly trimmed collection
		self.saveStoredTickets();
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
	* Returns the prize awarded based on the numbers matched
	*
	* @method formatPrizeAwarded
	* @param {Number} iAmount
	* @return {String|Null}
	*/
	self.formatPrizeAwarded = function ( iAmount ) {
		var sAward = null;

		if ( iAmount > 0 ) {
			sAward = '$'+ iAmount.toLocaleString('en-US');
		}

		return sAward;
	};


	/**
	* Locates a PowerBall Drawing matching the provided date
	*
	* @method getDrawingByDate
	* @param {String} sDate
	* @return {Object|Null}
	*/
	self.getDrawingByDate = function ( sDate ) {
		var ticket = null;

		for ( ticket in self.drawings() ) {
			if ( self.drawings()[ticket].DrawDate == sDate ) {
				return self.drawings()[ticket];
			}
		}

		return null;
	};


	/**
	* Locates a PowerBall Drawing index matching the provided date
	*
	* @method getDrawingIndexByDate
	* @param {String} sDate
	* @return {Number}
	*/
	self.getDrawingIndexByDate = function ( sDate ) {
		var i = 0,
		    idx = -1;

		for ( ; i < self.drawings().length; i++ ) {
			if ( self.drawings()[ i ].DrawDate == sDate ) {
				idx = i;
				break;
			}
		}

		return idx;
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

		// After the tickets have been assigned to the stored tickets member,
		// call the function to sort them
		self.sortTickets();
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

		// Clean up any old tickets now that the last ticket drawing
		// dates are known
		self.cleanOldTickets();
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
	* Returns the ticket input to it's default ready state
	*
	* @method resetTicketInput
	* @return none
	*/
	self.resetTicketInput = function () {
		self.newTicketNumbers('');
		self.newTicketDate( self.dates()[0]);
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
	* Sorts all stored tickets based on their drawing date, in
	* descending order.
	*
	* @method sortTickets
	* @return none
	*/
	self.sortTickets = function () {
		var aTemp = self.storedTickets();

		aTemp.sort( function (a, b) {
			var dta = new Date(a.DrawDate),
			    dtb = new Date(b.DrawDate);

			return dtb >= dta;
		});

		self.storedTickets( aTemp );
	};


	/**
	* Push the entered ticket data to the Web Storage
	*
	* @method storeTicket
	* @return none
	*/
	self.storeTicket = function () {
		var oTicket; // Instance of a PowerBallTicket

		// Validate that this operation is permitted
		if ( !self.canAddTicket() ) {
			return;
		}

		// Create a new PowerBallTicket. This does two beneficial
		// and necessary things - it sorts the ball numbers numerically
		// and provides a Numbers member which is required for
		// drawing matches.
		oTicket = new PowerBallTicket({
			DrawDate: self.newTicketDate(),
			PB: self.newTicketNumbersArr()[5],
			PP: self.newTicketPP(),
			WB1: self.newTicketNumbersArr()[0],
			WB2: self.newTicketNumbersArr()[1],
			WB3: self.newTicketNumbersArr()[2],
			WB4: self.newTicketNumbersArr()[3],
			WB5: self.newTicketNumbersArr()[4]
		});

		// Add the current ticket data to the known stored ticket collection
		self.storedTickets.push( oTicket );

		// Sort the stored tickets by date
		self.sortTickets();

		// Call the Web Store helper to store the array of stored tickets
		self.saveStoredTickets();

		// Reset the user interface
		self.resetTicketInput();
	};


	/**
	* Determines the monetary award of a provided ticket
	*
	* @method ticketAward
	* @param {Number} iMatches Number of matched numbers
	* @param {Boolean} bPBMatch Whether the powerball matched
	* @param {Boolean} bPowerPlay Whether the user enabled PowerPlay
	* @param [Number] iPowerPlay PowerPlay value
	* @return {Number}
	*/
	self.ticketAward = function ( iMatches, bPBMatch, bPowerPlay, iPowerPlay ) {
		var iAward = 0,   // Amount awarded
		    idx = 0;      // Index within the winnings collection

		// If there were matches or a PowerBall match look
		// through the results to see if there was any award
		if ( iMatches > 0 || bPBMatch ) {
			// Change the award index based on a PowerBall match
			idx = ( bPBMatch ) ? 1 : 0;

			// Get the award amount from the winnings collection
			iAward = self.winnings[ iMatches ][ idx ];

			// If there was an award amount, determine if the jackpot was
			// hit or, if not, if there is a PowerPlay multiplier in effect
			if ( iAward != 0 ) {
				// The jackpot was hit
				if ( iAward == 'JACKPOT' ) {
					iAward = self.jackpot;
				}
				// If the user selected PowerPlay and the payout
				// is one million, the max payout is doubled with
				// PowerPlay instead of multiplying by the PowerPlay
				else if ( iAward == 1000000 && bPowerPlay ) {
					iAward * 2;
				}
				// If the user had PowerPlay on this ticket, multiply
				// any awarded amount by the PowerPlay multiplier
				else if ( bPowerPlay ) {
					iAward *= parseInt( iPowerPlay );
				}
			}
		}
		// Return the calculated award
		return iAward;
	};


	/**
	* Returns a drawing object with metadata about matched numbers,
	* payout amounts, etc
	*
	* @method validatedTicket
	* @param {Object} oTicket PowerBallTicket instance
	* @return {Object}
	*/
	self.validatedTicket = function ( oTicket ) {
		var i = 0,
		    iMatches = 0,
		    oDraw = self.getDrawingByDate( oTicket.DrawDate );

		// If a drawing was returned, look at it's Numbers property
		// and determine if any of them match the provided ticket's
		// Numbers collection
		if ( oDraw ) {

			// Set the ball match boolean for each ball drawn
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

			// Determine how much this drawing against this ticket yields
			oDraw['award'] = self.ticketAward( iMatches, oDraw['PBmatch'], oTicket.PP, oDraw.PP );

			// Set a flag to indicate whether this drawing against this
			// ticket yielded a winning ticket
			oDraw['isWinner'] = ( oDraw['award'] > 0 );
		}

		return oDraw;
	}

	// Return the ViewModel
	return self;
}