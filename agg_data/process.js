var fs = require('fs');
var d3 = require('d3');
var _ = require('lodash');
var R = require('ramda');
var stringify = require('csv-stringify');

var base = '../data';
var text_format = d3.format(".01f");

fs.readdir(base, function(err, files) {
    files.forEach(function(file) {
        if(/csv$/.test(file)) {
            fs.readFile(base + '/' + file, 'utf8', function(e, rows) {
                var data = d3.csv.parse(rows);
                var file_base = file.split('.')[0];
                var nested, flat;

                if(/counties/.test(file)) {
                    nested = d3.nest()
                        .key(function(d) { return d.fips; })
                        .key(function(d) { return d.year; })
                        .key(function(d) { return d.month; })
                        .rollup(function(values) {
                            return valueList(values);
                        })
                        .entries(data);

                    flat = flattenThree(nested, file_base.split('-')[0]);
                } else {
                    nested = d3.nest()
                        .key(function(d) { return d.year; })
                        .key(function(d) { return d.month; })
                        .rollup(function(values) {
                            return valueList(values);
                        })
                        .entries(data);

                    flat = flattenTwo(nested, file_base);
                }

                var options = {header: true,
                    columns: [ 'state', 'fips', 'year', 'month', 'nothing', 'D0', 'D1', 'D2', 'D3', 'D4']
                };

                stringify(flat, options, function(e, output){
                    fs.writeFile('data/' + file_base + '.csv', output, function(err) {
                        console.log(err)
                    });
                });


            });
        }
    });
});

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

function flattenTwo(nested_group, type) {
    var flat = [];

    nested_group.forEach(function(d) {
        d.values.forEach(function(e) {
            flat.push({
                state: type,
                fips: '',
                year: d.key,
                month:e.key,
                nothing: text_format(e.values.nothing),
                "D0": text_format(e.values["D0"]),
                "D1": text_format(e.values["D1"]),
                "D2": text_format(e.values["D2"]),
                "D3": text_format(e.values["D3"]),
                "D4": text_format(e.values["D4"])
            });
        });
    });

    return _.sortByAll(flat, ['state', 'year', 'month']);
}

function flattenThree(nested_group, type) {
    var flat = [];

    nested_group.forEach(function(d) {
        d.values.forEach(function(e) {
            e.values.forEach(function(f) {
                flat.push({
                    state: type,
                    fips: d.key,
                    year: e.key,
                    month: f.key,
                    nothing: text_format(f.values.nothing),
                    "D0": text_format(f.values["D0"]),
                    "D1": text_format(f.values["D1"]),
                    "D2": text_format(f.values["D2"]),
                    "D3": text_format(f.values["D3"]),
                    "D4": text_format(f.values["D4"])
                });
            })
        })
    });

    return _.sortByAll(flat, ['state', 'fips', 'year', 'month']);
}