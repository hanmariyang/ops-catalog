"""apps.catalog URL conf."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalog.views import CategoryViewSet, GroupViewSet, ProjectViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("groups", GroupViewSet, basename="group")
router.register("projects", ProjectViewSet, basename="project")

urlpatterns = [
    path("", include(router.urls)),
]
