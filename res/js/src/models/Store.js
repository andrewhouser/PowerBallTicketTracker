var Store = function () {
	this.cookieOptions = {
		path: '/',
		toString: function () {
			var aAttribs = [],
			    prop = null;

			for ( prop in this ) {
				if ( this.hasOwnProperty( prop ) ) {
					aAttribs.push( prop +'='+ this[prop] )
				}
			}

			return aAttribs.join(' ;');
		}
	};



	/**
	* Removes a keyed item from storage
	*
	* @method deleteItem
	* @param {String} sKey Name of the item to remove.
	* @return none
	*/
	this.deleteItem = function( sKey ) {
		if ( typeof(Storage) !== undefined ) {
			localStorage.removeItem( sKey );
		}
		else {
			document.cookie = sKey + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		}
	},


	/**
	* Retrieves an item from storage
	*
	* @method getItem
	* @param {String} sKey Name of the item to retrieve.
	* @return {String}
	*/
	this.getItem = function ( sKey ) {
		var aAllCookies = [],
		    sAllCookies = '',
		    sVal = null;

		if ( typeof(Storage) !== undefined ) {
			sVal = localStorage[ sKey ] || null;

			if ( sVal ) {
				sVal = JSON.parse( sVal );
			}
		}
		else {
			sAllCookies = document.cookie;
			aAllCookies = sAllCookies.split(';');

			aAllCookies.map( function ( v, i, a ) {
				var aTemp = v.trim().split('=');
				if ( aTemp[0] == sKey ) {
					sVal = aTemp[1];
				}
			});

		}

		return sVal;
	};


	/**
	* Adds/Updates an item into storage
	*
	* @method setItem
	* @param {String} sKey Name of the item to place in storage.
	* @param {Mixed} val value to put into storage. Objects will be Stringified.
	* @return none
	*/
	this.setItem = function ( sKey, val ) {
		var sReturn = null;

		if ( !( sKey && val) ) {
			return;
		}

		if (typeof(val) == 'object') {
			val = JSON.stringify( val );
		}

		if ( typeof(Storage) !== undefined ) {
			sReturn = localStorage.setItem( sKey, val );
		}
		else {
			this.setCookieTime();
			document.cookie = sKey +'='+ val +'; '+ this.cookieOptions.toString() +';';
		}

		return true;
	};


	/**
	* Updated the cookie options to a date 1 year from now.
	*
	* @method setCookieTime
	* @return none
	*/
	this.setCookieTime = function () {
		var dDate = new Date();
		dDate.setTime( dDate.getTime() + (365 * 24 * 60 * 60 * 1000) );

		this.cookieOptions.expires = dDate.toUTCString();
	}


	/**
	* API
	*/
	return {
		del: this.deleteItem,
		get: this.getItem,
		set: this.setItem
	}
}();