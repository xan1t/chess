from channels.generic.websocket import AsyncWebsocketConsumer
import json
import chess
import time
from .models import Game, Move
from channels.db import database_sync_to_async


class GameConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'game_{self.game_id}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.player_color = await self.assign_player()
        await self.accept()

        game = await self.get_game()

        # Инициализация доски и времени
        if game.board_fen == "start":
            game.board_fen = chess.Board().fen()
            if game.white_time is None:
                game.white_time = None
            if game.black_time is None:
                game.black_time = None
            await self.save_game(game)

        await self.send(text_data=json.dumps({
            "type": "init",
            "color": self.player_color,
            "fen": game.board_fen,
            "white_time": game.white_time,
            "black_time": game.black_time,
            "turn": chess.Board(game.board_fen).turn
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except:
            return

        game = await self.get_game()
        board = chess.Board(game.board_fen)
        now = time.time()

        # Установка времени (для всех игроков)
        if "set_time" in data:
            seconds = int(data["set_time"])
            game.white_time = seconds
            game.black_time = seconds
            await self.save_game(game)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "send_state",
                    "fen": game.board_fen,
                    "white_time": game.white_time,
                    "black_time": game.black_time,
                    "turn": board.turn,
                    "game_over": False,
                    "result": None
                }
            )
            return

        # Игровой ход
        if "move" not in data:
            return

        move_uci = data["move"]
        if len(move_uci) != 4:
            return

        if (board.turn and self.player_color != "white") or \
           (not board.turn and self.player_color != "black"):
            await self.send(json.dumps({"error": "Not your turn"}))
            return

        try:
            move = chess.Move.from_uci(move_uci)
        except:
            return

        if move not in board.legal_moves:
            await self.send(json.dumps({"error": "Illegal move"}))
            return

        if game.last_move_time != 0:
            elapsed = int(now - game.last_move_time)
            if board.turn:
                game.white_time -= elapsed
            else:
                game.black_time -= elapsed
        game.last_move_time = now

        board.push(move)
        game.board_fen = board.fen()

        game_over = False
        result = None
        if board.is_checkmate():
            game_over = True
            result = "checkmate"
        elif board.is_stalemate():
            game_over = True
            result = "stalemate"
        elif game.white_time <= 0:
            game_over = True
            result = "black_win_time"
        elif game.black_time <= 0:
            game_over = True
            result = "white_win_time"

        await self.save_game(game)
        await self.save_move(game, move_uci)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_state",
                "fen": board.fen(),
                "white_time": game.white_time,
                "black_time": game.black_time,
                "turn": board.turn,
                "game_over": game_over,
                "result": result,
                "move": move_uci
            }
        )

    async def send_state(self, event):
        await self.send(text_data=json.dumps(event))

    # ===== DB =====
    @database_sync_to_async
    def get_game(self):
        game, _ = Game.objects.get_or_create(id=self.game_id)
        return game

    @database_sync_to_async
    def save_game(self, game):
        game.save()

    @database_sync_to_async
    def save_move(self, game, move):
        Move.objects.create(
            game=game,
            move_number=game.moves.count() + 1,
            notation=move,
            player_color=self.player_color,
            time_spent=0
        )

    @database_sync_to_async
    def assign_player(self):
        game, _ = Game.objects.get_or_create(id=self.game_id)
        if not game.player_white:
            game.player_white = "taken"
            game.save()
            return "white"
        elif not game.player_black:
            game.player_black = "taken"
            game.save()
            return "black"
        else:
            return "spectator"