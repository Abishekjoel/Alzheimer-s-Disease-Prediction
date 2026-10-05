from rest_framework.routers import DefaultRouter

from patients.views import CaseViewSet

app_name = "patients"

router = DefaultRouter()
router.register("cases", CaseViewSet, basename="case")

urlpatterns = router.urls
