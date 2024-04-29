import { getCookie, register, logout } from "./utilities.js";
import Login from "./views/Login.js";
import About from "./views/About.js";
import Contact from "./views/Contact.js";
import Dashboard from "./views/Dashboard.js";
import Room from "./views/Room.js";
import { invite_to_play } from "./views/Room.js";
import Friends from "./views/Friends.js";
import Info, { getCSRFToken, getusename } from "./views/Info.js";
import { getRequests, sendFriendRequest } from "./views/Requests.js";
import { createNotification } from "./views/Notifications.js";
// import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelRequest, removeFriend } from "./views/Friends.js"

// function activeLink(page) {
//     let oldActive = document.querySelector('a.active');
// 	if (oldActive) {
// 		oldActive.classList.remove('active');
// 	}
// 	let newActive = document.querySelector(`a[href="${page}"]`);
// 	newActive.classList.add('active');
// }

const container = document.querySelector("#container");
const nav = document.querySelector("nav");
const content = document.querySelector("#content");
var refreshRoomList;
// const room = new Room();
let ws;
let username;
const checkRequest = async () => {
	var requestList = await getRequests();
	console.log(requestList);
};

const navigateTo = url => {
	history.pushState(null, null, url);
	router();
};

const is_loggedin = async () => {
    var csrftoken = getCookie('csrftoken');

    return fetch('/accounts/user_info/', {
        method: 'GET',
        headers: {
            'Content-Type' : 'application/json',
            'X-CSRFToken': csrftoken
        }
    })
    .then(response => {
        if (response.ok) {
            return true;
        } else {
            return false;
        }
    });
};

const router = async () => {
	const routes = [
		// { path: "/404", view: NotFound},
		{ path: "/", view: Login },
		{ path: "/about", view: About },
		{ path: "/contact", view: Contact },
		{ path: "/dashboard", view: Dashboard },
		{ path: "/friends", view: Friends }
		// { path: "/pong", view: Pong }
	];
	
	const potentialMatches = routes.map(route => {
		return {
			route: route,
			isMatch: location.pathname === route.path
		};
	});
	
	let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);
	if (!match) {
		match = {
			route: routes[0],
			isMatch: true
		};
	}
	let is_logged_in = await is_loggedin();
	// console.log(is_logged_in);
	// console.log(match.route.path);
	if (match.route.path === "/dashboard") {
		var view = new match.route.view();
		if (is_logged_in === false){
			const isVAlid = await view.validateLogin();
			console.log("SUCA");
			if (!isVAlid){
				navigateTo("/");
				return;
			}
		}
		if (view.isValid === true || is_logged_in === true) {
			if (!ws){
				ws	= new WebSocket('wss://'
				+ window.location.hostname
				+ ':8000'
				+ '/ws/notifications'
				+ '/');
			}
			ws.onmessage = function(event) {
				const data = JSON.parse(event.data);
				console.log(event);
				console.log(data.content);
				if (data.read === false){
					// alert(data.content);
					console.log("SUCASDJNSADJNKSAKDNJASD");
					createNotification(data.content);
					ws.send(JSON.stringify({'action': "read"}));
				}
			}
			// container.classList.add("dashboard");
			await view.loadUserData();
			nav.innerHTML = await view.getNav();
			content.innerHTML = await view.getContent();
			view.userSettings();
			const requestBtn = document.getElementById("requests-btn");
			requestBtn.addEventListener("click", async e => {
				e.preventDefault();
				await view.requestsList();
			}); 
			view.setTitle("Dashboard");// da inserire nei constructor
			// room.updateRoomList();
		}
	} else if (match.route.path === "/friends" && is_logged_in === true) {
		const view = new match.route.view();
		await view.loadUserData();
		nav.innerHTML = await view.getNav();
		content.innerHTML = await view.getContent();
		await view.getFriendList();
		view.searchUser();
		// await view.getPendingRequests();
	} else {
		if (is_logged_in === true)
			navigateTo("/dashboard");
		// container.classList.remove("dashboard");
		// let dashNav = document.getElementById("nav-bar");
		// if (dashNav) {
		// 	dashNav.remove();
		// }
		// nav.setAttribute("style", "display: block;");
		const view = new match.route.view();
		nav.innerHTML = await view.getNav();
		content.innerHTML = await view.getContent();
	}
};

