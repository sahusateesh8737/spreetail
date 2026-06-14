from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, Expense, ExpenseSplit, Settlement

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'members', 'created_at']

class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = ExpenseSplit
        fields = ['id', 'user', 'user_id', 'amount_owed', 'split_type', 'split_details']

class ExpenseSerializer(serializers.ModelSerializer):
    splits = ExpenseSplitSerializer(many=True, read_only=True)
    splits_data = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )
    payer = UserSerializer(read_only=True)
    payer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='payer', write_only=True
    )

    class Meta:
        model = Expense
        fields = ['id', 'group', 'payer', 'payer_id', 'total_amount', 'currency', 'description', 'notes', 'date', 'splits', 'splits_data', 'created_at']

    def create(self, validated_data):
        splits_data = validated_data.pop('splits_data', [])
        expense = Expense.objects.create(**validated_data)
        
        for split in splits_data:
            user_id = split.get('user_id')
            amount_owed = split.get('amount_owed')
            split_type = split.get('split_type', 'equal')
            split_details = split.get('split_details', '')
            
            user = User.objects.get(id=user_id)
            ExpenseSplit.objects.create(
                expense=expense,
                user=user,
                amount_owed=amount_owed,
                split_type=split_type,
                split_details=split_details
            )
        return expense


class SettlementSerializer(serializers.ModelSerializer):
    payer = UserSerializer(read_only=True)
    payee = UserSerializer(read_only=True)

    class Meta:
        model = Settlement
        fields = ['id', 'payer', 'payee', 'amount', 'currency', 'date', 'notes']
