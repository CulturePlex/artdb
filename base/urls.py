from django.conf.urls.defaults import *

urlpatterns = patterns('base.views',
    url(r'^$', 'public_view', name="public_view"),

    url(r'advanced_search/$', 'advanced_search', name="advanced_search"),
    url(r'search_results/$', 'search_results', name="search_results"),

    url(r'contact/$', 'contact', name="contact"),
    url(r'about/$', 'about', name="about"),
    url(r'login/$', 'login', name="login")
)
