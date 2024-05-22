import AbstractView from "./AbstractView.js";
import { createNotification } from "./Notifications.js";
import { getCookie, sanitizeInput } from "../utilities.js";

export default class User extends AbstractView {
	constructor() {
		super();
		this.user;
		this.email;
		// this.password;
		this.pro_pic;
		this.logged = false;
		this.level;
		this.exp;
		this.online_room;
		this.online_opponent;
		this.disconnected = true;
		this.game_ws = null;
		this.lastURL = null;
	}

	async logout(){
		///Csrf_token
		let csrftoken = await fetch("csrf-token")
		.then(response => response.json())
		.then(data => data.csrfToken);
		console.log(csrftoken);
		///
		await fetch('accounts/logout/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken,
			}
		})
		.then(response => {
			if (response.status > 204) {
				throw new Error(`HTTP status ${response.status}`);
			}
			if (response.status === 200) {
				return response.json();
			}
		})
		.then(data => {
			console.log("Logged out");
			console.log(data);
			createNotification("Successfully logged out");
			this.logged = false;
		})
		.catch((error) => {
			console.error('Error:', error);
		});
	}

	async validateLogin() {
		try{
			var username = (document.getElementById('login-user').value);
			var password = (document.getElementById('login-pass').value);
		} catch (error){
			console.error(error);
			return;
		}
		const csrftoken = await this.getCSRFToken();

		await fetch('accounts/login/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({
				username: username,
				password: password,
			}),
		}).then(response => {
			response.json();
			console.log(response);
			if (response.status === 200) {
				this.logged = true;
			} else {
				createNotification("Wrong username or password");
				this.logged = false;
			}
		}).then(data => console.log(data))
		.catch((error) => {
			console.error('Error: ', error);
		})
	}

	async isLogged() {
		var csrftoken = await this.getCSRFToken();

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
	}

	async loadUserData() {
		const csrftoken = await this.getCSRFToken();

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
				this.setUser(data.username);
				this.setEmail(data.email);
				this.setPic(data.pro_pic);
				this.setLevel(data.level);
				this.setExp(data.exp);
				// this.setPassword(data.password);
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	setPic(data_pic) {
		this.pro_pic = data_pic;
	}

	setUser(data_user) {
		this.user = data_user;
	}
	
	setEmail (data_email) {
		this.email = data_email;
	}

	// setPassword(data_password) {
	//     this.password = data_password;
	// }

	setLevel(data_level){
		this.level = data_level;
	}

	setExp(data_exp){
		this.exp = data_exp;
	}

	getUser() {
		return this.user;
	}

	getEmail() {
		return this.email;
	}
	
	getPic(){ //new
		return this.pro_pic;
	}

	// getPassword() {
	//     return this.password;
	// }

	getLevel(){
		return this.level;
	}

	getExp(){
		return this.exp;
	}

	expProgress(){
		const exp_bar = document.querySelector(".progress-bar");
		const exp = this.getExp();
		const level = this.getLevel();
		const exp_needed = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
		const next_level = exp_needed[level + 1];
		const percentage = (exp / next_level) * 100;
		percentage.toFixed(2);
		exp_bar.style.width = `${percentage}%`;
	}
}