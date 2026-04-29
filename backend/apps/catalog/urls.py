"""apps.catalog URL conf."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalog.views import CategoryViewSet, ProjectViewSet, verify_manage

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("projects", ProjectViewSet, basename="project")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/verify/", verify_manage),
]
