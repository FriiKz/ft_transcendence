import AbstractView from "./AbstractView.js";

export function getCSRFToken(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export function acceptFriendRequest(userId) {
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();
    
    // Set the request URL
    var url = "friend/accept/" + userId + "/";
    
    // Set the request method to GET
    xhr.open("GET", url, true);
    
    // Send the request
    xhr.send()
}

export function declineFriendRequest(userId) {
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();
    
    // Set the request URL
    var url = "friend/request/decline/";
    
    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", getCSRFToken('csrftoken'));

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": userId
    });

    // Send the request
    xhr.send(data);
}


export async function removeFriend(){
    // Get the username from the list of friend
    var friendElement = document.getElementById("friends-list").firstChild;
    var text = friendElement.textContent;
    var parts = text.split(", ");
    var friendUsername = parts[1].split(": ")[1];
    console.log(friendUsername);
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();

    // Set the request URL
    var url = "friend/remove/";

    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", getCSRFToken('csrftoken'));

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": friendUsername
    });

    // Send the request
    xhr.send(data);
}


export async function cancelRequest(user){
    // Get the username from the list of friend
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();

    // Set the request URL
    var url = "friend/request/cancel/";

    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", getCSRFToken('csrftoken'));

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": user
    });

    // Send the request
    xhr.send(data);
}

export function sendFriendRequest() {
    // Get the username from the input field
    var username = document.getElementById("friendNameInput").value;

    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();

    // Set the request URL
    var url = "/friend/request/send/";

    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", getCSRFToken('csrftoken'));

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": username
    });

    // Send the request
    xhr.send(data);
}

export default class Friends extends AbstractView {
	constructor() {
		super();
		this.CurrentUsername;
	}

	// getCSRFToken('csrftoken') { //fatta standalone, in teoria possiamo levarla da qua
	// 	const cookieValue = document.cookie
	// 	.split('; ')
	// 	.find(row => row.startsWith('csrftoken='))
	// 	.split('=')[1];
	// 	return cookieValue;
	// }

	async loadData() {
		var csrftoken = getCSRFToken('csrftoken')
        console.log(csrftoken);
		await fetch('/accounts/user_info/', {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				this.CurrentUsername = data.username;
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	// sendFriendRequest() { // anche questa standalone possiamo anche levarla
	// 	// Get the username from the input field
	// 	var username = document.getElementById("username").value;

	// 	// Create a new XMLHttpRequest object
	// 	var xhr = new XMLHttpRequest();

	// 	// Set the request URL
	// 	var url = "/friend/request/send/";

	// 	// Set the request method to POST
	// 	xhr.open("POST", url, true);

	// 	// Set the request headers
	// 	xhr.setRequestHeader("Content-Type", "application/json");
	// 	xhr.setRequestHeader("X-CSRFToken", getCSRFToken('csrftoken'));

	// 	// Set the request body
	// 	var data = JSON.stringify({
	// 		"receiver_user_id": username
	// 	});

	// 	// Send the request
	// 	xhr.send(data);
	// }

	acceptFriendRequest(userId) {
		// Create a new XMLHttpRequest object
		var xhr = new XMLHttpRequest();
		
		// Set the request URL
		var url = "accept/" + userId + "/";
		
		// Set the request method to GET
		xhr.open("GET", url, true);
		
		// Send the request
		xhr.send();
	}

    async getFriendList() {
        var response = await fetch("friend/list/");
        var data = await response.json();
        var friendListElement = document.getElementById("friends-list");
        friendListElement.innerHTML = "";
        console.log("SUCA");
        for (var i = 0; i < data.length; i++) {
            var friendList = data[i];
            var userUsername = friendList.user.username;
            console.log("SUCA1");
            
            for (var j = 0; j < friendList.friends.length; j++) {
                var friendUsername = friendList.friends[j].username;
                var friendElement = document.createElement("div");
                var remove = document.createElement("button");
				remove.id = "Remove-friend";
                remove.innerHTML = "remove";
                remove.onclick = function() {
                    removeFriend(friendUsername);
                        };
                        friendElement.appendChild(remove);

				// friendElement.innerHTML = "User: " + userUsername + ", Friend: " + friendUsername;
				var textNode = document.createTextNode("User: " + userUsername + ", Friend: " + friendUsername);
				console.log(friendUsername);
				friendElement.appendChild(textNode);
				friendListElement.appendChild(friendElement);
			}
		}
	}

    async removeFriend(){
        // Get the username from the list of friend
        var friendElement = document.getElementById("friend-list").firstChild;
        var text = friendElement.textContent;
        var parts = text.split(", ");
        var friendUsername = parts[1].split(": ")[1];
        console.log(friendUsername);
        // Create a new XMLHttpRequest object
        var xhr = new XMLHttpRequest();

        // Set the request URL
        var url = "remove/";

        // Set the request method to POST
        xhr.open("POST", url, true);

        // Set the request headers
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-CSRFToken", getCSRFToken('csrftoken'));

        // Set the request body
        var data = JSON.stringify({
            "receiver_user_id": friendUsername
        });

        // Send the request
        xhr.send(data);
    }

    async getPendingRequests() {
        var response = await fetch("friend/request/list/");
        var data = await response.json();
        var pendingRequestsElement = document.getElementById("pending-requests");
        pendingRequestsElement.innerHTML = "";
        
        for (var i = 0; i < data.length; i++) {
            var request = data[i];
            var senderUsername = request.sender.username;
            var receiverUsername = request.receiver.username;
            
            var requestElement = document.createElement("div");
            if (receiverUsername == this.CurrentUsername)
            requestElement.innerHTML = senderUsername;
            else
            requestElement.innerHTML = receiverUsername;
    
             // Create a button to accept the request
            if (senderUsername !== this.CurrentUsername){
                var acceptButton = document.createElement("button");
                var declineButton = document.createElement("button");
                declineButton.innerHTML = "Decline";
                declineButton.id = "decline-request";
                declineButton.onclick = (function(senderUsername) {
                    return function(){
                        declineFriendRequest(senderUsername);
                    };
                })(senderUsername);
                        
                requestElement.appendChild(declineButton);
                acceptButton.innerHTML = "Accept";
                acceptButton.id = "Accept-request";
                acceptButton.onclick = (function(senderUsername) {
                    return function(){
                        acceptFriendRequest(senderUsername);
                    };
                })(senderUsername);
                        
                requestElement.appendChild(acceptButton);
            }
            else
            {
                var cancelButton = document.createElement("button");
                cancelButton.innerHTML = "Cancel";
                cancelButton.id = "cancel-request";
                cancelButton.onclick = (function(receiverUsername) {
                    return function(){
                        cancelRequest(receiverUsername);
                    };
                })(receiverUsername);
                console.log(receiverUsername);
                requestElement.appendChild(cancelButton);
                

            }
            pendingRequestsElement.appendChild(requestElement);
        }
    }

	async getContent() {
		const friendHTML = `
			<div id="friends-card" class="cards">
				<h2>Friends</h2>
				<br>
				<h3>Send Friend Request</h3>
				<form>
					<input type="text" id="friendNameInput" placeholder="Enter friend's username">
					<button id="friendBtn">Send Request</button>
				</form>
				<br>
				<h3>Pending Requests</h3>
				<div id="pending-requests"></div>
				<br>
				<h3>Friends List</h3>
				<div id="friends-list"></div>
			</div>
		`;
		return friendHTML;
	}
}