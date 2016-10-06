# PowerBall Ticket Tracker

> Stores PowerBall ticket numbers in local Web Storage and calculates ticket winnings based on data provided from the PowerBall site


I play PowerBall from time to time - I'm not ashamed to admit it. I'm also a developer, which - depending who you ask - either makes me inherently lazy or inherently crafty. In either case, holding up a paper ticket to a screen, circling numbers, and reading payout charts is so... I don't know... 90's.

This site allows you to store your ticket entries in your own local Web Storage in your browser. As drawings occur, you can check back to the site for comparision of your tickets against the drawings and automated winning calculations. The data is always local to your web browser - nothing is sent over the network, and no cookies are stored. It even cleans up after itself and will remove unwinning stored tickets after two weeks.



## Build Requirements

- NodeJS

```shell
npm install
```

All required packages will be installed. To build, simply run grunt

```js
grunt build
```

## Run Requirements

- PHP 5.6+
- MySQL (the SQL file for import is in the /server directory)