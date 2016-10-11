// function loadLibraries() {
//     var libs = [
//         "/media/js/markerclusterer.js",
//         "/media/js/TimeControl.js",
//     ];
//     var libsLength = libs.length;
//     for (i=0; i<libsLength; i++) {
//         var lib = libs[i];
//         var counter = libsLength;
//         $.getScript(lib, function(code) {
//             counter--;
//             console.log(counter);
//             if (counter == 0) {
//                 initialize();
//             }
//         });
//     }
// }
var map;

function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(10, -30),
        zoom: 3,
        mapTypeControl: false,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        streetViewControl: false
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    google.maps.event.addListenerOnce(map, 'idle', loadClusters);
}

function loadClusters() {
    var markers = [];
    var polygons = [];
    var dateSelectedRange = null;
    var artworkPlaceFilter = "artwork_original_place";
    var markerClusterer = new MarkerClusterer(map, markers, {maxZoom: 10, imagePath: '/media/img/markers/m'});
    var yearFrom, yearTo, urlHash;
    if (location.hash || location.search) {
        urlHash = (location.hash || location.search).substring(1).split("&");
        yearFrom = parseInt(urlHash[0].split("=")[1]);
        yearTo = parseInt(urlHash[1].split("=")[1]);
    }
    if (isNaN(yearFrom) || isNaN(yearTo)) {
        yearFrom = 1675;
        yearTo = 1725;
    }
    var timeControlOptions = {
        css: 'slider',
        id: 'sliderTimeControl',
        start: new Date(1600, 1, 1),
        end: new Date(1800, 1, 1),
        selected: [new Date(yearFrom, 1, 1), new Date(yearTo, 1, 1)],
        format: "yy",
        // There's really any other options for zoom yet.
        // zoom: TimeControl.YEAR,
        onStart: onTimeChange,
        onTimeChange: onTimeChange
    };
    var timeControl = new TimeControl('map', timeControlOptions);
    $("#mapContainer").prepend(timeControl.container);

    var filterControl = function() {
        var container = document.createElement("div");
        var filterDiv = $("<DIV>");
        var filterLabel = $("<LABEL>");
        var filterSelect = $("<SELECT>");
        var filterOptionsValues = ["artwork_original_place",
                                   "artwork_current_place"];
        var filterOptionsTexts = ["original location",
                                  "current location"];
        filterSelect.attr("id", "filterSelect");
        filterSelect.attr("name", "filterSelect");
        for(i=0; i<2; i++) {
            var filterOption = $("<OPTION>")
            filterOption.html(filterOptionsTexts[i]);
            filterOption.attr("value", filterOptionsValues[i]);
            filterSelect.append(filterOption);
        }
        filterLabel.attr("for", "filterSelect");
        filterLabel.html("Filter by");
        filterDiv.append(filterLabel);
        filterDiv.append(filterSelect);
        filterSelect.change(function() {
            artworkPlaceFilter = $(this).val();
            onTimeChange(timeControl.selected, timeControl.range);
        });
        filterDiv.attr("href", "javascript:void(0);");
        filterDiv.addClass("filterMapControl");
        $(container).append(filterDiv);
        return container;
    }
    $("#mapContainer").prepend(filterControl());

    function onTimeChange(selected, range) {
        if (range) {
            var yearStart = selected[0].getUTCFullYear();
            var yearEnd = selected[1].getUTCFullYear();
            var url = "/artworks/locations/"+ yearStart +"/to/"+ yearEnd +"/";
            var bounds = map.getBounds();
            if (typeof(bounds) !== "undefined") {
                var southWest = bounds.getSouthWest();
                var northEast = bounds.getNorthEast();
                var data = {
                    south_west_longitude: southWest.lng(),
                    south_west_latitude: southWest.lat(),
                    north_east_longitude: northEast.lng(),
                    north_east_latitude: northEast.lat(),
                    filter: artworkPlaceFilter
                }
                $("#progress").show();
                // $("#progress").progressbar("destroy");
                $("#progress").progressbar({ value: false });
                $.getJSON(url, data, drawClusters);
                dateSelectedRange = "from="+ yearStart +"&to="+ yearEnd;
            }
        }
    }

    function drawClusters(data) {
        if (markerClusterer && markerClusterer.clearMarkers) {
            markerClusterer.clearMarkers();
        }
        markers = [];
        polygons = [];
        // map.clearOverlays();
        $("#progress").progressbar('value', 1);
        var parentMap = map;
        var factor = (100-2) / data.length;
        for(i=0; i<data.length; i++) {
            var item = data[i];
            if (parseInt(i*factor) != parseInt((i-1)*factor)) {
                $("#progress").progressbar('value', parseInt(i*factor));
            }
            if (item.coordinates) {
                var geometry = getGeometryFromWKT(item.coordinates, item.geometry, item.place);
                if (geometry instanceof google.maps.Marker) {
                    var parentItem = item;
                    geometry.identifier = item.identifier;
                    geometry.place = item.place;
                    google.maps.event.addListener(geometry, "click", function(e) {
                        var url = "/artworks/locations/"+ this.identifier +"/list/";
                        var parentMarker = this;
                        $.getJSON(url, {"type": artworkPlaceFilter}, function(json_data) {
                            var html = "";
                            for(var j=0; j<json_data.length; j++) {
                                var elto = json_data[j];
                                html += "<li><a href='"+ elto.url +"'>"+ elto.title +"</a> ("+ elto.creators +")</li>";
                            }
                            var infowindow = new google.maps.InfoWindow({
                              content: "<span class='infoWindow'><div class='artworkTitle'>"+ parentMarker.place +" ["+ json_data.length +"]</div><div class='artworkList'><ol>"+ html +"</ol></div></span>",
                              maxHeight: 150,
                              maxWidth: 500
                            });
                            infowindow.open(map, parentMarker);
                        });
                    });
                    markers.push(geometry);
                }
            }
        }
        markerClusterer.addMarkers(markers);
        $("#progress").hide();
    }

    markerArtwork = {};
    markerArtwork.image = {
        url: '/media/img/markers/image.png',
        size: new google.maps.Size(28, 38),
        anchor: new google.maps.Point(14, 38),
        origin: new google.maps.Point(0, 0)
    }
    markerArtwork.shape = [19,0,21,1,22,2,23,3,24,4,25,5,26,6,26,7,27,8,27,9,27,10,27,11,27,12,27,13,27,14,27,15,27,16,27,17,27,18,27,19,27,20,26,21,25,22,25,23,24,24,23,25,21,26,20,27,19,28,18,29,17,30,17,31,16,32,16,33,16,34,16,35,15,36,15,37,9,37,8,36,8,35,7,34,6,33,5,32,5,31,5,30,5,29,5,28,5,27,6,26,5,25,4,24,3,23,2,22,1,21,1,20,0,19,0,18,0,17,0,16,0,15,0,14,0,13,0,12,0,11,0,10,0,9,0,8,1,7,1,6,2,5,3,4,4,3,5,2,6,1,8,0];

    markerWorld = {};
    markerWorld.image = {
        url: '/media/img/markers/world.png',
        size: new google.maps.Size(28, 38),
        anchor: new google.maps.Point(14, 38),
        origin: new google.maps.Point(0, 0)
    };
    markerWorld.shape = [19,0,21,1,22,2,23,3,24,4,25,5,26,6,26,7,27,8,27,9,27,10,27,11,27,12,27,13,27,14,27,15,27,16,27,17,27,18,27,19,27,20,26,21,25,22,25,23,24,24,23,25,21,26,20,27,19,28,18,29,17,30,17,31,16,32,16,33,16,34,16,35,15,36,15,37,9,37,8,36,8,35,7,34,6,33,5,32,5,31,5,30,5,29,5,28,5,27,6,26,5,25,4,24,3,23,2,22,1,21,1,20,0,19,0,18,0,17,0,16,0,15,0,14,0,13,0,12,0,11,0,10,0,9,0,8,1,7,1,6,2,5,3,4,4,3,5,2,6,1,8,0];

    function getGeometryFromWKT(wkt_point, wkt_geometry, title) {
        multipolygonRegExp = /^MULTIPOLYGON\s*\(\(\((([+-]?\d+(\.\d+)? [+-]?\d+(\.\d+)?,\s*)+([+-]?\d+(\.\d+)? [+-]?\d+(\.\d+)?){1})\)\)(,\s*\(\((([+-]?\d+(\.\d+)? [+-]?\d+(\.\d+)?,\s*)+([+-]?\d+(\.\d+)? [+-]?\d+(\.\d+)?){1})\)\))*\)$/;
        multipolygonMatch = wkt_geometry.match(multipolygonRegExp);
        polygonRegExp = /^POLYGON\s*\(\((([+-]?\d+(\.\d+)? [+-]?\d+(\.\d+)?,\s*)+([+-]?\d+(\.\d+)? [+-]?\d+(\.\d+)?){1})\)\)$/;
        polygonMatch = wkt_geometry.match(polygonRegExp);
        pointRegExp = /^POINT\s*\(([+-]?\d+(\.\d+)? [+-]?\d+(\.\d+)?){1}\)$/;
        pointMatch = wkt_point.match(pointRegExp);
        if (multipolygonMatch || polygonMatch) {
            if (multipolygonMatch) {
                polygonsList = wkt_geometry.split(/MULTIPOLYGON\s*\(\s*\(\s*\(\s*(.*)\s*\)\s*\)\s*\)/i)[1].split(/\s*\)\s*\)\s*,\s*\(\s*\(\s*/);
            } else {
                polygonsList = [polygonMatch[1]];
            }
            var polygonsObjects = [];
            for(var p=0; p<polygonsList.length; p++) {
                var polygonString = polygonsList[p];
                var points = [];
                var wktPoints = polygonString.split(", ");
                for(var i=0; i<wktPoints.length; i++) {
                    var wktPoint = wktPoints[i].split(" ");
                    var point = new google.maps.LatLng(wktPoint[1], wktPoint[0]);
                    points.push(point);
                }
                polygonsObjects[polygonsObjects.length] = new google.maps.Polygon({
                    paths: points,
                    strokeColor: "#FF8000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#FF8000",
                    fillOpacity: 0.25
                });
            }
        }
        if (pointMatch) {
            var wktPoint = pointMatch[1].split(" ");
            var point = new google.maps.LatLng(wktPoint[1], wktPoint[0]);
            var marker, markerOptions;
            if (multipolygonMatch || polygonMatch) {
                markerOptions = {
                    icon: markerWorld.image.url,
                    // shape: markerWorld.shape,
                    title: title,
                    position: point
                }
                marker = new google.maps.Marker(markerOptions);
                google.maps.event.addListener(marker, "mouseover", function(e) {
                    var parentMarker = this;
                    for(var ig=0; ig<polygonsObjects.length; ig++) {
                        var polygon = polygonsObjects[ig];
                        polygon.setMap(map);
                    }
                });
                google.maps.event.addListener(marker, "mouseout", function(e) {
                    var parentMarker = this;
                    for(var ig=0; ig<polygonsObjects.length; ig++) {
                        var polygon = polygonsObjects[ig];
                        polygon.setMap(null);
                    }
                });
            } else {
                markerOptions = {
                    icon: markerArtwork.image.url,
                    // shape: markerArtwork.shape,
                    title: title,
                    position: point
                }
                marker = new google.maps.Marker(markerOptions);
            }
            return marker;
        }
    }

}
google.maps.event.addDomListener(window, 'load', initialize);
