import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from core.models import Expense, ChatMessage

User = get_user_model()

class ExpenseChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.expense_id = self.scope['url_route']['kwargs']['expense_id']
        self.room_group_name = f'chat_expense_{self.expense_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        username = text_data_json['username']

        # Save message to database
        await self.save_message(username, message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))

    @database_sync_to_async
    def save_message(self, username, message):
        try:
            user = User.objects.get(username=username)
            expense = Expense.objects.get(id=self.expense_id)
            ChatMessage.objects.create(user=user, expense=expense, text=message)
        except Exception as e:
            print(f"Error saving chat message: {e}")
