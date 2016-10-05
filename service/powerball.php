<?php
require "dbconn/dbconn.config.php";
require "PowerBallData.php";

// Set the default timezone to New York
date_default_timezone_set ( "America/New_York" );

// Create an instance of the PowerBallData object to transact to
// get live data from the PowerBall site when needed.
$PBD = new PowerBallData();


/**
* Retrieves a list of the drawings data
*
* @method getDraws
* @return {Array}
*/
function getDraws () {
	// Allow this method to access the PowerBallData instance
	global $PBD;

	// Set a flag
	$getFreshData = false;

	// Get the last draw data from the database
	$q = "SELECT * FROM draws ORDER BY DrawDate DESC LIMIT 0, 50";
	$draws = @dbconn_query( $q );

	// If no records were found, set the flag to get new data
	if ( count( $draws ) < 1 ) {
		$getFreshData = true;
	}
	else {
		// Get the date of the last drawings
		list($m, $d, $y) = explode("/", lastDrawDate());
		$lastPublicDraw = mktime(0, 0, 0, $m, $d, $y);

		// Get the drawing date of the first returned record
		list($y, $m, $d) = explode("-", $draws[0]["DrawDate"]);
		$lastDraw = mktime(0, 0, 0, $m, $d, $y);

		// If the last recorded drawing date is older than the
		// last drawing date, set a flag to get new data
		if ( $lastPublicDraw > $lastDraw ) {
			$getFreshData = true;
		}
		// Otherwise, the stored data can be returned
		else {
			//Loop over each record
			for ( $i = 0; $i < count( $draws ); $i++ ) {
				$row = $draws[ $i ];

				// Reformat the drawing data to be consistent with what
				// is returned from the PowerBall site
				list($y, $m, $d) = explode( "-", $row["DrawDate"] );

				// Set a new string in the record to be returned
				$draws[ $i ]["DrawDate"] = "$m/$d/$y";
			}
		}
	}

	// If the data found was not fresh, get new data
	if ( $getFreshData ) {
		// Reset the collection
		$draws = Array();

		// Ask the PowerBallData instance for new drawings data
		$rows = $PBD->readDraws();

		// Create a dictionary of keys in the data to extract
		$dict = Array('DrawDate', 'WB1', 'WB2', 'WB3', 'WB4', 'WB5', 'PB', 'PP');

		// Loop over all the data returned from PowerBall
		for ( $i = 1, $len = count( $rows ); $i < $len; $i++ ) {
			// Create a new object
			$obj = new stdClass();
			// Split the row of data (string) on the spaces
			$parts = preg_split('/\s+/', trim( $rows[$i] ) );

			// Loop over each "field" in each row and map it to an
			// object member.
			for ( $j = 0, $lenj = count( $dict ); $j < $lenj; $j++ ) {
				// Some older PB entries did not have powerplay.
				// Make sure to not try to access a parts index
				// that does not exist.
				if ( $j < count($parts) ) {
					$obj->$dict[ $j ] = $parts[ $j ];
				}
			}

			// Write the new data row to the database
			storeDraw( $obj );

			// Add the row to the collection to be returned
			$draws[] = $obj;
		}
	}

	// return an array of drawing data
	return $draws;
}


