# Generated by Django 5.0.4 on 2024-06-25 20:35

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_remove_chat_users_chat_users'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='name',
            field=models.CharField(default='None', max_length=255, unique=True),
        ),
        migrations.CreateModel(
            name='Chat_RoomName',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('user1', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat_user1', to=settings.AUTH_USER_MODEL)),
                ('user2', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat_user2', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.DeleteModel(
            name='Chat',
        ),
    ]
