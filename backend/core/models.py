from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass

class Group(models.Model):
    name = models.CharField(max_length=255)
    members = models.ManyToManyField(User, related_name='split_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Expense(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses_paid')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    description = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} ({self.total_amount})"

class ExpenseSplit(models.Model):
    SPLIT_TYPE_CHOICES = [
        ('equal', 'Equal'),
        ('unequal', 'Unequal'),
        ('percentage', 'Percentage'),
        ('share', 'Share')
    ]
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expense_splits')
    amount_owed = models.DecimalField(max_digits=12, decimal_places=2)
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPE_CHOICES)
    split_details = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} owes {self.amount_owed} for {self.expense.description}"

class Settlement(models.Model):
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements_paid')
    payee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements_received')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.payer.username} paid {self.payee.username} {self.amount}"

class ChatMessage(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='chat_messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.text[:20]}"
