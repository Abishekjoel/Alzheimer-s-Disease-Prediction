from django.contrib import admin

from patients.models import Case


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ["case_id", "full_name", "sex", "age_years", "blood_group", "created_by", "created_at"]
    search_fields = ["case_id", "full_name"]
    list_filter = ["sex", "blood_group"]
