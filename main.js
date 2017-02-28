var App = App || {};

App.map = (function() {

    var el = {
        map: null,
        dataWinterUrl: 'dataWinter2016.geojson',
        dataSummerUrl: 'dataSummer2015.geojson',
        dataWinter: null,
        dataSummer: null,

    };

    var initMap = function() {
        mapboxgl.accessToken = 'pk.eyJ1Ijoiam9leWtsZWUiLCJhIjoiMlRDV2lCSSJ9.ZmGAJU54Pa-z8KvwoVXVBw';

        var params = {
            container: 'map',
            center: [-123.095, 49.26],
            style: 'mapbox://styles/mapbox/dark-v9',
            zoom: 12,
            pitch: 50,
            bearing: 260,
        }

        el.map = new mapboxgl.Map(params);
        el.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        el.map.on('load', loadDataToMap);
    }


    var scaleCo2MixingRatios = d3.scaleLinear()
        .domain([390, 520])
        .range([0, 2000]);

    var scaleCo2Emissions = d3.scaleLinear()
        .domain([-10, 160])
        .range([0, 2000]);

    var hideLegends = function(){
        d3.selectAll("#emissions-legend").style("display", "none");
        d3.selectAll("#mr-legend").style("display", "none");
    }

    var showSelectedLegend = function(item){
        if(item == 'winter-ppm' || item == 'summer-ppm'){
            hideLegends();
            d3.selectAll("#mr-legend").style("display", "block");
        }else{
            hideLegends();
            d3.selectAll("#emissions-legend").style("display", "block");
        }
    }

    var mixingRatioStops = {
        "color": [
            [scaleCo2MixingRatios(408),'#352c3a'], //'#ff3c00'  // '#febe85' // '#352c3a'
            [scaleCo2MixingRatios(419),'#6b3d69'], //'#ce2742'  // '#e79e9e' // '#6b3d69'
            [scaleCo2MixingRatios(434),'#9d3b72'], //'#9d3b72'  // '#974ed7' // '#9d3b72'
            [scaleCo2MixingRatios(451),'#ce2742'], //'#7c3f71' // '#252ae8' // '#ce2742'
            [scaleCo2MixingRatios(474),'#ff3c00'], //'#58395b' // '#3938b4' // '#ff3c00'
            [scaleCo2MixingRatios(518),'#ff0000'] //'#352c3a'  // '#3d3daa' // '#ff0000'
        ],
        "height": [
            [0, scaleCo2MixingRatios(408)],
            [scaleCo2MixingRatios(408), scaleCo2MixingRatios(419)],
            [scaleCo2MixingRatios(419), scaleCo2MixingRatios(434)],
            [scaleCo2MixingRatios(434), scaleCo2MixingRatios(451)],
            [scaleCo2MixingRatios(451), scaleCo2MixingRatios(474)],
            [scaleCo2MixingRatios(474), scaleCo2MixingRatios(518)]
        ]
    };

    
    var emissionsStops = {
        "color": [
            [scaleCo2Emissions(-10),'#1a9850' ], //'#ff3c00'    // '#4bfd4f' // '#352c3a'
            [scaleCo2Emissions(0),"#fee08b" ], //'#ce2742'  //  '#ffffff' // '#6b3d69'
            [scaleCo2Emissions(22),"#fdae61" ], //'#9d3b72' // '#fec370' // '#9d3b72'
            [scaleCo2Emissions(40),"#f46d43" ], //'#7c3f71' //  '#fb7f41' // '#ce2742'
            [scaleCo2Emissions(60),"#d73027" ], //'#58395b'    // '#fc121c' // '#ff3c00'
            [scaleCo2Emissions(94),"#a50026" ] //'#352c3a' // '#d21f20' // '#ff0000'
        ],
        "height": [
            [-20, scaleCo2Emissions(-10)],
            [scaleCo2Emissions(-10), scaleCo2Emissions(0)],
            [scaleCo2Emissions(0), scaleCo2Emissions(22)],
            [scaleCo2Emissions(22), scaleCo2Emissions(40)],
            [scaleCo2Emissions(60), scaleCo2Emissions(94)],
            [scaleCo2Emissions(94), scaleCo2Emissions(160)]
        ]
    };

    var layerSpecs = function(dataId, dataSrc, co2Prop, styleJson) {
        this.props = {
            "id": dataId,
            "type": "fill-extrusion",
            "source": dataSrc,
            'layout': {
                'visibility': 'none'
            },
            "paint": {
                "fill-extrusion-color": {
                    property: co2Prop,
                    stops: styleJson.color
                },
                // "fill-extrusion-opacity": .6,
                "fill-extrusion-height": {
                    property: co2Prop,
                    stops: styleJson.height
                },
                "fill-extrusion-opacity": .7,
                "fill-extrusion-height-transition": {
                    duration: 1000
                },
                "fill-extrusion-color-transition": {
                    duration: 1000
                }
            }
        }
    }

    var initButtons = function() {

        var toggleableLayerIds = ['winter-ppm', 'summer-ppm', 'winter-emissions', 'summer-emissions'];
        var layers;
        for (var i = 0; i < toggleableLayerIds.length; i++) {
            var id = toggleableLayerIds[i];

            var link = document.createElement('button');
            link.href = '#';
            // link.classList.add('active');
            link.classList.add("data-toggle");
            link.id = id;
            link.textContent = id;


            link.onclick = function(e){
                var clickedLayer = this.textContent;
                e.preventDefault();
                e.stopPropagation();
                showSelectedLegend(clickedLayer); // show the legend of interest

                    toggleableLayerIds.forEach(function(d) {
                        if (d != clickedLayer) {
                            el.map.setLayoutProperty(d, 'visibility', 'none');
                            document.getElementById(d).classList.remove('active');
                        } else {
                            el.map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                            document.getElementById( d).classList.add('active');
                        }
                    })
            }

            layers = document.getElementById('controllers');
            layers.appendChild(link);

        };


    }

    var loadDataToMap = function() {
        console.log("hello");

        // Scale CO2 Mixing Ratios
        el.dataWinter.features.forEach(function(d) {
            d.properties.co2_avg = scaleCo2MixingRatios(d.properties.co2_avg);
        })

        el.dataSummer.features.forEach(function(d) {
            d.properties.co2_avg = scaleCo2MixingRatios(d.properties.co2_avg);
        })

        // Scale CO2 Emissions
        el.dataWinter.features.forEach(function(d) {
            d.properties.co2_avg_e = scaleCo2Emissions(d.properties.co2_avg_e);
        })

        el.dataSummer.features.forEach(function(d) {
            d.properties.co2_avg_e = scaleCo2Emissions(d.properties.co2_avg_e);
        })

        // add data as sources
        el.map.addSource("winterData", {
            "type": "geojson",
            "data": el.dataWinter
        });

        el.map.addSource("summerData", {
            "type": "geojson",
            "data": el.dataSummer
        });


        el.map.addLayer(new layerSpecs("winter-ppm", "winterData", "co2_avg", mixingRatioStops).props, "co2_avg");
        el.map.addLayer(new layerSpecs("winter-emissions", "winterData", "co2_avg_e", emissionsStops).props, "co2_avg_e");
        el.map.addLayer(new layerSpecs("summer-ppm", "summerData", "co2_avg", mixingRatioStops).props, "co2_avg");
        el.map.addLayer(new layerSpecs("summer-emissions", "summerData", "co2_avg_e", emissionsStops).props, "co2_avg_e");

        initButtons();
        document.getElementById("winter-ppm").click();
    }


    




    // get it all going!
    var init = function() {
        hideLegends(); // hide the legends
        d3.queue()
            .defer(d3.json, el.dataWinterUrl)
            .defer(d3.json, el.dataSummerUrl)
            .await(function(error, file1, file2) {
                el.dataWinter = file1;
                el.dataSummer = file2;
                initMap();
                // selectButton();           
            });
    }


    // only return init() and the stuff in the el object
    return {
        init: init,
        el: el
    }


})();

