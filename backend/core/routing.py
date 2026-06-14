from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/expense/(?P<expense_id>\w+)/$', consumers.ExpenseChatConsumer.as_asgi()),
]
