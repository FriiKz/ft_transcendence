export default class Pong{
    constructor(room_name){
        this.room_name = room_name;
        this.game_ws = "null";
        this.ballX = 0;
        this.ballY = 0;
        this.paddle_width = 10;
        this.paddle_height = 100;
        this.ball_radius = 5;
        this.playerPaddleY = 400 / 2 - this.paddle_height / 2;
        this.opponentPaddleY = 400 / 2 - this.paddle_height / 2;
        this.arrowUpPressed = false;
        this.arrowDownPressed = false;
        this.users = "null";

    }

    async getCSRFToken() {
		let csrftoken = await fetch("csrf-token")
			.then(response => response.json())
			.then(data => data.csrfToken);
			console.log(csrftoken);
		return csrftoken;
	}

    async loadUserData() {
		var csrftoken = await this.getCSRFToken()
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
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	async setUser(data_user) {
		this.users = data_user;
	}


    async connect_game(){
        this.game_ws = new WebSocket(
            'wss://'
            + window.location.hostname
            + ':8000'
            + '/ws/tournament/'
            + this.room_name
            + '/'
        );
    }

    async closeWebSocket() {
        if (this.game_ws) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            await this.game_ws.close();
            console.log("DISCONNECTED FROM WEBSOCKET PONG");
        }
    }

    update(canvas, context) {
        this.updatePaddlePosition();
        // Clear the previous frame
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw player paddle
        context.fillStyle = '#FFFFFF';
        context.fillRect(0,  this.playerPaddleY, this.paddle_width, this.paddle_height);

        // Draw opponent paddle
        context.fillRect(canvas.width - this.paddle_width, this.opponentPaddleY, this.paddle_width, this.paddle_height);

        context.beginPath();
        context.arc(this.ballX, this.ballY, 5, 0, Math.PI * 2);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.closePath();
    }

    updatePaddlePosition() {
        if (this.arrowUpPressed) {
            console.log('sending move_up');
            this.game_ws.send(JSON.stringify({'action': 'move_up', 'user': this.users}));
        }
        if (this.arrowDownPressed) {
            this.game_ws.send(JSON.stringify({'action': 'move_down', 'user': this.users}));
        }
    }

    async loop(){
        const canvas = document.getElementById('pongCanvas');
        const context = canvas.getContext('2d');
        document.addEventListener('keydown', (event) => {
            console.log('keydown', event.key);
            if (event.key === 'ArrowUp') {
                this.arrowUpPressed = true;
                console.log('sending move_up', this.arrowUpPressed);
            } else if (event.key === 'ArrowDown') {
                this.arrowDownPressed = true;
            }
            
        });
        document.addEventListener('keyup', (event) => {
            console.log('keyup', event.key);
            if (event.key === 'ArrowUp') {
                this.arrowUpPressed = false;
            } else if (event.key === 'ArrowDown') {
                this.arrowDownPressed = false;
            }
        });        
        this.update(canvas, context);
        this.game_ws.onmessage = event => {
            const data = JSON.parse(event.data);
            if (data.ball_x !== undefined) {
                this.ballX = data.ball_x;
            }
            if (data.ball_y !== undefined) {
                this.ballY = data.ball_y;
            }
            if (data.paddle1_y !== undefined) {
                this.playerPaddleY = data.paddle1_y;
                // console.log('playerPaddleY', playerPaddleY);
            }
            if (data.paddle2_y !== undefined) {
                this.opponentPaddleY = data.paddle2_y;
            }
            // if (data.score1 !== undefined) {
            //     if (data.player === users)
            //         document.getElementById("score1").innerHTML = "Your Score: " + data.score1;
            //     else
            //         document.getElementById("score1").innerHTML = "Not your Score: " + data.score1;
            // }
            // if (data.score2 !== undefined) {
            //     if (data.player !== users)
            //         document.getElementById("score2").innerHTML = "Your Score: " + data.score2;
            //     else
            //         document.getElementById("score2").innerHTML = "Not your Score: " + data.score2;
            // }
            // if (data.victory != "none"){
            //     console.log(data.victory);
            //     if (users === data.victory)
            //         alert("YOU WIN!" + users)
            //     else
            //         alert("AHAHAH hai PERSO")
            // }

            this.update(canvas, context);
        }
    }

    async getContent() {
        await this.loadUserData();
        await this.connect_game();
        // this.ws.onmessage = function(event){
        //     const data = JSON.parse(event.data);
        //     console.log(data);
        // };
        return  `
                <canvas id="pongCanvas" width="800" height="400"></canvas>
        `;
    }
}