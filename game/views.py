from django.shortcuts import render
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import Game, Move
import chess

def index(request):
    return render(request, "game/index.html")


def create_game(request):
    game = Game.objects.create(
        board_fen="start",
        player_white=None,
        player_black=None
    )

    return JsonResponse({"game_id": game.id})

def game_list(request):
    games = Game.objects.all().values("id")
    return JsonResponse(list(games), safe=False)

def replay_game(request, game_id):
    return render(request, "game/replay.html", {"game_id": game_id})

def replay_data(request, game_id):
    game = Game.objects.get(id=game_id)
    moves = Move.objects.filter(game=game).order_by("id")

    # начальная доска
    initial_fen = "start"  # по умолчанию
    board = chess.Board()  # пустая стандартная доска

    moves_list = []
    for move in moves:
        
        board.push_uci(move.notation)  # применяем ход
        moves_list.append({
            "notation": move.notation,
            "fen": board.fen()  # текущее положение
        })

    return JsonResponse({
        "initial_fen": board.fen(),  
        "moves": moves_list
    })
def replay_view(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    return render(request, "game/replay.html", {"game": game})