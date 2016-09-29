queue()
.defer(d3.json, "js/us-states.json")
.defer(d3.csv, "state_centers_abbr.csv")
.defer(d3.csv, "all_state.csv")
.await(function(error, us, centers, data) {
    var margin = {top: 20, right: 20, left: 20, bottom: 80};
    var date_parse = d3.time.format("%m-%y").parse;
    var colors = ['#ffffd4','#fed98e','#fe9929','#d95f0e','#993404'];
    var state_list = {AL:"Alabama", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado", CT:"Connecticut", DE:"Delaware", FL:"Florida", GA:"Georgia", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming"};
    var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    var date_text = d3.select("#date-text");

    data.forEach(function(d) {
      //  var coords = _.find(centers, function(g) {
      //     return d.state === g.state;
      //  });

        d.date = date_parse(d.month + '-' + d.year);
        d.season = findSeason(d.month);

       /* if(coords !== undefined) {
            d.lat = coords.lat;
            d.lng = coords.lng;
        } */
    });

    var map_svg = d3.select('#map').append('svg')
            .attr("vector-effect", "non-scaling-stroke")
            .append('g').attr("id", "base_map");

    var timer = chroniton()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .labelFormat(d3.time.format('%m-%Y'))
            .height(75)
        .playbackRate(.45);

    var render = _.debounce(function() {
        var map_height = window.innerHeight;
        var height = map_height - margin.top - margin.bottom;
        var width = window.innerWidth - margin.left - margin.right;

        // Create the slider
        timer.width(width)
            .on('change', function(d) {
                var month = d.getMonth() + 1;
                var month_string = (month < 10) ? '0' + month : month;
                var year = d.getFullYear().toString().substr(2);

                var vals = data.filter(function(d) {
                    return d.year == year && d.month == month_string;
                });

                date_text
                    .transition()
                    .duration(200)
                    .ease("sin-in-out")
                    .text(stringDate(vals[0].month) + ' 20' + vals[0].year);

                for(var l=0; l<5; l++) {
                    var selector = d3.selectAll(".level_" + l);

                    selector.transition()
                        .duration(200)
                        .ease("sin-in-out")
                        .attr("r" ,function(d) {
                            return findValue(d, vals, l);
                        });

                    note(vals, selector);
                }
            });

        d3.select("#play").on('click', function() { timer.play(); });
        d3.select("#pause").on('click', function() { timer.pause(); });
        d3.select("#stop").on('click', function() { timer.stop(); });

        d3.select("#slider").call(timer);

        /* Draw the map */
        var scale = 1,
            projection = d3.geo.albersUsa()
                .scale(scale)
                .translate([0,0]);

        // Calculate bounds to properly center map
        var path = d3.geo.path().projection(projection);
        var bounds = path.bounds(us);
        scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / map_height);
        var translation = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
            (map_height - scale * (bounds[1][1] + bounds[0][1])) / 2];

        // update projection
        projection = d3.geo.albersUsa().scale(scale).translate(translation);
        path = path.projection(projection);

        d3.select("#map svg").attr('height', map_height)
            .attr('width', width);

        var map_draw = map_svg.selectAll("path")
            .data(us.features);

        map_draw.enter()
            .append("path");

        map_draw.attr("d", path);

        map_draw.exit().remove();

        /* Add circles */
        var center_vals = data.filter(function(d) {
            return d.year == "00" && d.month == "01";
        });

        d3.selectAll("#map circle").remove();
        var circles = map_svg.selectAll("circle")
            .data(centers);

        for(var i=0; i<5; i++) {
            circles.enter().append("circle");

            circles.attr("class", "level_" + i)
                .attr("cx", function(d) {
                    return projection([d.lng, d.lat])[0];
                }).attr("cy", function(d) {
                    return projection([d.lng, d.lat])[1];
                }).attr("r", function(d) {
                    return findValue(d, center_vals, i);
                }).style("stroke", colors[i]);

            var selected = d3.selectAll("circle.level_" + i);
            note(center_vals, selected);
        }

        circles.exit().remove();

        pctLegend("#pct_legend");
        colorLegend("#color_legend", colors);
        compareLevels(colors);

        // Seasons
        var us_all = data.filter(function(d) {
            return d.state === 'us_all';
        });

        us_all.forEach(function(d) {
            d.season = findSeason(d.month);
        });

        var ca_all = data.filter(function(d) {
            return d.state === 'CA';
        });
        var nested = d3.nest()
            .key(function(d) { return d.month; })
            .rollup(function(values) {
                return valueList(values);
            })
            .entries(ca_all);

        function valueList(values) {
            return {
                nothing: d3.mean(values, function(d) {return d.nothing; }),
                "D0": d3.mean(values, function(d) {return d["D0"]; }),
                "D1": d3.mean(values, function(d) {return d["D1"]; }),
                "D2": d3.mean(values, function(d) {return d["D2"]; }),
                "D3": d3.mean(values, function(d) {return d["D3"]; }),
                "D4": d3.mean(values, function(d) {return d["D4"]; })
            };
        }

        function stringDate(month) {
            var month_names = ["January", "February", "March",
                "April", "May", "June",
                "July", "August", "September",
                "October", "November", "December"];

            var month_num = parseInt(month, 10) - 1;

            return month_names[month_num];
        }

        function whichState(values, d) {
            return _.find(values, function(e) {
                return d.state === e.state;
            });
        }

        function findValue(d, vals, iteration) {
            var state = whichState(vals, d);
            return state['D' + iteration] * .2;
        }

        function note(values, selector) {
            function formatted(value) {
                return  (value == 100.0) ? 100 : value;
            }

            selector.on('mouseover touchstart', function(d) {
                var state = whichState(values, d);

                div.transition()
                    .duration(100)
                    .style("opacity", .9);

                div.html(
                        '<h4 class="text-center">' + state_list[state.state] + '</h4>' +
                            '<h5  class="text-center">Drought Levels (% of state)</h5>' +
                            '<div class="row">' +
                            '<div class="col-md-6">' +
                            '<ul class="list-unstyled first">' +
                            '<li>D0: ' + formatted(state['D0']) + '%</li>' +
                            '<li>D1: ' + formatted(state['D1']) + '%</li>' +
                            '<li>D2: ' + formatted(state['D2']) + '%</li>' +
                            '</ul>' +
                            '</div>' +
                            '<div class="col-md-6">' +
                            '<ul class="list-unstyled last">' +
                            '<li>D3: ' + formatted(state['D3']) + '%</li>' +
                            '<li>D4: ' + formatted(state['D4']) + '%</li>' +
                            '</ul>' +
                            '</div>' +
                            '</div>'
                    )
                    .style("top", (d3.event.pageY+18)+"px")
                    .style("left", (d3.event.pageX-15)+"px");
            })
            .on('mouseout touchend', function(d) {
                div.transition()
                   .duration(250)
                   .style("opacity", 0);
            });
        }
    }, 400);

    function findSeason(value) {
        var month = parseInt(value);

        switch(month) {
            case 12:
            case 1:
            case 2:
               return "winter";
               break;
            case 3:
            case 4:
            case 5:
               return "spring";
               break;
            case 6:
            case 7:
            case 8:
                return "summer";
                break;
            case 9:
            case 10:
            case 11:
                return "fall";
                break;
            default:
                return "unknown";
        }
    }

    function pctLegend(selector) {
        var compare = document.querySelectorAll(selector + ' svg');
        if(compare.length) return;

        var vals = _.range(3, 25, 5);
        var width = 350;
        var spacing = [60, 80, 110, 150, 200];

        var legend = d3.select(selector)
            .append("svg")
            .attr("width", width)
            .attr("height", 55)
            .attr("class", "legend")
            .translate([35, 0]);

        legend.append("text")
            .attr("x", 1)
            .attr("y", 35)
            .attr("height",30)
            .attr("width", 25)
            .text("Smaller");

        legend.selectAll('g').data(vals)
            .enter()
            .append('g')
            .attr("width", width)
            .each(function(d, i) {
                var g = d3.select(this);

                g.append("circle")
                    .attr("cx", spacing[i])
                    .attr("cy", 15)
                    .attr("r", function(d) { return d; })
                    .translate([0, 15]);
            });

        legend.append("text")
            .attr("x", 233)
            .attr("y", 35)
            .attr("height",30)
            .attr("width", 25)
            .text("Greater");
    }

    function colorLegend(selector, colors) {
            var compare = document.querySelectorAll(selector + ' svg');
            if(compare.length) return;

            var keys = ['Abnormally Dry (D0)', 'Moderate (D1)', 'Severe (D2)', 'Extreme (D3)', 'Exceptional (D4)'];
            var width = 600;

            var legend = d3.select(selector)
                .append("svg")
                .attr("width", width)
                .attr("height", 55)
                .attr("class", "legend");

            var j = 10;

            legend.selectAll('g').data(keys)
                .enter()
                .append('g')
                .attr("width", width)
                .each(function(d, i) {
                    var g = d3.select(this);
                    g.attr("class", colors[i] + " legend_value")

                    g.append("rect")
                        .attr("x", j)
                        .attr("y", 15)
                        .attr("width", 10)
                        .attr("height", 10)
                        .style("fill", colors[i]);

                    g.append("text")
                        .attr("x", j + 15)
                        .attr("y", 25)
                        .attr("height",30)
                        .attr("width", d.length * 50)
                        .text(d);
                    var add = i == 0 ? 55 : 45;
                    j += (d.length * 5) + add;
                });
        }

        function compareLevels(colors) {
            var compare = document.querySelectorAll('#circ_legend svg');
            if(compare.length) return;

            var annotations = [
                {
                    "xVal": 125,
                    "yVal": 100,
                    "path": "M-58,-109L5,-108",
                    "text": "Abnormally Dry (D0)",
                    "textOffset": [9, -103]
                },
                {
                    "xVal": 125,
                    "yVal": 100,
                    "path": "M-53,-97L6,-95",
                    "text": "Moderate Drought (D1)",
                    "textOffset": [9, -88]
                },
                {
                    "xVal": 125,
                    "yVal": 100,
                    "path": "M-55,-89L4,-80",
                    "text": "Severe Drought (D2)",
                    "textOffset": [9, -73]
                },
                {
                    "xVal": 125,
                    "yVal": 100,
                    "path": "M-61,-84L4,-65",
                    "text": "Extreme Drought (D3)",
                    "textOffset": [9, -58]
                },
                {
                    "xVal": 125,
                    "yVal": 100,
                    "path": "M-71,-76L3,-51",
                    "text": "Exceptional Drought (D4)",
                    "textOffset": [9, -43]
                }
            ];

            var radii = _.range(5, 35, 5).reverse();

            var circ_legend = d3.select("#circ_legend")
                .append("svg")
                .attr("width", 325)
                .attr("height", 100)
                .attr("class", "legend")
                .translate([35, 20]);

            for(var i=0; i<5; i++) {
                circ_legend.append("circle")
                    .attr("cx", 50)
                    .attr("cy", 15)
                    .attr("r", function(d) {
                        return radii[i];
                    }).style("stroke", function(d) {
                        return colors[i];
                    });
            }

            var swoopy = d3.swoopyDrag()
                .x(function(d){ return d.xVal; })
                .y(function(d){ return d.yVal; })
                .draggable(0);

            swoopy.annotations(annotations);

            d3.select("#circ_legend svg").append('g.annotations').call(swoopy);
        }



    render();
    window.addEventListener('resize', render);

    var rows = d3.selectAll('.row');
    rows.classed('hide', false);
    d3.selectAll('#load').classed('hide', true);
});