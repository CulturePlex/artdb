from django.conf.urls.defaults import *

urlpatterns = patterns('base.views',
    url(r'^$', 'public_view', name="public_view"),

    url(r'advanced-search/$', 'advanced_search', name="advanced_search"),
    url(r'search-results/$', 'search_results', name="search_results"),

    url(r'contact/$', 'contact', name="contact"),
    url(r'about/$', 'about', name="about"),
    url(r'cite-us/$', 'cite_us', name="cite_us"),
    url(r'terms/$', 'terms', name="terms"),
    url(r'login/$', 'login', name="login")
)
