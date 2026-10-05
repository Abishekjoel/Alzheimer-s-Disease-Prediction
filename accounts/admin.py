from django.contrib import admin

from accounts.models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "full_name", "role", "blood_group", "institution", "created_at"]
    list_filter = ["role", "blood_group"]
    search_fields = ["user__username", "user__email", "full_name", "institution"]