window.addEventListener("popstate", router);

//** API per le History Dei Match*/
// https://127.0.0.1:8001/accounts/match_history/?username=<USERNAME>
// URL per vedere la history dei match,
// tramite il parametro <USERNAME> si può vedere la history dei match di quell'utente
///*/

document.addEventListener("DOMContentLoaded", () => {

	document.body.addEventListener("click", async e => {
		console.log(e.target)
		const form_box = document.querySelector(".form-box");
		const dashboard = document.querySelector(".dashboard");
		if (e.target.matches(".register-btn")) {
			e.preventDefault();
			form_box.classList.add("change-form");
		}
		if (e.target.matches(".info")) {
			e.preventDefault();
			dashboard.classList.add("change-view");
		}
		if (e.target.matches("#requests-btn")) {
			e.preventDefault();
			dashboard.classList.add("change-view");
		}
		if (e.target.matches("#settings-btn")) {
			e.preventDefault();
			dashboard.classList.add("change-setting");
		}
		if (e.target.matches(".login-btn")) {
			e.preventDefault();
			form_box.classList.remove("change-form");
		}
		if (e.target.matches("#back") || e.target.matches("#remove")) {
			e.preventDefault();
			dashboard.classList.remove("change-view");
		}
		if (e.target.matches("[data-link]")) {
			e.preventDefault();
			navigateTo(e.target.href);
		}
		if (e.target.matches("#login-btn")) {
			e.preventDefault();
			navigateTo("/dashboard");
		}
		if (e.target.matches("#createRoomBtn")) {
			console.log("SUCA");
		}
		if (e.target.matches("#cancel-request")){
			e.preventDefault();
			await renderDashboard("friends");
		}
		if (e.target.matches("#decline-request")){			
			e.preventDefault();
			await renderDashboard("friends");
		}
		if (e.target.matches("#Accept-request")){
			e.preventDefault();
			await renderDashboard("friends");
		}
		if (e.target.matches("#Remove-friend"))//**si può levare forse */
			await renderDashboard("friends");
		// if (e.target.matches("#friendBtn")){
		// 	e.preventDefault();
		// 	let user = document.getElementById("friendNameInput").value;
		// 	if (user)
		// 		renderDashboard("friend_info", user);
		// 	else
		// 		alert("Please provide a username")
		// }
		if (e.target.matches("#signup")) {
			await register();
		}
		if (e.target.matches("#logout-btn")) {
            await logout();
			navigateTo("/");
        }
		if (e.target.closest(".nav-button")) {
			let selected = e.target.id;
			if (!selected) {
				selected = e.target.parentElement.id;
			}
			console.log(selected);
			await renderDashboard(selected);
		}
		if (e.target.matches("#nav-title")) {
			await renderDashboard("dashboard");
		}
		if (e.target.matches("#nav-footer-title")) {
			let user = document.getElementById("nav-footer-title").innerHTML;
			await renderDashboard("friend_info", user);
		}
		if (e.target.matches("a[href='/user_info']")){
			e.preventDefault();
			let friend_name = e.target.getAttribute('data-username');
			await renderDashboard("friend_info", friend_name);
			history.pushState(null, '', '/user_info');
		}
		///////////////////NOUOVA PARTE////////////////////////
		//// Manda una richiesta POST per creare una room /////
		//// con "Friend Username" che è il nome dell'amico ///
		//// e    "selfuser" è il nome dell'utente attuale ////
		///////////////////////////////////////////////////////
		if (e.target.matches('#game'))
		{
			let Friend_username = document.getElementById("Username").innerHTML;
			console.log(Friend_username);
			let selfuser = await getusename() // Per ora lascio Admin, ma è solo per provare, è da sostituire con l'username reale di chi sta cliccand PLAY
			console.log(selfuser);
			send_game_request(Friend_username, selfuser);
		}
		/////////////////
	});
	router();
});

//////////////
///Quando invia una richiesta, oltre a creare una room
///Viene creata ed inviata una notifica all'utente che si sfida
async function send_game_request(receiver, selfuser)
{
	let csr = await getCSRFToken();
	const data = {
        name: "1",
        created_by: selfuser,
        to_fight: receiver
    };

    // Send the POST request
    fetch('/pong/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
			'X-CSRFToken': csr
            // Add any other necessary headers, such as CSRF token
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Handle the respons
        console.log(data.name);
		// window.location.href = "/pong/" + data.name + "/";
    })
    .catch(error => {
        // Handle the error
        console.error(error);
    });
}

