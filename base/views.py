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
    artwork_ids = [1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2417, 2444, 2446, 2449, 2506, 6744, 10472, 10478, 12020, 12032, 12347, 12693, 12786, 13262, 13269, 370, 444, 575, 661, 672, 677, 782, 889, 900, 924, 941, 8770, 9560, 9705, 11668, 11885, 1012, 3581, 4069, 6128, 1189, 890, 499, 510, 1168]
    num_artworks = Artwork.objects.filter(id__in=artwork_ids).count()
    if num_artworks != 0:
        random_artwork = Artwork.objects.filter(id__in=artwork_ids)[randint(0, num_artworks-1)]
    else:
        random_artwork = None
    num_creator = Creator.objects.count()
    if num_creator != 0:
        random_creator = Creator.objects.all()[randint(0, num_creator-1)]
    else:
        random_creator = None
    no_search_box = request.GET.get("no_search", "true")
    return render_to_response('home.html',
                              {"artwork": random_artwork, 
                              "artist": random_creator,
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
            kwargs = {str('%s__contains' % f) : str('%s' % v)}
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
            result=list(chain(artworks, creators, series))
    else:
        query = None
        if len(fields) == 0:
            exec('result = '+ object_name +'.objects.all()')
        else:
            obj = None 
            exec('obj = '+ object_name)
            result = dynamic_query(obj, fields, values, operators)
    return result


def advanced_search(request):
    footer = request.GET.get("footer", 'false')
    print request.GET
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
