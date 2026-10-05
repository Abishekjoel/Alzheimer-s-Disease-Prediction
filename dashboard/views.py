from django.shortcuts import render


def index(request):
    """Bare-bones landing page used only for manual smoke-testing of the
    backend while the real frontend is not yet built."""
    return render(request, "dashboard/index.html")
