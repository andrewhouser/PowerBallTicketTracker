var PowerBallTicket = function ( oData ) {
	var self = this;

	self.DrawDate		= null;
	self.rawNumbers		= [];
	self.PB				= null;
	self.PP				= false;
	self.WB1			= null;
	self.WB2			= null;
	self.WB3			= null;
	self.WB4			= null;
	self.WB5			= null;


	/**
	* Maps the passed object to this PowerBallTicket
	*
	* @method init
	* @param {Object} oData
	* @return none
	*/
	self.init = function ( oData ) {
		var prop = null;

		// Map each property to this object's properties
		for ( prop in oData ) {
			if ( oData.hasOwnProperty( prop ) && self.hasOwnProperty( prop ) ) {
				self[ prop ] = oData[ prop ];
			}
		}

		// Sorting the ticket numbers will turn them into numbers
		// The Powerball and PowerPlay values will not get the
		// same treatment, so here they are converted explicitly

		// Convert the Powerball number into native number
		if ( self.PB ) {
			self.PB = parseInt( self.PB );
		}

		// The PowerPlay value can be a number (in the instance where
		// this ticket represents drawing data) or a boolean (in the
		// instance of user ticket data).
		// If it is a number, convert it explicitly
		if ( typeof self.PP === 'number' ) {
			self.PP = parseInt( self.PP );
		}

		// Call the method to sort the ticket numbers in case the user
		// did not enter them in ascending order or the Powerball data
		// which typically observes drawn order instead of numerical order.
		self.sortNumbers();

		// Now that numbers have been sorted, extract each number to
		// a collection that can be iterated over to find matches
		self.rawNumbers = Array( self.WB1, self.WB2, self.WB3, self.WB4, self.WB5 )
	};


	/**
	* Sorts the ticket drawing numbers in ascending order
	*
	* @method sortNumbers
	* @return none
	*/
	self.sortNumbers = function () {
		var aNumbers = [],
		    i = 0;

		// Add all the ticket numbers to a local array
		aNumbers.push( parseInt( self.WB1 ) );
		aNumbers.push( parseInt( self.WB2 ) );
		aNumbers.push( parseInt( self.WB3 ) );
		aNumbers.push( parseInt( self.WB4 ) );
		aNumbers.push( parseInt( self.WB5 ) );

		// Sort the ticket numbers
		aNumbers.sort( function (a, b) {
			if (a < b) {
				return -1;
			}
			else if (a > b) {
				return 1;
			}

			return 0;
		});

		// Assign the sorted numbers back to the ticket
		for ( ; i < aNumbers.length; i++ ) {
			self['WB' + ( i + 1 )] = aNumbers[ i ];
		}
	};


	// If the ticket was initialized with data, initialize the
	// object members with that data
	if ( oData ) {
		self.init( oData );
	}


	// API
	return {
		DrawDate: self.DrawDate,
		Numbers: self.rawNumbers,
		PB: self.PB,
		PP: self.PP,
		WB1: self.WB1,
		WB2: self.WB2,
		WB3: self.WB3,
		WB4: self.WB4,
		WB5: self.WB5
	};
};