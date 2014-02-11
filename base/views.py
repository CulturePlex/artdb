from django.shortcuts import HttpResponse, render_to_response
from django.core.urlresolvers import reverse
from django.template import RequestContext
from artworks.models import Artwork, Serie
from creators.models import Creator
from random import randint
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.utils.simplejson import dumps
from django.db.models import Q
from itertools import chain


def public_view(request):
    artworks_images = Artwork.objects.filter(images__isnull=False)
    artwork_ids = artworks_images.values("id")
    random_list = [d['id'] for d in artwork_ids]
    num_artworks = len(random_list)
    random_artwork = None
    random_artwork_image = None
    random_creator = None
    random_creator_image = None
    if num_artworks != 0:
        random_artwork = artworks_images[randint(0, num_artworks - 1)]
        random_artwork_image = random_artwork.images.all()[0]
        creator_image = artworks_images[randint(0, num_artworks - 1)]
        if creator_image.creators.exists():
            random_creator = creator_image.creators.all()[0]
            random_creator_image = creator_image.images.all()[0]
    no_search_box = request.GET.get("no_search", "true")
    return render_to_response('home.html',
                              {"artwork": random_artwork,
                              "artwork_image": random_artwork_image,
                              "artist": random_creator,
                              "creator_artwork_image": random_creator_image,
                              "no_search": no_search_box,
                              }, context_instance=RequestContext(request))


#taken and modified from django snippets
def dynamic_query(model, fields, values, operator):
    """
     Takes arguments & constructs Qs for filter()
     We make sure we don't construct empty filters that would
        return too many results
     We return an empty dict if we have no filters so we can
        still return an empty response from the view
    """
    queries = []
    for (f, v) in zip(fields, values):
        # We only want to build a Q with a value
        if v != "":
            kwargs = {unicode(u'%s__icontains' % f) : unicode(u'%s' % v)}
            queries.append(Q(**kwargs))

    # Make sure we have a list of filters
    if len(queries) > 0:
        q = Q()
        # AND/OR awareness
        i = 0
        if operator == '':
            operator = ['or', 'or']

        operator.insert(0,'or')

        for query in queries:
            if operator[i] == 'and':
                q = q & query
            elif operator[i] == 'or':
                q = q | query
            else:
                q = None
            i = i+1

        if q:
            # We have a Q object, return the QuerySet
            return model.objects.filter(q)
    else:
        # Return an empty result
        return {}


def make_query(object_name, fields, values, operators, page):
    result = None
    if object_name is None:
        if values != '':
            artworks = dynamic_query(Artwork, ["title"], values, '')
            creators = dynamic_query(Creator, ["name"], values, '')
            series = dynamic_query(Serie, ["title"], values, '')
            result = list(chain(artworks, creators, series))
    else:
        query = None
        if len(fields) == 0:
            exec('result = ' + object_name +'.objects.all()')
        else:
            obj = None
            exec('obj = ' + object_name)
            result = dynamic_query(obj, fields, values, operators)
    return result


def advanced_search(request):
    footer = request.GET.get("footer", 'false')
    return render_to_response("search.html",
        {"advanced": reverse("advanced_search"),
         "footer": footer},
         context_instance=RequestContext(request))


def search_results(request):
    artworks = None
    query = None
    template_name = 'search_table.html'
    if request.method == u'GET':
        GET = request.GET
        type_param = GET.get("objectType")
        query_params = GET.getlist("params")
        query_values = GET.getlist("vals")
        query_ops = GET.getlist("ops")
        if type_param is None:
            query_values = GET.getlist("data")
            search_url = "data=" + " ".join(query_values) # basic has footer
        else:
            search_url = "objectType=" + type_param + "&params=" + " ".join(query_params) + "&vals=" + " ".join(query_values) + "&ops=" + " ".join(query_ops)
        page = int(request.GET.get('page', '1'))
        results = make_query(type_param, query_params, query_values, query_ops, page)
        paginator = Paginator(results, 10)
        #results = {'type': type_param, 'params': query_params}
        footer = request.GET.get("footer", 'true')
    if footer == "false":
        template_name = 'search_table_noheaders.html'
    return render_to_response(template_name,
        {"results": paginator.page(page),
         "paginator": paginator,
         "type": type_param,
         "search_url": search_url,
         "data": " ".join(query_values),
         "footer": footer},
         context_instance=RequestContext(request))


def contact(request):
    return render_to_response('contact.html',
    {},
    context_instance=RequestContext(request)
    )


def about(request):
    return render_to_response('about.html',
    {},
    context_instance=RequestContext(request)
    )


def login(request):
    return render_to_response('login.html',
    {},
    context_instance=RequestContext(request)
    )


def cite_us(request):
    return render_to_response('cite_us.html',
    {},
    context_instance=RequestContext(request)
    )


def terms(request):
    return render_to_response('terms.html',
    {},
    context_instance=RequestContext(request)
    )
