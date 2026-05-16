# Online Chess

Real-time chess game using Django Channels and WebSocket.

## Features

- Two-player real-time game
- Spectator support
- Chess timer
- Legal move validation
- Game state persistence
- FEN board synchronization

## Quick Start

bash

git clone https://github.com/xan1t/chess.git

cd chess

python -m venv venv

venv\Scripts\activate

pip install django channels daphne python-chess whitenoise

python manage.py migrate

daphne chess_project.asgi:application

Open http://127.0.0.1:8000


How to Play

First player opens the page -> white pieces

Second player opens the same URL -> black pieces

Before the game starts, each player enters the game duration in seconds. 

All other connections become spectators

Moves are sent via WebSocket. The board synchronizes instantly.


Tech Stack

Django + Channels (WebSocket, ASGI)

Daphne (ASGI server)

python-chess (chess logic)

JavaScript (board rendering)

WhiteNoise (static files)

License

MIT
