import AbstractView from "./AbstractView.js";
import Room from "./Room.js";

export default class extends AbstractView {
	constructor() {
		super();
		this.isValid = false;
		this.user;
		this.email;
		this.room = new Room();
		this.pro_pic;
		// this.validateLogin();
		// this.setTitle("Dashboard");
	}

	async loadUserData() {
		var csrftoken = this.getCookie('csrftoken')
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
				this.setPic(data.pro_pic); //new
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	async validateLogin() {
		try{
			var username = this.sanitizeInput(document.getElementById('login-user').value);
			var password = this.sanitizeInput(document.getElementById('login-pass').value);
		} catch (error){
			console.error(error);
			return;
		}
		var csrftoken = this.getCookie('csrftoken');

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
				this.isValid = true;
			} else {
				alert('Wrong username or password');
			}
			})
			.then(data => console.log(data))
			.catch((error) => {
				console.error('Error: ', error);
		})
	}

	async setPic(data_pic){ //new
		this.pro_pic = data_pic;
	}

	async setUser(data_user) {
		this.user = data_user;
	}
	
	async setEmail (data_email) {
		this.email = data_email;
	}

	async getUser() {
		return this.user;
	}

	async getEmail() {
		return this.email;
	}
	
	async getPic(){ //new
		return this.pro_pic;
	}

	async getNav() {
		const navHTML = `
			<div id="nav-bar">
				<input id="nav-toggle" type="checkbox"/>
				<div id="nav-header"><p id="nav-title">LOGO</p>
				  <label for="nav-toggle"><span id="nav-toggle-burger"></span></label>
				  <hr/>
				</div>
				<div id="nav-content">
				  <div class="nav-button" id="rooms"><i class="icon">&#128187;</i><span>Rooms</span></div>
				  <div class="nav-button" id="friends"><i class="icon">&#128378;</i><span>Friends</span></div>
				  <div id="nav-content-highlight"></div>
				</div>
				<input id="nav-footer-toggle" type="checkbox"/>
				<div id="nav-footer">
				  <div id="nav-footer-heading">
					<div id="nav-footer-avatar"><img alt="Profile picture" src="${await this.getPic()}"/></div>
					<div id="nav-footer-titlebox"><p id="nav-footer-title">${await this.getUser()}</p><span id="nav-footer-subtitle">Noob</span></div>
					<label for="nav-footer-toggle"><span class="icon">^</span></label>
				  </div>
				  <div id="nav-footer-content">
				  	<a id="logout">Logout</a>
				  </div>
				</div>
			</div>
		`;
		return navHTML;
	}

	async getContent() {
		let dashboardHTML = `
			<h1>Dashboard</h1>
			<p>Welcome to the dashboard <span>${await this.getEmail()}</span>.</p>
		`;
		// dashboardHTML += await this.room.getContent();
		return dashboardHTML;
	}
}

//OLD NAV
{/* <ul>
	<li id="user">
	<img src="${await this.getPic()}"></img>
	${await this.getUser()}</li>
	<li><a id="logout">Logout</a></li>
</ul> */}