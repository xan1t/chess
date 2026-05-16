from django.db import models


class Player(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Game(models.Model):

    board_fen = models.TextField(default="start")

    turn = models.CharField(max_length=5, default="white")  # "white" или "black"

    created_at = models.DateTimeField(auto_now_add=True)
    player_white = models.CharField(max_length=255, null=True, blank=True)
    player_black = models.CharField(max_length=255, null=True, blank=True)
    player_color = models.CharField(max_length=5, null=True, blank=True)  # вместо player_id

    is_started = models.BooleanField(default=False)
    is_finished = models.BooleanField(default=False)
    winner = models.CharField(max_length=10, null=True, blank=True)
    white_time = models.IntegerField(default=600)  # 10 минут (в секундах)
    black_time = models.IntegerField(default=600)   # 10 минут
    last_move_time = models.FloatField(default=0)
    initial_fen = models.CharField(max_length=100, default="start")

    def __str__(self):
        return f"Game {self.id}"


class Move(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='moves')
    move_number = models.IntegerField()

    notation = models.CharField(max_length=10)
    time_spent = models.FloatField()
    player_color = models.CharField(max_length=5, null=True, blank=True)

    def __str__(self):
        return f"{self.move_number}: {self.notation}"