import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chess_project.settings')

from django.core.asgi import get_asgi_application


django_asgi_app = get_asgi_application()


from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from game.consumers import GameConsumer

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter([
        path("ws/game/<int:game_id>/", GameConsumer.as_asgi()),
    ]),
})