// content.addEventListener("click", e => {
// 	if (e.target.matches("#signup")) {
// 		register();
// 	}
// 	// console.log("sudsa", e.target);
// 	if (e.target.matches("#logout")) {
// 		logout();
// 	}
// });

async function renderDashboard(render, addArg = null) {
	var view;
	switch(render) {
		case "rooms":
			if (!(view instanceof Room)) {
				view = new Room();
			}
			content.innerHTML = await view.getContent();
			if (refreshRoomList) {
				clearInterval(refreshRoomList);
			}
			
			view.updateRoomList();
			refreshRoomList = setInterval(() => {
					view.updateRoomList();
					console.log("Room list updated");
			}, 5000);
			document.getElementById("createRoomBtn").addEventListener("click", view.btnCreateRoom);
			break;
		case "friends":
			if (refreshRoomList) clearInterval(refreshRoomList);
			view = new Friends();
			content.innerHTML = await view.getContent();
			await view.loadData();
			await view.getPendingRequests();
			await view.getFriendList();
			var friendNameInput = document.getElementById("friendNameInput");
			var dataList = document.createElement("datalist");
			dataList.id = "users";
			friendNameInput.setAttribute("list", "users");
			friendNameInput.parentNode.insertBefore(dataList, friendNameInput.nextSibling);

			friendNameInput.addEventListener("input", function() {
				var inputText = this.value
				fetch(`https://127.0.0.1:8001/accounts/search/?q=${inputText}`)
				.then(response => {
					if (response.status == "404"){
						throw new Error('NO user FOund!');
					}
					return response.json();
				})
				.then(data => {
					// Clear the datalist
					dataList.innerHTML = "";
		
					// Add the users to the datalist
					data.forEach(function(user) {
						var option = document.createElement("option");
						option.value = user.username; // Replace with the actual property name for the username
						dataList.appendChild(option);
					});
				})
				.catch(error => {
					console.log('Error', error);
					alert("Not Found!");
				}
				);
				
			})
			break;
		case "friend_info":
			if (refreshRoomList) clearInterval(refreshRoomList);
			try {
				view = new Info(addArg);
				content.innerHTML = await view.getContent();
				try{
					document.getElementById("sendFriendRequestButton").addEventListener("click", function() {
						sendFriendRequest(view.username);
						renderDashboard("friend_info", view.username);
					});
				}
				catch{
					try{
						/**Play: visibile solo se amici, e crea una room con <"Nome utente di chi manda", "Sfidante">
						 * quando chi manda clicca su Play(Invite to play) e laaromm è stata generata, viene indirizzato
						 * alla room e aspetta che lo sfidante si colleghi alla stessa room per giocare.
						 * Allo sfidante, quando visita il profilo di manda la richiesta, compare "X ti sta sfidando"
						 * se clicca lo porta alla room
						 */
						document.getElementById("Acceptrequest").addEventListener("click", function() {
							acceptFriendRequest(view.username);
							renderDashboard("friend_info", view.username);
						});
						document.getElementById("Declinerequest").addEventListener("click", function() {
							console.log("PRova");
							declineFriendRequest(view.username);
							renderDashboard("friend_info", view.username);
						});
					}
					catch{
						document.getElementById("Cancelrequest").addEventListener("click", function() {
							cancelRequest(view.username);
							renderDashboard("friend_info", view.username);
						});
						/**non fare nulla */
					}
				}
			} catch {
				document.getElementById("RemoveFriend").addEventListener("click", function() {
				removeFriend(view.username);
				renderDashboard("friend_info", view.username);
				});
				document.getElementById("Play").addEventListener("click", function() {
					invite_to_play(view.selfuser, addArg);
					renderDashboard("friend_info", view.username);
				});
				// console.error('Error', error);
				// renderDashboard("friends");
			}
			break;
		default:
			if (refreshRoomList) clearInterval(refreshRoomList);
			view = new Dashboard();
			content.innerHTML = await view.getContent();
	}
}

