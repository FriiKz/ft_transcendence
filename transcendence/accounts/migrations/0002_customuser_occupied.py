# Generated by Django 5.0.4 on 2024-05-15 07:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='Occupied',
            field=models.BooleanField(default=False),
        ),
    ]
