# pong/consumers.py
import json
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist
from accounts.models import Match, CustomUser
import json
import asyncio
import random

class PongConsumer(AsyncWebsocketConsumer):
    players = {}
    status = {}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spectator = False
        self.spectators = []
        self.shared_state = None  # Class variable to store the shared state
        self.match = None

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "pong_%s" % self.room_name
        self.user = self.scope['user']

        await self.accept()
        self.loop_task = None


        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        if self.room_name not in PongConsumer.players:
            PongConsumer.players[self.room_name] = []
        PongConsumer.players[self.room_name].append(self.user.username)
        
        if self.room_name in PongConsumer.status and PongConsumer.status[self.room_name]:
            winner_of_the_room = await self.get_winner(self.room_name)
            await self.send(text_data=json.dumps({
                'message': 'Game Terminated',
                'victory' : winner_of_the_room
            }))
            await self.close()
            return
        else:
            PongConsumer.status[self.room_name] = False

        if len(PongConsumer.players[self.room_name]) == 1:
            # This is the first user, initialize the state
            self.state = {
                'ball_x': 400,
                'ball_y': 200,
                'ball_speed_x': random.choice([-3, 3]),
                'ball_speed_y': random.choice([-3, 3]),
                'paddle1_y': 150,
                'paddle2_y': 150,
                'score1': 0,
                'score2': 0,
                'up_player_paddle_y': 0,
                'down_player_paddle_y': 0,
                'up_player2_paddle_y': 0,
                'down_player2_paddle_y': 0,
                'player': self.user.username,
                'victory' : "none"
            }
            PongConsumer.shared_state = self.state  # Store the state in the class variable
        elif len(PongConsumer.players[self.room_name]) == 2:
            # This is the second user, inherit the state from the first user
            self.state = PongConsumer.shared_state
            await self.start_game()

        elif len(PongConsumer.players[self.room_name]) > 2:
            # This is a spectator
            self.spectators.append(self.user.username)
            self.spectator = True


        if len(PongConsumer.players[self.room_name]) == 2:
            self.loop_task = asyncio.create_task(self.game_loop())

    async def start_game(self):
        user1 = await self.get_user(PongConsumer.players[self.room_name][0])
        user2 = await self.get_user(PongConsumer.players[self.room_name][1])

        self.match = await self.create_match(user1, user2)


    @database_sync_to_async
    def get_winner(self, room_name):
        try:
            # Query the Match model for a match with the given room name
            # Get the last istance created, if for any reason there is multiple istance with same room_name
            # But based on the way is treated a room it shouldn't happen
            match = Match.objects.filter(room_name=room_name).latest('date')

            # Return the winner's username
            return match.winner.username
        except ObjectDoesNotExist:
            # If no match is found with the given room name, return None
            return None

    @database_sync_to_async
    def set_score(self, match, score, user):
        print(score, user, self.match.user1)
        if (self.match.user1 == CustomUser.objects.get(username=user)):
            match.score_user1 = score
        else:
            match.score_user2 = score
        match.save()

    @database_sync_to_async
    def set_winner(self, match, winner):
        print(winner)
        match.winner = CustomUser.objects.get(username=winner)
        match.save()

    @database_sync_to_async
    def get_user(self, username):
        return CustomUser.objects.get(username=username)

    @database_sync_to_async
    def create_match(self, user1, user2):
        matchs = Match(room_name=self.room_name, user1=user1, user2=user2, score_user1=0, score_user2=0)
        matchs.save()
        return matchs

    async def disconnect(self, close_code):
        # Remove the disconnected user from the players list and cancel the game loop task
        if (self.room_name in PongConsumer.status and PongConsumer.status[self.room_name]):
            return
        if self.user.username in PongConsumer.players[self.room_name]:
            PongConsumer.players[self.room_name].remove(self.user.username)
        # If there are no players left in the room, set status[self.room_name] to True
        if not PongConsumer.players[self.room_name]:
            PongConsumer.status[self.room_name] = True

        if self.loop_task is not None:
            self.loop_task.cancel()

        # If there's only one player left, stop the game and send a "Victory" message
        if len(PongConsumer.players[self.room_name]) == 1:
            PongConsumer.status[self.room_name] = True
            print("SUCA")
            print(PongConsumer.players[self.room_name][0])
            winner = PongConsumer.players[self.room_name][0]
            await self.set_winner(self.match, winner)
            self.state['victory'] = PongConsumer.players[self.room_name][0]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"User {self.scope['user']} disconnected with code {close_code}")

    async def receive(self, text_data):
        message = json.loads(text_data)
        print(f"Message from {message['user']}")
        if self.spectator:
            return
        if 'action' in message:
            action = message['action']
            if self.user.username == PongConsumer.players[self.room_name][0]:
                if action == 'move_up':
                    self.state['up_player_paddle_y'] = 1
                elif action == 'move_down':
                    self.state['down_player_paddle_y'] = 1
            else:
                if action == 'move_up':
                    self.state['up_player2_paddle_y'] = 1
                elif action == 'move_down':
                    self.state['down_player2_paddle_y'] = 1

    async def move_paddle_up(self, player):
        if player == PongConsumer.players[self.room_name][0]:
            print("paddle1_y", self.state['paddle1_y'])
            if self.state['paddle1_y'] > 0:
                self.state['paddle1_y'] -= 5
        else:
            if self.state['paddle2_y'] > 0:
                self.state['paddle2_y'] -= 5

    async def move_paddle_down(self, player):
        if player == PongConsumer.players[self.room_name][0]:
            print("paddle1_y", self.state['paddle1_y'])
            if self.state['paddle1_y'] < 300:
                self.state['paddle1_y'] += 5
        else:
            if self.state['paddle2_y'] < 300:
                self.state['paddle2_y'] += 5

    async def game_loop(self):
        while (PongConsumer.status[self.room_name]) == False:
            await asyncio.sleep(0.01)
            if self.spectator:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state',
                        'state': self.state
                    }
                )
                continue
            # Move paddles based on player input
            if self.state['up_player_paddle_y'] == 1:
                print("up_player_paddle_y")
                await self.move_paddle_up(PongConsumer.players[self.room_name][0])
                self.state['up_player_paddle_y'] = 0
            if self.state['down_player_paddle_y'] == 1:
                await self.move_paddle_down(PongConsumer.players[self.room_name][0])
                self.state['down_player_paddle_y'] = 0
            if self.state['up_player2_paddle_y'] == 1:
                await self.move_paddle_up(PongConsumer.players[self.room_name][1])
                self.state['up_player2_paddle_y'] = 0
            if self.state['down_player2_paddle_y'] == 1:
                await self.move_paddle_down(PongConsumer.players[self.room_name][1])
                self.state['down_player2_paddle_y'] = 0


            # Update ball position
            self.state['ball_x'] += self.state['ball_speed_x']
            self.state['ball_y'] += self.state['ball_speed_y']

            # Collision with top and bottom walls
            if self.state['ball_y'] <= 0:
                self.state['ball_speed_y'] = -self.state['ball_speed_y']
            if self.state['ball_y'] >= 400:
                self.state['ball_speed_y'] = -self.state['ball_speed_y']

            # # Collision with paddles
            if (
                self.state['ball_x'] <= 10
                and self.state['paddle1_y'] <= self.state['ball_y'] <= self.state['paddle1_y'] + 100
            ):
                self.state['ball_speed_x'] = -self.state['ball_speed_x']
            if (
                self.state['ball_x'] >= 790
                and self.state['paddle2_y'] <= self.state['ball_y'] <= self.state['paddle2_y'] + 100
            ):
                self.state['ball_speed_x'] = -self.state['ball_speed_x']
            # Scoring
            if self.state['ball_x'] <= 0:
                self.state['score2'] += 1
                await self.set_score(self.match, self.state['score2'], PongConsumer.players[self.room_name][1])
                self.state['ball_x'] = 400
                self.state['ball_y'] = 200
                self.state['ball_speed_x'] = +self.state['ball_speed_y'] #can be used to increase the speed of the ball
                self.state['ball_speed_y'] = +self.state['ball_speed_y'] 
            elif self.state['ball_x'] >= 800:
                self.state['score1'] += 1
                await self.set_score(self.match, self.state['score1'], PongConsumer.players[self.room_name][0])
                self.state['ball_x'] = 400
                self.state['ball_y'] = 200
                self.state['ball_speed_x'] = +self.state['ball_speed_y']
                self.state['ball_speed_y'] = +self.state['ball_speed_y'] 
            if self.state['score1']  >= 7 or self.state['score2'] >= 7:
                if self.state['score1'] >= 7:
                    await self.set_winner(self.match, PongConsumer.players[self.room_name][0])
                elif self.state['score2'] >= 7:
                    await self.set_winner(self.match, PongConsumer.players[self.room_name][1])
                PongConsumer.status[self.room_name] = True
                
            # Send updated game state to all clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )
        if self.room_name in PongConsumer.status and PongConsumer.status[self.room_name]:
            print("THE winner is", self.match.winner)
            self.state['victory'] = self.match.winner.username
            await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state',
                'state': self.state
            }
            )
            await asyncio.sleep(1)  # Wait for 1 second
            await self.close()
            return

    async def handle_message(self, event):
        message_type = event['type']
        if message_type == 'game_state':
            # We already have a handler for the game_state message
            pass  # Do nothing for now (game state is handled

    async def game_state(self, event):
        # Send the game state to the client
        await self.send(text_data=json.dumps(event['state']))