/*

Description:  WSD 2018, Group Work, Memory Game

Author: Annina Kettunen

*/
// Game data
var pairs;
var cards = [];
var openedCards = [];
var timerOn = false;
var seconds, minutes, hours, t;
var cardOpen = "";
var pairsFound = 0;
var timeoutOn = false;

// Frame size
var frame_width = 480;
var frame_heigth = 342;

//------------------------------------------------------------------------------
// Send a SETTING message to parent window.
function send_setting_message()
{
    var msg = {};
    msg.messageType = "SETTING";
    msg.options = {
        "width": frame_width, // pixels
        "height": frame_heigth // pixels
    };
    window.parent.postMessage(msg, "*");
}

//------------------------------------------------------------------------------
// Read the number of pairs and create game area based on that number.
function initializeGame() {
	pairs = document.getElementById("pairnumber").value;

	if (pairs == "") {
		pairs = 8;
	} else if (pairs < 2) {
		pairs = 2;
	} else if (pairs > 16) {
		pairs = 16;
	}
	chooseCards();
	createCards();
	buildGameArea();
}	

//------------------------------------------------------------------------------
// Push card-filenames of the cards in this game to an array
function chooseCards() {
	var number = 1;
	while (number <= pairs) {
		var picture = number.toString()+".png";
		
		// The picturename is pushed to the array two times, because in the game
		// there are always two cards with the same picture.
		cards.push(picture);
		cards.push(picture);
		number++;
	}
}

//------------------------------------------------------------------------------
// Create clickable card-elements to the game area.
function createCards() {
	var id = 1;
	while (id <= pairs*2) {
		var card = document.createElement("SPAN");
		var picture = document.createElement("IMG");
		
		// Set attributes to each image-element.
		picture.setAttribute("class", "grid-item");
		picture.setAttribute("id", id.toString());
		picture.setAttribute("src", "card.png");
		picture.setAttribute("onclick", "flipCard('"+"#"+id.toString() +"'," + id.toString() +")");
		
		// The image-element is inside a span-element.
		card.appendChild(picture);
		id++;
		
		// The span-elements are in the game area.
		$("#gamearea").append(card);
	}
}

//------------------------------------------------------------------------------
// Shuffle the cards in the array.
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

//------------------------------------------------------------------------------
// Set the given values as time values.
function updateTime(s, m, h) {
	seconds = s;
	minutes = m;
	hours = h;
}

//------------------------------------------------------------------------------
// Change the current view to game view and flip the cards if this is a new game.
function buildGameArea(startnew = false) {
    $("#startingtexts").hide();
	$("#gameview").show();

	$("#gameon").hide();
	$("#gameOver").hide();
	$("#gamenoton").show();
	updateTime(0,0,0);
	pairsFound = 0;
	$("#pairsfound").text(pairsFound);
	shuffle(cards);
	if (startnew) {
		var i = 1;
		while (i <= pairs*2) {
			var id = "#"+i.toString();
			$(id).attr("src", "card.png");
			i++;
		}
		openedCards.clear();
		$("#timer").text((hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds));
	}
}

//------------------------------------------------------------------------------
// Add one second to time accounting and update the visible timer.
function add() {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
            minutes = 0;
            hours++;
        }
    }
    
    $("#timer").text((hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds));

    timer();
}

//------------------------------------------------------------------------------
// Set variable t as timer and second as the interval.
function timer() {
    t = setTimeout(add, 1000);
}

