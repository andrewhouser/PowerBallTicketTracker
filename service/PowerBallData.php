<?php
require "simplehtmldom_1_5/simple_html_dom.php";

class PowerBallData {
	const WINNING_NUMBERS_API = "http://www.powerball.com/powerball/winnums-text.txt";
	const JACKPOT_URL = "http://www.powerball.com/pb_home.asp";


	/**
	* Loads data from a provided url
	*
	* @method get_url
	* @param {String} $request_url
	* @return {String}
	*/
	function get_url( $request_url ) {
		$response = @file( $request_url );

		if ( ! $response ) {
			$curl_handle = curl_init();
			curl_setopt($curl_handle, CURLOPT_URL, $request_url);
			curl_setopt($curl_handle, CURLOPT_CONNECTTIMEOUT, 0);
			curl_setopt($curl_handle, CURLOPT_TIMEOUT, 0);
			curl_setopt($curl_handle, CURLOPT_SSL_VERIFYPEER, FALSE);
			curl_setopt($curl_handle, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
			curl_setopt($curl_handle, CURLOPT_FOLLOWLOCATION, 1);
			curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, TRUE);
			$response = curl_exec($curl_handle);
			$response = explode("\n", $response );
			$http_code = curl_getinfo($curl_handle);
		}

		return $response;
	}


	/**
	* Reads information from the drawing data provided by PowerBall.com
	*
	* @method
	* @param
	* @return
	*/
	function readDraws () {
		return self::get_url( self::WINNING_NUMBERS_API );
	}


	/**
	* Obtains the current jackpot figure by scraping the PowerBall.com website
	*
	* @method readJackpot
	* @return {String}
	*/
	function readJackpot( ) {
		// Create DOM from URL or file
		$html = new simple_html_dom();

		// Read the individual lines from the HTTP response
		$lines = self::get_url( self::JACKPOT_URL );
		// Concatenate the lines into a single string
		$lines = implode("", $lines);

		// Load HTML from a string
		$html->load( $lines );

		// Walk over the DOM to get the plain text jackpot number
		$trIdx = 0;
		foreach ( $html->find('div[id=numbers]') as $div ) {

			foreach ( $div->find('tr') as $tr ) {

				if ( $trIdx == 1 ) {

					$tdIdx = 0;

					foreach ( $tr->find('td') as $td ) {

						if ( $tdIdx == 13 ) {
							return trim( str_replace("&nbsp;", " ", $td->plaintext) );
							break;

						}

						$tdIdx++;
					}
					break;
				}

				$trIdx++;
			}
		}
	}

}
?>