// call app.map.init() once the DOM is loaded
window.addEventListener('DOMContentLoaded', function() {
    App.map.init();
});




// map.on('load', function() {
//     var gridco2 = "co2_avg";
//     d3.json('data2016.geojson', function(grids) {
//         console.log(grids);

//         var scaleCo2 = d3.scaleLinear()
//             .domain([390, 500])
//             .range([0, 2000]);

//         grids.features.forEach(function(d) {
//             d.properties.co2_avg = scaleCo2(d.properties.co2_avg);
//         })

//         map.addSource("grids", {
//             "type": "geojson",
//             "data": grids
//         });

//         // grid-3d
//         map.addLayer({
//             "id": "grids-3d",
//             "type": "fill-extrusion",
//             "source": "grids",
//             "paint": {
//                 "fill-extrusion-color": {
//                     property: gridco2,
//                     stops: [
//                         [scaleCo2(408), '#352c3a'], //'#ff3c00'
//                         [scaleCo2(419), '#6b3d69'], //'#ce2742'
//                         [scaleCo2(434), '#9d3b72'], //'#9d3b72'
//                         [scaleCo2(451), '#ce2742'], //'#7c3f71'
//                         [scaleCo2(474), '#ff3c00'], //'#58395b'
//                         [scaleCo2(518), '#ff0000'] //'#352c3a'
//                     ]
//                 },
//                 // "fill-extrusion-opacity": .6,
//                 "fill-extrusion-height": {
//                     property: gridco2,
//                     stops: [
//                         [0, scaleCo2(408)],
//                         [scaleCo2(408), scaleCo2(419)],
//                         [scaleCo2(419), scaleCo2(434)],
//                         [scaleCo2(434), scaleCo2(451)],
//                         [scaleCo2(451), scaleCo2(474)],
//                         [scaleCo2(474), scaleCo2(518)]
//                     ]
//                 },
//                 "fill-extrusion-opacity": .7,
//                 "fill-extrusion-height-transition": {
//                     duration: 1000
//                 },
//                 "fill-extrusion-color-transition": {
//                     duration: 1000
//                 }
//             }
//         }, "co2_avg");

//     })

// })