/**
* Read the latest jackpot amount from either the database
* or from the powerball website
*
* @method getJackpot
* @return {String}
*/
function getJackpot () {
	// Allow this method to access the PowerBallData instance
	global $PBD;

	// Set a flag
	$getFreshData = false;

	// Get the stored jackpot amount from the database
	$q = "SELECT * FROM jackpot LIMIT 0,1";
	$res = @dbconn_query($q);

	// If no jackpot information was found, set the flag to get new data
	if ( count( $res ) < 1 ) {
		$getFreshData = true;
	}
	else {
		// Get a timestamp for the date the last time jackpot was grabbed
		list($y, $m, $d) = explode("-", $res[0]["dt"]);
		$lastGrab = mktime(0, 0, 0, $m, $d, $y);

		// Get a timestamp for today
		$today = mktime(0, 0, 0, date("m"), date("d"), date("Y") );

		// If the last time the jackpot was grabbed wasn't today,
		// get a new jackpot amount
		if ( $lastGrab < $today ) {
			$getFreshData = true;
		}
		// Otherwise the store jackpot can be returned
		else {
			$jackpot = $res[0]["jackpot"];
		}
	}

	// If the data found was not fresh, get new data
	if ( $getFreshData == true ) {
		// Ask the PowerBallData instance for new jackpot data
		$jackpot = $PBD->readJackpot();

		// Create a MySQL friendly date format (YYYY-MM-DD)
		$thisDate = date("Y-m-d");

		// Store the jackpot in the database
		$q = "INSERT INTO jackpot (id, jackpot, dt) VALUES ('1', '$jackpot', '$thisDate')
				ON DUPLICATE KEY UPDATE jackpot='$jackpot', dt='$thisDate'";
		@dbconn_query( $q );
	}

	// Return the jackpot amount
	return $jackpot;
}


/**
* Returns the last PowerBall drawing date
*
* @method lastDrawDate
* @return {String}
*/
function lastDrawDate () {
	// Get the day of the week index (0=Sunday, 7=Saturday)
	$dayOfWeek = date("w");
	// Set the last drawing date to last Saturday by default
	$lastDrawDate = date("m/d/Y", strtotime("last Saturday"));

	// If today is > Wednesday, set the last drawing date to last Wednesday
	if ( $dayOfWeek > 3 ) {
		$lastDrawDate = date("m/d/Y", strtotime("last Wednesday"));
	}

	// Return the date
	return $lastDrawDate;
}


/**
* Returns the next PowerBall drawing date
*
* @method nextDrawDate
* @return {String}
*/
function nextDrawDate () {
	// Get the day of the week index (0=Sunday, 7=Saturday)
	$dayOfWeek = date("w");
	// Set the next drawing date to next Wednesday by default
	$nextDrawDate = date("m/d/Y", strtotime("next Wednesday"));

	// If today IS Wednesday or Saturday, then the drawing date is today
	if ( $dayOfWeek == 3 || $dayOfWeek == 6 ) {
		$nextDrawDate = date("m/d/Y");
	}
	// If today is > Wednesday, set the last drawing date to next Saturday
	else if ( $dayOfWeek > 3 ) {
		$nextDrawDate = date("m/d/Y", strtotime("next Saturday"));
	}

	// Return the date
	return $nextDrawDate;
}


/**
* Writes a draw row to the DB
*
* @method storeDraw
* @param {Object} $obj
* @return none
*/
function storeDraw ( $obj ) {
	// Format the drawing date in a MySQL friendly format (YYYY-MM-DD)
	list($m, $d, $y) = explode("/", $obj->DrawDate);
	$dd = "$y-$m-$d";

	// Some PowerBall drawings do not have a PowerPlay entry. To prevent PHP errors
	// and warnings, this property is checked and the appropriate SQL INSERT command
	// is created.
	if ( property_exists( $obj, "PP" ) ) {
		$q = "INSERT IGNORE INTO draws (DrawDate, WB1, WB2, WB3, WB4, WB5, PB, PP)
			VALUES ('$dd', '$obj->WB1', '$obj->WB2', '$obj->WB3', '$obj->WB4', '$obj->WB5', '$obj->PB', '$obj->PP')";
	}
	else {
		$q = "INSERT IGNORE INTO draws (DrawDate, WB1, WB2, WB3, WB4, WB5, PB)
			VALUES ('$dd', '$obj->WB1', '$obj->WB2', '$obj->WB3', '$obj->WB4', '$obj->WB5', '$obj->PB')";
	}

	// Push the data into the database
	@dbconn_query( $q );
}


// Create a new object and populate it with data
$pbObj = new stdClass();
$pbObj->jackpot = getJackpot();
$pbObj->nextDrawDate = nextDrawDate();
$pbObj->draws = getDraws();


// Return the created object as JSON
header("Content-type: application/json");
echo json_encode( $pbObj );
?>