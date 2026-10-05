from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from analysis.models import MRIAnalysis
from patients.models import Case
from patients.serializers import CaseSerializer


class CaseViewSet(viewsets.ModelViewSet):
    """CRUD + search/filter API for research cases (the "Users" section of
    the frontend). Non-staff users only see cases they created; staff/
    admin users can see all cases.

    Supported query params (all optional, combinable):
        search        — matches full_name or case_id (icontains)
        blood_group   — exact match, e.g. "O+"
        sex           — exact match: M | F | U
        prediction    — cases with at least one analysis predicted as
                         this class: CN | MCI | AD
        age_min       — age_years >=
        age_max       — age_years <=
        date_from     — created_at >= (YYYY-MM-DD)
        date_to       — created_at <= (YYYY-MM-DD)
    """

    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Case.objects.select_related("created_by").prefetch_related("analyses")
        if not user.is_staff:
            queryset = queryset.filter(created_by=user)

        params = self.request.query_params

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(Q(full_name__icontains=search) | Q(case_id__icontains=search))

        blood_group = params.get("blood_group", "").strip()
        if blood_group:
            queryset = queryset.filter(blood_group=blood_group)

        sex = params.get("sex", "").strip()
        if sex:
            queryset = queryset.filter(sex=sex)

        age_min = params.get("age_min", "").strip()
        if age_min.isdigit():
            queryset = queryset.filter(age_years__gte=int(age_min))

        age_max = params.get("age_max", "").strip()
        if age_max.isdigit():
            queryset = queryset.filter(age_years__lte=int(age_max))

        date_from = params.get("date_from", "").strip()
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)

        date_to = params.get("date_to", "").strip()
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        prediction = params.get("prediction", "").strip()
        if prediction in dict(MRIAnalysis.PREDICTED_CLASS_CHOICES):
            queryset = queryset.filter(analyses__predicted_class=prediction).distinct()

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
