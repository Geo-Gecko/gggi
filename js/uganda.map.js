var cbounds;
(function (d3, $, queue, window) {
  'use strict';
  $("#filters").css("height", $(window).height() - $("#filters").offset().top - 85 + "px")
  // https://www.humanitarianresponse.info/en/operations/afghanistan/cvwg-3w
  // https://public.tableau.com/profile/geo.gecko#!/vizhome/Districtpolygon/v1?publish=yes
  'use strict';
  String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
  };
  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }
  var _selectedDataset;
  var dataset;
  var dataset1;
  var filteredDistricts = [];
  var country;
  var zoom;
  queue()
    .defer(d3.json, "./data/GGGI_HH_parishes.geojson") //dist
    .defer(d3.csv, "./data/UBOS_data.csv")
    .defer(d3.csv, "./data/filterList.csv")
    .await(ready);





  var global = {};
  global.selectedDistrict = []; // name
  global.selectedTheme = []; // ID
  global.selectedFilter = []; //undefined; //[]; // ID
  global.districtCount;
  global.currentEvent;
  // global.needRefreshDistrict;


  function refreshCounts() {
    d3.select("#district-count").text(global.districtCount);
    d3.select("#population-count").text(global.populationCount.toLocaleString());
    d3.select("#household-count").text(global.householdCount.toLocaleString());

    _selectedDataset = dataset1;
  }

  function ready(error, ugandaGeoJson, dataUBOS, filterList) {
    //standard for if data is missing, the map shouldnt start.
    if (error) {
      throw error;
    }
    var filterListKays = d3.keys(filterList[0]);
    var dataUBOSKays = d3.keys(dataUBOS[0]);
    ugandaGeoJson.features.map(function (d) {
      d.properties.DNAME_06 = d.properties.pname.toLowerCase().capitalize();
    });
    //need join all data
    dataset1 = dataUBOS.map(function (d) {
      var i;
      for (i = 0; i < ugandaGeoJson.length; i++) {
        if (ugandaGeoJson[i].pname === d.pname) {
          dataUBOSKays.map(function (k) {
            d[k] = ugandaGeoJson[i][k];
          });
          break;
        }
      }
      return d;
    });
    // http://bl.ocks.org/phoebebright/raw/3176159/
    var districtList = d3.nest().key(function (d) {
      return d.DNAME2016;
    }).sortKeys(d3.ascending).entries(dataUBOS);

    var themeList = d3.nest().key(function (d) {
      return d.Theme;
    }).sortKeys(d3.ascending).entries(filterList);

    var filterList = d3.nest().key(function (d) {
      return d.Name;
    }).sortKeys(d3.ascending).entries(filterList);
    // console.log(filterList);

    var SolarusageList = filterList.filter(function (d) {
      if (d.values[0].Theme === "Solar Usage (% of households)") {
        return d.key; //return d.Actor_Type["UN"];
      }
    });
    var HouseholdcharacteristicsList = filterList.filter(function (d) {
      if (d.values[0].Theme === "Household Charcteristics(% of households)") {
        return d.key; //return d.Actor_Type["UN"];
      }
    })

    var SolaracquisitionList = filterList.filter(function (d) {
      if (d.values[0].Theme === "Solar acquisition (% of households)") {
        return d.key; //return d.Actor_Type["UN"];
      }
    });
    var ChallengesList = filterList.filter(function (d) {
      if (d.values[0].Theme === "Challenges experienced(% of households)") {
        return d.key; //return d.Actor_Type["UN"];
      }
    });

    var WillingnessList = filterList.filter(function (d) {
      if (d.values[0].Theme === "Willingness to pay for solar(% of households)") {
        return d.key; //return d.Actor_Type["UN"];
      }
    });

    var totalPopulation = 0;
    var totalHouseholds = 0;

    for (var j = 0; j < dataset1.length; j++) {
      var Population = +(dataset1[j]["Population_2014"]);
      var Household = +(dataset1[j]["Households_2014"]);
      totalPopulation = totalPopulation + Population;
      totalHouseholds = totalHouseholds + Household;
    }

    global.districtCount = districtList.length;
    global.populationCount = totalPopulation;
    global.householdCount = totalHouseholds;


    refreshCounts();
    updateLeftPanel(districtList, dataset1);

    $(".custom-list-header").click(function () {
      $(".custom-list-header").siblings(".custom-list").addClass('collapsed');
      $(this).siblings(".custom-list").toggleClass('collapsed');
      $(this).find("span").toggleClass('glyphicon-menu-down').toggleClass('glyphicon-menu-right');
    });

    // Collapses all the boxes apart from subCounty
    $(".custom-list-header").siblings(".custom-list").addClass('collapsed');
    // $("#socio-economic-list.custom-list").removeClass('collapsed');

    var h = (window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight);
    //    if (h > 540) {
    d3.select(".list-container").style("height", h + "px");
    d3.select("#d3-map-container").style("height", h + "px");
    //    }
    var w = (window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth);
    d3.select(".list-container").style("height", h - 0 + "px")

    var map = new L.Map("d3-map-container", {
      center: [-0.708, 30.564],
      zoom: 10,
      zoomSnap: 0.25,
      zoomControl: false
    });

    var _3w_attrib = 'Created by <a href="http://www.geogecko.com">Geo Gecko</a> and � <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Powered by <a href="https://d3js.org/">d3</a>';
    var basemap = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png");

    basemap.addTo(map);
    map.doubleClickZoom.disable();

    map.bounds = [],
      // map.setMaxBounds([
      //        [0.087,29.923],
      //        [-1.104,31.496]
      //     ]);
      map.options.maxZoom = 14;
    map.options.minZoom = 10;



    var ugandaPath;
    var domain = [+Infinity, -Infinity];
    var opacity = 0.7;
    var width = $(window).width();
    var height = $(window).height();
    $(".toggler").css("height", height + 25);
    $('#logo').on('mouseover', function () {
      $(this).parent().addClass('is-hover');
    }).on('mouseout', function () {
      $(this).parent().removeClass('is-hover');
    })

    $("#d3-map-container").css("width", width);
    $("#d3-map-container").css("height", height);
    $("#right").find(".toggler").append("<div id = 'rtitle'></div>");
    $("#right").find("#rtitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>F</div>");
    $("#right").find("#rtitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>I</div>");
    $("#right").find("#rtitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>L</div>");
    $("#right").find("#rtitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>T</div>");
    $("#right").find("#rtitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>E</div>");
    $("#right").find("#rtitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>R</div>");
    $("#right").find("#rtitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>S</div>");
    var ht = $("#rtitle").height();
    ht = ((($(window).height() - ht) / 3) + (($('#logo').height() - ht) / 3));
    $("#rtitle").css("margin-top", ht + "px")

    $("#left").find(".toggler").append("<div id=\"pgTitle\" style=\"position: relative; top:-1.5em; right: -50px;\">\n" +
      "                    <div id=\"header-text\">" +
      "               <p><span>Data Insight Portal</span></p>" +
      "           </div><br>\n" +
      "               <p id=\"header-text\" style=\"font-size: 10px;\"><span><small><b>Powered by:</b> Leaflet, Mapbox, D3, CartoDB, and OpenStreetMap contributors <b>Data:</b> Uganda Census 2014,UBoS</small></span></p>" +
      "               <p id=\"header-text\" style=\"font-size: 10px;\"><span id=\"select-Gulu\"><small><b>Gulu</b></small></span></p>" +
      "               <p id=\"header-text\" style=\"font-size: 10px;\"><span id=\"select-Mbarara\"><small><b>Mbarara</b></small></span></p>" +
      "            </div>");
    /*
        "                    <div id=\"header-text\">" +
        "               <p><span>Data</span></p>" +
        "           </div><br><br>\n" +
        "                    <div id=\"header-text\">" +
        "               <p><span>Insight</span></p>" +
        "           </div><br><br>\n" +
        "                    <div id=\"header-text\">" +
        "               <p><span>Portal</span></p>" +
        "           </div>\n" +*/
    $("#left").find(".toggler").append("<div id = 'ltitle'></div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>S</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>T</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>A</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>T</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>I</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>S</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>T</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>I</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>C</div>");
    $("#left").find("#ltitle").append("<div style = 'font-weight:bolder;color:white;padding-left:3px;text-align:center;'>S</div>");
    var ht = $("#ltitle").height();
    ht = ($(window).height() - ht) / 3;
    $("#ltitle").css("margin-top", ht + "px");





    d3.select("#info").on("click", function () {
      $("#overlay1").show();
    });

    d3.select(".glyphicon-remove").on("click", function () {
      $("#overlay1").hide();
    });

    $(document).keyup(function (e) {
      if (e.keyCode == 27) { // escape key maps to keycode `27`
        // <DO YOUR WORK HERE>
        $("#overlay1").hide();
      }
    });

    var color = d3.scale.linear().domain(domain) //http://bl.ocks.org/jfreyre/b1882159636cc9e1283a
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb("#f7fcfd"), d3.rgb('#00441b')]);
    var tooltip = d3.select(map.getPanes().overlayPane)
      .append("div")
      .attr("class", "d3-tooltip d3-hide");
    var datasetNest = d3.nest().key(function (d) {
      return d.DNAME2016;
    }).entries(dataset1);


    var countries = [];
    var countriesOverlay = L.d3SvgOverlay(function (sel, proj) {
      var projection = proj.pathFromGeojson.projection;
      var path = d3.geo.path().projection(projection);

      ugandaPath = sel.selectAll('.district').data(countries);
      ugandaPath.enter()
        .append('path')
        .attr('d', proj.pathFromGeojson)
        .attr('fill-opacity', '0.5')
        .attr("z-index", "600")
        .attr("style", "pointer-events:all!important")
        .style("cursor", "pointer")
        .style("stroke", "#000")
        .each(function (d) {
          //console.log(d);
          d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
          // console.log(d, d.properties.centroid);
          datasetNest.map(function (c) {
            if (c.key === d.properties.dist) {
              //console.log(c);
              d.properties._Population_2014 = d3.nest().key(function (a) {
                //console.log(a);
                return a.Population_2014;
              }).entries(c.values);
              d.properties._Household_2014 = d3.nest().key(function (a) {
                // console.log(a);
                return a.Households_2014;
              }).entries(c.values);
              //console.log(d);
              var filterValue = +(d.properties._Population_2014[0].key);
              domain[0] = filterValue < domain[0] ? filterValue :
                domain[
                  0];
              domain[1] = filterValue > domain[1] ? filterValue :
                domain[
                  1];
              color.domain(domain);
            }
          });
        })
        .on("mousemove", function (d) {
          var svg = d3.select(this.parentNode.parentNode.parentNode);
          var mouse = d3.mouse(svg.node()).map(function (d) {
            return parseInt(d);
          });
          var shift = d3.transform(svg.attr("transform"))
          mouse[0] = mouse[0] + shift.translate[0] + shift.translate[0] * (shift.scale[0] - 1);
          mouse[1] = mouse[1] + shift.translate[1] + shift.translate[1] * (shift.scale[1] - 1);
          // console.log(sel, mouse);
          var str = "<p><b>" + d.properties.DNAME_06 + "</b><span> Parish</span></p>"
          tooltip.html(str);
          var box = tooltip.node().getBoundingClientRect() || {
            height: 0
          };
          tooltip
            .classed("d3-hide", false)
            .attr("style", "left:" + (mouse[0] + 15) + "px;top:" + (mouse[1] < height / 2 ? mouse[1] : mouse[1] - box.height) + "px");
        })
        .on("mouseover", function (d) {
          tooltip.classed("d3-hide", false);
        })
        .on("mouseout", function (d) {
          tooltip.classed("d3-hide", true);
        })
        .on("click", function (d) {
          // if ($("#left").attr("data-status") =="closed")
          // {
          //     $("#left").find(".toggler").trigger("click");
          // }


          var header = d3.select("#districtHeader");
          var str = "National Average versus " + d.properties.DNAME_06 + " district";

          header.html(str);
          ugandaPath.style("fill", function (d) {
            for (var k = 0; k < filteredDistricts.length; k++) {
              if (d.properties.dist === filteredDistricts[k]) {
                return "none";
              }
            }
            return "#e3784a";
          });
          d3.select(this).style("fill", "#41b6c4");
          d3.select(this).attr("opacity", 1);



          // d3.select("#dist-population-count").text((+(d.properties._Population_2014[0].key)).toLocaleString());
          // d3.select("#dist-household-count").text((+(d.properties._Household_2014[0].key)).toLocaleString());

          $("#distStats").show();
          var ugChart = d3.select(".statUG").selectAll("rect");
          ugChart.attr("height", "20");

          d3.selectAll(".districtLegend").remove();

          var legend = d3.select('#statistics-legend').select("svg");
          var rectangles = legend.select('g');


          rectangles.append("rect")
            .attr("transform", "translate(0,25)")
            .attr("class", "districtLegend")
            .attr("width", "100px")
            .attr("height", "20px")
            .attr("fill", "#41b6c4");
          rectangles.append("text")
            .attr("class", "districtLegend")
            .attr("x", 6.33)
            .attr("y", 35)
            .attr("dy", ".35em")
            .style('fill', 'white')
            .text("District Averages");


          d3.select(".statDist").remove();
          var sliders = document.getElementsByClassName('sliders')
          var header = [];
          var values = [];

          for (var i = 0; i < sliders.length; i++) {
            var headerValues = 0;
            for (var j = 0; j < dataset1.length; j++) {
              header.push(sliders[i].__data__.key);

              if (dataset1[j]["DNAME2016"] === d.properties.dist) {
                headerValues = +(dataset1[j][sliders[i].__data__.values[0].FieldNames]) + headerValues;
              }
            }
            if (sliders[i].__data__.values[0].Theme === "Education (% of population)") {
              // values.push(headerValues / +(d.properties._Population_2014[0].key) * 100);    
            } else if (sliders[i].__data__.values[0].Theme !== "Education (% of population)") {
              // values.push(headerValues / +(d.properties._Household_2014[0].key) * 100);    
            }
          }
          var headerList = header.filter(function (item, pos) {
            return header.indexOf(item) === pos;
          });
          // console.log(headerList);
          // console.log(values);
          var chartDist = [headerList].concat([values]);


          var valueLabelWidth = 10; // space reserved for value labels (right)
          var barHeight = 25; // height of one bar
          var barLabelWidth = 200; // space reserved for bar labels
          // var barLabelPadding = 5; // padding between bar and bar labels (left)
          var gridLabelHeight = 18; // space reserved for gridline labels
          var gridChartOffset = 3; // space between start of grid and first bar
          var maxBarWidth = 150; // width of the bar with the max value

          // accessor functions
          //             var barLabel = function(d) {  return d; };
          var barValue = function (d) {
            return parseFloat(d);
          };

          // scales
          var yScale = d3.scale.ordinal().domain(d3.range(0, chartDist[0].length)).rangeBands([0, chartDist[0].length * barHeight]);
          var y = function (d, i) {
            return yScale(i);
          };
          var x = d3.scale.linear().domain([0, 100 /*d3.max(data, barValue)*/ ]).range([0, maxBarWidth]);
          // svg container element
          var chart = d3.select('#statistics-list').select("svg");
          // bars
          var barsContainer = chart.append('g')
            .attr("class", "statDist")
            .attr('transform', 'translate(' + barLabelWidth + ',' + (gridLabelHeight + gridChartOffset + 10) + ')');
          barsContainer.selectAll("rect").data(chartDist[1]).enter().append("rect")
            .attr('y', y)
            .attr('height', yScale.rangeBand() / 2 * 0.8)
            .attr('width', function (d) {
              return x(barValue(d));
            })
            .attr('stroke', 'white')
            .attr('fill', '#41b6c4');
        })
        .style("fill", "#e3784a")
        .attr("class", function (d) {
          return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
        });

      ugandaPath.attr('stroke-width', 1 / proj.scale)
        .each(function (d) {
          d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
          datasetNest.map(function (c) {
            if (c.key === d.properties.dist) {
              //console.log(c);
              d.properties._Population_2014 = d3.nest().key(function (a) {
                //console.log(a);
                return a.Population_2014;
              }).entries(c.values);
              d.properties._Household_2014 = d3.nest().key(function (a) {
                // console.log(a);
                return a.Households_2014;
              }).entries(c.values);
              //console.log(d);
              var filterValue = +(d.properties._Population_2014[0].key);
              domain[0] = filterValue < domain[0] ? filterValue :
                domain[
                  0];
              domain[1] = filterValue > domain[1] ? filterValue :
                domain[
                  1];
              color.domain(domain);
              //console.log(domain);
            }
          });
        })
        .attr("class", function (d) {
          return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
        });
      ugandaPath.exit().remove();
    });
    countries = ugandaGeoJson.features;
    countriesOverlay.addTo(map);
    /**/

    country = L.geoJson(ugandaGeoJson)
    cbounds = country.getBounds();

    setTimeout(function () {
      zoom = map.getBoundsZoom(cbounds);
      map.setZoom(zoom);
      setTimeout(function () {
        map.invalidateSize();
        var southWest = L.latLng(-0.9557844325488593, 30.263904867436425);
        var northEast = L.latLng(-0.18499228788352556, 31.07556920847145);
        var bounds = L.latLngBounds(southWest, northEast);
        map.fitBounds(bounds);
      }, 500);

    }, 100);




    function refreshMap() {
      var header = d3.select("#districtHeader");
      filteredDistricts = [];
      var str = "National Average";
      header.html(str);

      d3.selectAll(".districtLegend").remove();
      d3.select(".statDist").remove();

      $("#distStats").hide();
      for (var i = 0; i < sliders.length; i++) {
        sliders[i].noUiSlider.reset();
      }
      ugandaPath.style("fill", function (d) {
        for (var k = 0; k < filteredDistricts.length; k++) {
          if (d.properties.dist === filteredDistricts[k]) {
            console.log(2);
            return "none";
          }
        }
        console.log(1);
        return "#e3784a";
      });


      refreshCounts();
    }
    d3.select("#d3-map-refresh").on("click", refreshMap);

    //d3.select("#d3-map-make-pdf").on("click", makePdf);


    function onlyUniqueObject(data) {
      data = data.filter(function (d, index, self) {
        return self.findIndex(function (t) {
          return t.key === d.key;
        }) === index;
      });
      return data;
    }

    function filterSelectedItem(item, c, needRemove) {
      if (needRemove) {
        global[item] = global[item].filter(function (a) {
          return a !== c;
        });
      } else {
        global[item].push(c);
      }
      global[item] = onlyUniqueObject(global[item]);
    }




    function myFilter(c, flag, needRemove) {
      if (flag === "district") {
        filterSelectedItem("selectedDistrict", c, needRemove);
      }
      if (flag === "theme") {
        filterSelectedItem("selectedTheme", c, needRemove);
      }

      var selectedDataset = dataset1.filter(function (d) {
        var isDistrict = false;
        if (global.selectedDistrict.length > 0) {
          global.selectedDistrict.map(function (c) {
            if (c.key === d.DNAME2016) {
              isDistrict = true;
            }
          });
        } else {
          isDistrict = true;
        }
        var isTheme = false;
        if (global.selectedTheme.length > 0) {
          global.selectedTheme.map(function (c) {

            if (c.values[0].Settlement_ID === d.Settlement_ID) {
              isTheme = true;
            }
          });
        } else {
          isTheme = true;
        }
        var isFilter = false;
        if (filterList.length > 0) {
          filterList.map(function (c) {
            if (c.key === d.Sector_ID) {
              isTheme = true;
            }
          });
        } else {
          isFilter = true;
        }

        return isDistrict && isTheme && isFilter;
      });

      _selectedDataset = selectedDataset;

      var districtList = null;
      if (flag !== "district") {
        districtList = d3.nest().key(function (d) {
          return d.DNAME2016;
        }).sortKeys(d3.ascending).entries(selectedDataset);
      }

      var sectorList = null;
      if (flag !== "sector") {
        sectorList = d3.nest().key(function (d) {
          return d.Sector;
        }).sortKeys(d3.ascending).entries(selectedDataset);
      }

      var agencyList = null;
      if (flag !== "agency") {
        agencyList = d3.nest().key(function (d) {
          return d.Name;
        }).sortKeys(d3.ascending).entries(selectedDataset);
      }
      updateLeftPanel(districtList, dataset1);

      if (flag === "district") {
        d3.select("#district-count").text(global.selectedDistrict.length);
      } else {
        // global.selectedDistrict = districtList;
        d3.select("#district-count").text(districtList.length);
      }
      if (flag === "theme") {
        d3.select("#theme-count").text(global.selectedTheme.length);
      } else {
        d3.select("#theme-count").text(themeList.length);
      }
      if (flag === "filter") {
        d3.select("#filter-count").text(global.selectedFilter.length);
      } else {
        d3.select("#filter-count").text(filterList.length);
      }


    }





    function updateLeftPanel(districtList, dataset1) {
      if (global.currentEvent !== "district") {
        d3.selectAll(".district").style("opacity", opacity);
        d3.selectAll(".labels").style("opacity", opacity);
        districtList.map(function (a) {
          d3.select(".district-" + a.key.replaceAll('[ ]', "_")).style("opacity", 1);
          d3.select(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
          a.values.map(function (b) {
            d3.select(".settlement-" + b.Settlement_ID).style("opacity", 1);
          });
        });
      }
      if (districtList) {
        d3.select("#district-count").text(districtList.length);
        var _districtList = d3.select("#district-list").selectAll("p")
          .data(districtList);
        _districtList.enter().append("p")
          .text(function (d) {
            return d.key;
          })
          .on("click", function (c) {
            d3.selectAll(".labels").style("opacity", opacity);
            var needRemove = $(d3.select(this).node()).hasClass("d3-active");
            d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
              "#E3784A");
            global.currentEvent = "district";
            myFilter(c, global.currentEvent, needRemove);
            ugandaPath.style("opacity", function (a) {
              if (a.properties.DNAME_06 === c.key) {
                a.properties._selected = !needRemove;
                return a.properties._selected ? 1 : opacity;
              }
              return a.properties._selected ? 1 : opacity;
            });

          });
        _districtList
          .attr("class", function (d) {
            return "district-list-" + d.key.replaceAll('[ ]', "_");
          })
          .text(function (d) {
            return d.key;
          });
        _districtList.exit().remove();
      }

      if (SolarusageList) {
        var _SolarusageList = d3.select("#Solarusage-list").selectAll("p")
          .data(SolarusageList);
        _SolarusageList.enter().append("p")
          .text(function (d) {
            return d.key;
          })
        _SolarusageList
          .attr("class", function (d) {
            return "Solarusage-list-" + d.key.replaceAll('[ ]', "_");
          })
          .text(function (d) {
            return d.key;
          });
        _SolarusageList.exit().remove();
      }

      if (HouseholdcharacteristicsList) {
        var _HouseholdcharacteristicsList = d3.select("#Householdcharacteristics-list").selectAll("p")
          .data(HouseholdcharacteristicsList);
        _HouseholdcharacteristicsList.enter().append("p")
          .text(function (d) {
            return d.key;
          })
        _HouseholdcharacteristicsList
          .attr("class", function (d) {
            return "Householdcharacteristics-list-" + d.key.replaceAll('[ ]', "_");
          })
          .text(function (d) {
            return d.key;
          });
        _HouseholdcharacteristicsList.exit().remove();
      }
      if (SolaracquisitionList) {
        var _SolaracquisitionList = d3.select("#Solaracquisition-list").selectAll("p")
          .data(SolaracquisitionList);
        _SolaracquisitionList.enter().append("p")
          .text(function (d) {
            return d.key;
          })
        _SolaracquisitionList
          .attr("class", function (d) {
            return "Solaracquisition-list-" + d.key.replaceAll('[ ]', "_");
          })
          .text(function (d) {
            return d.key;
          });
        _SolaracquisitionList.exit().remove();
      }
      if (ChallengesList) {
        var _ChallengesList = d3.select("#Challenges-list").selectAll("p")
          .data(ChallengesList);
        _ChallengesList.enter().append("p")
          .text(function (d) {
            return d.key;
          })
        _ChallengesList
          .attr("class", function (d) {
            return "Challenges-list-" + d.key.replaceAll('[ ]', "_");
          })
          .text(function (d) {
            return d.key;
          });
        _ChallengesList.exit().remove();
      }
      if (WillingnessList) {
        var _WillingnessList = d3.select("#Willingness-list").selectAll("p")
          .data(WillingnessList);
        _WillingnessList.enter().append("p")
          .text(function (d) {
            return d.key;
          })
        _WillingnessList
          .attr("class", function (d) {
            return "Willingness-list-" + d.key.replaceAll('[ ]', "_");
          })
          .text(function (d) {
            return d.key;
          });
        _WillingnessList.exit().remove();
      }
    }
    d3.select("#Solarusage-list").selectAll("p").append("div").attr("class", "sliders");
    d3.select("#Householdcharacteristics-list").selectAll("p").append("div").attr("class", "sliders");
    d3.select("#Solaracquisition-list").selectAll("p").append("div").attr("class", "sliders");
    d3.select("#Challenges-list").selectAll("p").append("div").attr("class", "sliders");
    d3.select("#Willingness-list").selectAll("p").append("div").attr("class", "sliders");

    var sliders = document.getElementsByClassName('sliders');
    var fieldName = [];

    for (var i = 0; i < sliders.length; i++) {
      var domain = [+Infinity, -Infinity];
      fieldName.push([sliders[i].__data__.values[0].FieldNames]);
      for (var j = 0; j < dataset1.length; j++) {
        var Population = +(dataset1[j]["Population_2014"]);
        var Household = +(dataset1[j]["Households_2014"]);
        var filterValue;

        if (sliders[i].__data__.values[0].Theme === "Education (% of population)") {
          filterValue = +(dataset1[j][sliders[i].__data__.values[0].FieldNames]) / Population * 100;
        } else {
          filterValue = +(dataset1[j][sliders[i].__data__.values[0].FieldNames]) / Household * 100;
        }
        domain[0] = filterValue < domain[0] ? filterValue :
          domain[
            0];
        domain[1] = filterValue > domain[1] ? filterValue :
          domain[
            1];


      }


      noUiSlider.create(sliders[i], {
        start: [0, 100],
        behaviour: "drag",
        margin: 5,
        connect: true,
        orientation: "horizontal",
        range: {
          'min': 0,
          'max': 100
        },
        tooltips: true,
        format: {
          to: function (value) {
            // console.log(value);
            return value.toFixed(0) + '%';
          },
          from: function (value) {
            return value.replace('%', '');
          }
        }
      });

      var activeFilters = [];
      sliders[i].noUiSlider.on('slide', addValues);

    }

    function addValues() {
      var allValues = [];
      var range, rangeMin, rangeMax;
      var realRange = [];


      for (var i = 0; i < sliders.length; i++) {
        allValues.push([sliders[i].noUiSlider.get()]);
        range = sliders[i].noUiSlider.get();
        rangeMin = range.slice(0, 1);
        rangeMax = range.slice(1);

        realRange.push(rangeMin.concat(rangeMax));


        if (sliders[i].__data__.values[0].Theme === "Education (% of population)") {
          rangeMin = [+(rangeMin) * Population / 100];
          rangeMax = [+(rangeMax) * Population / 100];
        } else {
          rangeMin = [+(rangeMin) * Household / 100];
          rangeMax = [+(rangeMax) * Household / 100];
        }


      }

      var sliderData = [fieldName].concat([realRange]);

      var filtered = [];

      var filteredPop = 0;
      var filteredHH = 0;
      var districtValue;

      for (var i = 0; i < dataset1.length; i++) {

        for (var j = 0; j < sliderData[0].length; j++) {
          if (dataset1[i][sliderData[0][j]]) {
            for (var k = 0; k < sliders.length; k++) {
              districtValue = +(dataset1[i][sliderData[0][j]]);
            }
            if (districtValue < +((sliderData[1][j][0]).replace('%', '')) || districtValue > +((sliderData[1][j][1]).replace('%', ''))) {
              filtered.push(dataset1[i].PARISH_GG_);
            }
          }
        }
      }
      filteredDistricts = filtered.filter(function (item, pos) {
        return filtered.indexOf(item) === pos;
      });


      for (var i = 0; i < dataset1.length; i++) {
        for (var j = 0; j < filteredDistricts.length; j++) {
          if (filteredDistricts[j] === dataset1[i].pname) {
            var filtPopulation = +(dataset1[i]["Population_2014"]);
            var filtHousehold = +(dataset1[i]["Households_2014"]);
            filteredPop = filteredPop + filtPopulation;
            filteredHH = filteredHH + filtHousehold;
          }
        }

      }
      d3.select("#district-count").text(global.districtCount - filteredDistricts.length);
      d3.select("#population-count").text((global.populationCount - filteredPop).toLocaleString());
      d3.select("#household-count").text((global.householdCount - filteredHH).toLocaleString());

      d3.selectAll(".districtLegend").remove();
      d3.select(".statDist").remove();

      $("#distStats").hide();



      ugandaPath.style("fill", function (d) {
        for (var k = 0; k < filteredDistricts.length; k++) {
          if (d.properties.PARISH_GG_ === parseInt(filteredDistricts[k])) {
            return "none";
          }
        }
        return "#e3784a";
      });

      var header = d3.select("#districtHeader");
      var str = "National Average";
      header.html(str);

      d3.selectAll(".districtLegend").remove();
      d3.select(".statDist").remove();

      $("#distStats").hide();



      var activeFilters = [];
      var filterValues = [];

      for (var i = 0; i < sliderData[0].length; i++) {
        if (sliderData[1][i][0] !== "0%" || sliderData[1][i][1] !== "100%") {
          activeFilters.push(sliderData[0][i][0]);
          filterValues.push(sliderData[1][i]);
        }
      }

    }

    var whichDistrict = "Mbarara"

    d3.select("#select-Gulu").on('click', function () {
      if (whichDistrict === "Mbarara") {
        d3.select("#select-Mbarara").style('background-color', 'grey');
        d3.select("#select-Gulu").style('background-color', '#e3784a');
        whichDistrict = "Gulu"
        var lat_tmp = 1.351;
        var lng_tmp = 31.415;
        var southWest = L.latLng(2.602641184357304, 31.88503060459714);
        var northEast = L.latLng(3.372423874095159, 33.16376939540284);
        var bounds = L.latLngBounds(southWest, northEast);
        map.setMaxBounds(null);
        map.setView({
          lat: lat_tmp,
          lng: lng_tmp
        }, 7, {
          pan: {
            animate: true,
            duration: 1.5
          },
          zoom: {
            animate: true
          }
        });
        setTimeout(function () {
          map.fitBounds(bounds);
          // map.setView({lat: 2.9876, lng: 32.4244 },10.8,{pan: {animate: true,duration: 1.5},zoom: {animate: true} });
        }, 500);
      }
    });
    d3.select("#select-Mbarara").on('click', function () {
      if (whichDistrict === "Gulu") {
        d3.select("#select-Gulu").style('background-color', 'grey');
        d3.select("#select-Mbarara").style('background-color', '#e3784a');
        whichDistrict = "Mbarara"
        var lat_tmp = 1.351;
        var lng_tmp = 31.415;
        var southWest = L.latLng(-0.9557844325488593, 30.263904867436425);
        var northEast = L.latLng(-0.18499228788352556, 31.07556920847145);
        var bounds = L.latLngBounds(southWest, northEast);
        map.setMaxBounds(null);
        map.setView({
          lat: lat_tmp,
          lng: lng_tmp
        }, 7, {
          pan: {
            animate: true,
            duration: 1.5
          },
          zoom: {
            animate: true
          }
        });
        setTimeout(function () {
          map.fitBounds(bounds);
          // map.setView({lat: -0.570, lng: 30.620 },10.8,{pan: {animate: true,duration: 1.5},zoom: {animate: true} });
        }, 500);
      }
    });

    window.addEventListener("resize", function () {
      var width = $(window).width();
      var height = $(window).height() - 25;
      // console.log(width, height);
      $(".toggler").css("height", height + 25);
      var ht = $("#rtitle").height();
      ht = ($(window).height() - ht) / 2;
      $("#rtitle").css("margin-top", ht - 200 + "px")

      var ht = $("#ltitle").height();
      ht = ($(window).height() - ht) / 2;
      $("#ltitle").css("margin-top", ht + "px")

      if ($("#right").width() + $("#left").width() > width - 40) {
        if ($("#left").attr("data-status") == "opened") {
          $("#left").find(".toggler").trigger("click");
        }
      }
      if (width < 400) {
        //          $("#right").css("width","70%");
        $("#right").css("min-width", "301px");
        //          $("#left").css("width","70%");
        $("#left").css("min-width", "301px");
        if ($("#left").attr("data-status") == "opened") {
          $("#left").find(".toggler").trigger("click");
        }
        if ($("#right").attr("data-status") == "opened") {
          $("#right").find(".toggler").trigger("click");
        }
      } else {
        $("#right").css("max-width", "412px");
        $("#right").css("min-width", "412px");
        $("#left").css("max-width", "412px");
        $("#left").css("min-width", "412px");
      }
      $("#d3-map-container").css("width", width);
      $("#d3-map-container").css("height", height);
      if (width) {
        d3.select("#d3-map-container").select("svg")
          .attr("viewBox", "0 0 " + width + " " + height)
          .attr("width", width)
          .attr("height", height);
      }
      $(".list-container").css("height", height + "px");

    });


    if ($(window).width() > 400) {
      $("#right").css("max-width", "450px");
      $("#right").css("min-width", "450px");
      $("#left").css("max-width", "450px");
      $("#left").css("min-width", "450px");
      $("#left").find(".toggler").trigger("click");
      $("#right").find(".toggler").trigger("click");
      setTimeout(function () {
        if ($("#right").width() + $("#left").width() > $(window).width() - 40) {
          if ($("#left").attr("data-status") == "opened") {
            $("#left").find(".toggler").trigger("click");
          }
        }
      }, 1000)
    } else {
      //          $("#left").find(".toggler").css("margin-top","-35px") 
      $("#right").css("max-width", "305px");
      $("#right").css("min-width", "305px");
      $("#left").css("max-width", "305px");
      $("#left").css("min-width", "305px");
    }


    var triggerclick = false;
    $(document).on("click", ".toggler", function (e) {
      if (triggerclick) {
        triggerclick = false;
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      if ($(window).width() < 400) {
        setTimeout(function () {
          if ($("#left").attr("data-status") == "opened" && $("#right").attr("data-status") == "opened") {
            if ($("#right").width() + $("#left").width() > $(window).width() - 40) {
              $("#left").find(".toggler").trigger("click");
            }
          } else {}
        }, 500)
      } else {
        if ($("#left").attr("data-status") == "opened" && $("#right").attr("data-status") == "opened") {
          if ($("#right").width() + $("#left").width() > $(window).width() - 40) {
            if ($("#left").attr("data-status") == "opened") {
              $("#left").find(".toggler").trigger("click");
            }
          }
        }
      }
    });



  } // ready



})(d3, $, queue, window);