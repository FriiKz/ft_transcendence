import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import { changeLanguage, navigateTo } from "../index.js";
import Pong from "./Pong.js";

export default class FriendlyMatch extends AbstractView {
    constructor(user) {
        super();
        this.user = user;
        this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
        this.roomName = "undefined";
        this.opponent = "undefined";
        this.initialize();
    }

    async initialize() {
        await this.getFriendlyMatchList();
    }

    async setOpponent(opponent)
    {
        this.opponent = opponent;
    }

    async getFriendInfo(user) {
        var csrftoken = this.getCSRFToken();
		await fetch('/accounts/guser_info/?username=' + user, {
            method: 'GET',
			headers: {
                'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		}).then(response => response.json())
        .then(data => {
            console.log(data.user);
            this.user.online_opponent.username = data.user.username;
            this.user.online_opponent.pro_pic = data.user.pro_pic;
            this.user.online_opponent.level = data.user.level;
            // this.setOpponent_pic(data.pro_pic)
        })
        .catch((error) => {
            console.error('Error:', error);
        })
    }

    async cancelroom(name) {
        var csrftoken = await getCSRFToken();
        await fetch('/delete_room/', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({name: name})
        }).then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        })
    }

    async getFriendlyMatchList() {
        try {
            const response = await fetch('/rooms_list/');
            const rooms = await response.json();
    
            const roomsElement = document.querySelector(".friendlymatch");
            const rommsHTML = `
                <h2>Friendly Match</h2>
                <div class="rooms-list"></div>
                <div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
			    <button type="button" class="submit-btn dashboard-btn" data-translate="back" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
            `;
            roomsElement.innerHTML = rommsHTML;
            const backBtn = document.getElementById("back");
			backBtn.addEventListener("click", e => {
				e.preventDefault();
				navigateTo("/online");
			});
            const roomsList = document.querySelector(".rooms-list");
            const noEntries = document.createElement("span");
		    noEntries.className = "no-entries";
		    noEntries.textContent = "No invites";
            roomsList.appendChild(noEntries);
            rooms.forEach(room => {
                noEntries.remove();
                const roomView = `
                    <div class="request-line">
                        <span class="info" data-username="${room.created_by}">${room.created_by} vs </span>
                        
                        <span class="info" data-username2="${room.opponent}">${room.opponent}</span>
                        <button type="button" class="submit-btn accept-request" data-room-name="${room.name}" data-username="${room.created_by}" data-username2="${room.opponent}"><ion-icon name="checkmark-outline"></ion-icon>Join</button>
                    </div>
                `;
                roomsList.innerHTML += roomView;
                // Add event listeners to your buttons here
            });
            const joinButtons = document.querySelectorAll(".accept-request");
            joinButtons.forEach(button => {
                button.addEventListener("click", async (event) => {
                    const roomName = event.target.getAttribute('data-room-name');
                    const createby = event.target.getAttribute('data-username');
                    const opponent = event.target.getAttribute('data-username2');
                    console.log('Joining room:', roomName, createby, opponent);
                    if (this.user.username === createby) {
                        this.setOpponent(opponent);
                    }
                    else {
                        this.setOpponent(createby);
                    }
                    await this.getFriendInfo(this.opponent)
                    this.roomName = roomName;
                    console.log("ROOM NAME", this.roomName);
                    this.user.online_room = this.roomName;
                    console.log("USER ROOM", this.user.online_room);
                    history.replaceState(null, null, "/pong");
                    this.user.lastURL = "/pong";
                    const view = new Pong(this.user);
                    await view.connect_game();
                    await view.loop();
                });
            });
            const lang = localStorage.getItem('language') || 'en';
            changeLanguage(lang);
        } catch (error) {
            console.error('Failed to fetch rooms list:', error);
        }
    }

    getNav() {
        const navHTML = `
			<a href="/local_game" data-translate="local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" data-translate="online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" data-translate="ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" data-translate="friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.user.pro_pic}"/></a>
		`;
		return navHTML;
    }

    getContent() {
        const FriendlyMatch = `
			<div class="dashboard">
				<div class="friendlymatch"></div>
			</div>
		`;
		return FriendlyMatch;
    }
}