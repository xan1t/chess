from django.urls import path, include
from . import views


urlpatterns = [
    path("new/", views.create_game),
    path("list/", views.game_list),
    path('<int:game_id>/replay_data/', views.replay_data, name='replay_data'),
    path('<int:game_id>/replay/', views.replay_view, name='replay_view'),
]