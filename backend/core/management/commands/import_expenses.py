import csv
import re
from datetime import datetime
from decimal import Decimal
import math
from django.core.management.base import BaseCommand
from core.models import User, Group, Expense, ExpenseSplit, Settlement
import pandas as pd

class Command(BaseCommand):
    help = 'Imports expenses from the provided CSV file and handles edge cases.'

    def parse_amount(self, amt_str):
        if pd.isna(amt_str) or not amt_str:
            return Decimal('0.00')
        amt_str = str(amt_str).replace(',', '').strip()
        try:
            return Decimal(amt_str)
        except:
            return Decimal('0.00')

    def parse_date(self, date_str):
        if pd.isna(date_str) or not str(date_str).strip():
            return datetime.now().date()
        date_str = str(date_str).strip()
        
        # Handle formats like "Mar-14"
        if re.match(r'[A-Za-z]{3}-\d{2}', date_str):
            try:
                # Assume year 2026 based on other rows
                return datetime.strptime(f"{date_str}-2026", "%b-%d-%Y").date()
            except:
                pass
        
        # Handle "DD-MM-YYYY"
        try:
            return datetime.strptime(date_str, "%d-%m-%Y").date()
        except:
            pass
            
        return datetime.now().date()

    def clean_name(self, name):
        if pd.isna(name) or not str(name).strip():
            return "Unknown"
        n = str(name).strip().lower()
        if n == 'priya s':
            n = 'priya'
        return n.capitalize()

    def handle(self, *args, **kwargs):
        # Clear existing data to avoid duplicates during testing
        ExpenseSplit.objects.all().delete()
        Expense.objects.all().delete()
        Settlement.objects.all().delete()
        Group.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        group = Group.objects.create(name="Spreetail Flatmates")

        df = pd.read_csv('../SpreetailAssignmentExpenses.csv')

        users_dict = {}

        def get_user(name):
            name = self.clean_name(name)
            if name not in users_dict:
                user, _ = User.objects.get_or_create(username=name, defaults={'email': f'{name}@example.com'})
                group.members.add(user)
                users_dict[name] = user
            return users_dict[name]

        for index, row in df.iterrows():
            if pd.isna(row.get('amount')) and pd.isna(row.get('description')):
                continue # Skip empty rows
            
            payer_name = row.get('paid_by')
            payer = get_user(payer_name)

            amount = self.parse_amount(row.get('amount'))
            date = self.parse_date(row.get('date'))
            desc = str(row.get('description')) if not pd.isna(row.get('description')) else ""
            split_type = str(row.get('split_type')).strip().lower() if not pd.isna(row.get('split_type')) else ""
            split_with_raw = str(row.get('split_with')) if not pd.isna(row.get('split_with')) else ""
            split_details = str(row.get('split_details')) if not pd.isna(row.get('split_details')) else ""
            notes = str(row.get('notes')) if not pd.isna(row.get('notes')) else ""
            currency = str(row.get('currency')).strip() if not pd.isna(row.get('currency')) else "INR"

            if not currency or currency.lower() == 'nan':
                currency = "INR"

            # Handle settlement pretending to be an expense
            if split_type == 'nan' or split_type == '':
                # If there's only one person in split_with and no split type, it's likely a settlement
                payee_name = split_with_raw.strip()
                if payee_name:
                    payee = get_user(payee_name)
                    Settlement.objects.create(
                        payer=payer, payee=payee, amount=amount, currency=currency, date=date, notes=desc
                    )
                continue

            split_users = [get_user(u) for u in split_with_raw.split(';') if u.strip()]

            if amount < 0:
                # It's a refund! Treat it as a negative expense
                pass

            expense = Expense.objects.create(
                group=group,
                payer=payer,
                total_amount=amount,
                currency=currency,
                description=desc,
                notes=notes,
                date=date
            )

            if split_type == 'equal':
                num_people = len(split_users)
                if num_people > 0:
                    owed_per_person = amount / Decimal(num_people)
                    for u in split_users:
                        ExpenseSplit.objects.create(
                            expense=expense, user=u, amount_owed=owed_per_person, split_type='equal'
                        )
            
            elif split_type == 'unequal':
                # e.g., "Rohan 700; Priya 400; Meera 400"
                parts = split_details.split(';')
                for part in parts:
                    if not part.strip(): continue
                    name, amt = part.strip().rsplit(' ', 1)
                    u = get_user(name)
                    owed = self.parse_amount(amt)
                    ExpenseSplit.objects.create(
                        expense=expense, user=u, amount_owed=owed, split_type='unequal', split_details=part.strip()
                    )

            elif split_type == 'percentage':
                # e.g., "Aisha 30%; Rohan 30%; Priya 30%; Meera 20%"
                parts = split_details.split(';')
                pcts = []
                for part in parts:
                    if not part.strip(): continue
                    name, pct_str = part.strip().rsplit(' ', 1)
                    pct_val = Decimal(pct_str.replace('%', ''))
                    pcts.append((get_user(name), pct_val, part.strip()))
                
                total_pct = sum(p[1] for p in pcts)
                for u, pct_val, detail in pcts:
                    # Normalize percentages in case they don't equal 100
                    normalized_pct = pct_val / total_pct
                    owed = amount * normalized_pct
                    ExpenseSplit.objects.create(
                        expense=expense, user=u, amount_owed=owed, split_type='percentage', split_details=detail
                    )

            elif split_type == 'share':
                # e.g., "Aisha 1; Rohan 2; Priya 1; Dev 2"
                parts = split_details.split(';')
                shares = []
                for part in parts:
                    if not part.strip(): continue
                    name, share_str = part.strip().rsplit(' ', 1)
                    share_val = Decimal(share_str)
                    shares.append((get_user(name), share_val, part.strip()))
                
                total_shares = sum(s[1] for s in shares)
                if total_shares > 0:
                    for u, share_val, detail in shares:
                        owed = amount * (share_val / total_shares)
                        ExpenseSplit.objects.create(
                            expense=expense, user=u, amount_owed=owed, split_type='share', split_details=detail
                        )

        self.stdout.write(self.style.SUCCESS(f'Successfully imported expenses! Total Users: {User.objects.count()}, Total Expenses: {Expense.objects.count()}'))