//------------------------------------------------------------------------------
// Flip the given card, check the current game state and do actions based on that. 
function flipCard(cardID, cardnumber) {
	
	// If all pairs are found, two other cards flipped and checked now or this
	// card flipped, don't do anything.
	if (pairsFound == pairs || timeoutOn || $(cardID).attr("src") != "card.png") {
		return;
	}
	
	// If the real game has not started yet, start the timer, show save-button and
	// hide the guidance text.
	if (timerOn == false) {
		$("#gamenoton").hide();
		$("#gameon").show();
		$("#savebutton").show();
		timer();
		timerOn = true;
	}
	
	// Show the picture of this card, i.e. flip this card.
	$(cardID).attr("src", cards[cardnumber - 1]);
	
	// If there was another card opened in this turn, check if these are pairs.
	if (cardOpen != "") {
		if (cards[cardnumber-1] == cards[parseInt(cardOpen.substr(1)-1)]) {
			// Case 1: They are pairs.
			
			pairsFound++;
			
			// These are left open, which is noted down for the possible save-
			// command.
			openedCards.push(cardID);
			openedCards.push(cardOpen);
			
			// Update the pairs found-text that is visible to the player.
			$("#pairsfound").text(pairsFound);
			
			// If all pairs are found, stop the timer and set game over.
			if (pairsFound == pairs) {
				clearTimeout(t);
				gameOver();
			}
			
			cardOpen = "";
		} else {
			// Case 2: They are not pairs.
			
			// Let the player look the pictures of the cards 2 seconds, before
			// flipping the cards over again.
			timeoutOn = true;
			setTimeout(function() {
				// After 2 seconds flip the cards over and let player flip some
				// other cards again.
				$(cardOpen).attr("src", "card.png");
				$(cardID).attr("src", "card.png");
				cardOpen = "";
				timeoutOn = false;
			}, 2000);	
		}
	} else {
		// There wasn't another card opened in this turn so set this card as the
		// opened card.
		cardOpen = cardID;
	}
}	

//------------------------------------------------------------------------------
// Show game over-stuff and score. Mark down that the timer is not on anymore. 
function gameOver() {
	$("#gameOver").show();
	$("#savebutton").hide();
	$("#scoretext").text(parseInt(pairsFound*pairsFound*pairsFound*100/(hours*60*60+minutes*60+seconds)));
	timerOn = false;
}

//------------------------------------------------------------------------------
// Submit the score to the GameStore. 
function submitScore() {
	var msg = {
        "messageType": "SCORE",
        "score": parseInt($("#scoretext").text())
      };
      window.parent.postMessage(msg, "*");
}

//------------------------------------------------------------------------------
// Save the current game state. 
function saveGame() {
	var msg = {
        "messageType": "SAVE",
        "gameState": {
          "pairsFound": pairsFound,
          "seconds": seconds,
		  "minutes": minutes,
		  "hours": hours,
		  "cards": cards,
		  "openedCards": openedCards,
		  "cardOpen": cardOpen
        }
      };
      window.parent.postMessage(msg, "*");
	  
}

//------------------------------------------------------------------------------
// Send a request to the service for a state to be sent, if there is one.
function load() { 
	var msg = {};
    msg.messageType = "LOAD_REQUEST";
    window.parent.postMessage(msg, "*");
}

//------------------------------------------------------------------------------
// Listen the messages from the service.
window.addEventListener("message", function(evt) {
    if(evt.data.messageType == "LOAD") {
		// Set this game state as it was when the state was saved.
		$("#startingtexts").hide();
		$("#gameview").show();
		$("#gamenoton").hide();
		$("#gameon").show();
		
        pairsFound = evt.data.gameState.pairsFound;
        seconds = evt.data.gameState.seconds;
		minutes = evt.data.gameState.minutes;
		hours = evt.data.gameState.hours;
        cards = evt.data.gameState.cards;
		openedCards = evt.data.gameState.openedCards;
		cardOpen = evt.data.gameState.cardOpen;
		pairs = cards.length/2;
		createCards();
		openedCards.forEach(function(element) {
			$(element).attr("src", cards[parseInt(element.substr(1)-1)]);
		});
		if (cardOpen != "") {
			$(cardOpen).attr("src", cards[parseInt(cardOpen.substr(1)-1)]);
		}
		
		
		// Update the pairs found-text that is visible to the player.
		$("#pairsfound").text(pairsFound);
		
		timer();
		timerOn = true;
		send_setting_message();
		
    } else if (evt.data.messageType === "ERROR") {
        alert(evt.data.info);
    }
});

//----------------------------------------------------------------------------
// Finished initial load. Notify Game Store.
send_setting_message();