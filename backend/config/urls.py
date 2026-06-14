from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import UserViewSet, GroupViewSet, ExpenseViewSet, SettlementViewSet, RegisterView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'settlements', SettlementViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
]
