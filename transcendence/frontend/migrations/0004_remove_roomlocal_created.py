# Generated by Django 5.0.4 on 2024-05-13 21:34

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('frontend', '0003_roomlocal_created'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='roomlocal',
            name='created',
        ),
    ]
