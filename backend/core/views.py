from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .models import Group, Expense, ExpenseSplit, Settlement
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer, ExpenseSplitSerializer, SettlementSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password, email=email)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    @action(detail=True, methods=['post'])
    def add_user(self, request, pk=None):
        group = self.get_object()
        username = request.data.get('username')
        try:
            user = User.objects.get(username=username)
            group.members.add(user)
            return Response({'status': 'user added'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date', '-created_at')
    serializer_class = ExpenseSerializer

    @action(detail=False, methods=['get'])
    def balances(self, request):
        users = User.objects.all()
        balances = {user.username: 0 for user in users}

        for exp in Expense.objects.all():
            balances[exp.payer.username] += float(exp.total_amount)

        for split in ExpenseSplit.objects.all():
            balances[split.user.username] -= float(split.amount_owed)

        for settlement in Settlement.objects.all():
            balances[settlement.payer.username] += float(settlement.amount)
            balances[settlement.payee.username] -= float(settlement.amount)

        results = [{"username": u, "net_balance": round(amt, 2)} for u, amt in balances.items()]
        return Response(results)

class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.all().order_by('-date')
    serializer_class = SettlementSerializer

