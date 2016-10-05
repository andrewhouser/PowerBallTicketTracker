<?php

$mysqli = @new mysqli(dbhost, dbuser, dbpass, dbname);

function dbconn_query($query){
	global $mysqli;

	$recs = Array();
	if ($mysqli->connect_errno) {
		echo "Failed to connect to MySQL: " . $mysqli->connect_error;
		return false;
	}
	else {
		$res = $mysqli->query($query);


		if($res instanceof mysqli_result){
			while($row = $res->fetch_assoc()){
				$recs[] = $row;
			}
			@$res->free();
			@$res->close();
		}
	}
	return $recs;
}
?>