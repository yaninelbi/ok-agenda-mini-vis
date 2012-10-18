/*jshint devel: true, browser: true */
/*global d3:false, _:false, Spinner: false */
;(function($, window, undefined) {
  'use strict';

  // Caution : This was a quick-and-dirty implementation. Refactoring is required.
  // ------------------
  // TODOS:
  // ------------------
  // All parties / X - DONE
  // Tooltips - DONE
  // Colors - DONE
  // Zooming and panning
  // + and -
  // Circles below x
  // X, Y Axis and legends
  // Circles above bars
  // User avatar
  // Popover design
  // Animations on changes (update+transition)
  // Responsiveness (?)
  // Pubsub and OOP (Refactoring, better encapsulation)
  // Coffeescript
  // Remove dependencies (_, Modernizr)
  // Build & embed (Async loading of iframe, a-la-facebook)
  // Sass, remove foundation, replace with compass reset

  // Spin.js jQuery Plugin
  $.fn.spin = function(opts) {
    this.each(function() {
      var $this = $(this),
        data = $this.data();

      if(data.spinner) {
        data.spinner.stop();
        delete data.spinner;
      }
      if(opts !== false) {
        data.spinner = new Spinner($.extend({
          color: $this.css('color')
        }, opts)).spin(this);
      }
    });
    return this;
  };

  // Boilerplate
  var $doc = $(document),
    Modernizr = window.Modernizr;

  // Hide address bar on mobile devices
  if(Modernizr.touch) {
    $(window).load(function() {
      setTimeout(function() {
        window.scrollTo(0, 1);
      }, 0);
    });
  }

  // Dropdown widget

  function DropDown(el) {
    this.dd = el;
    this.reset = el.find('.wrapper-reset');
    this.placeholder = this.dd.children('span');
    this.choose = el.find('> span');
    this.opts = this.dd.find('ul.dropdown > li');
    this.val = '';
    this.index = -1;
    this.initEvents();
  }
  DropDown.prototype = {
    initEvents: function() {
      var obj = this;

      obj.choose.live('click', function(event) {
        $(this).parent().toggleClass('active');
        return false;
      });

      // TODO: DRY These two click callbacks
      obj.reset.live('click', function(event) {
        var opt = $('#dd ul.dropdown > li').first();
        obj.val = opt.text();
        obj.index = opt.index();
        obj.placeholder.text(obj.val);
        $('#bar-chart').empty();
        makeMembersChart('#bar-chart', window.newMembers);
        return false;
      });

      obj.opts.live('click', function() {
        var opt = $(this);
        obj.val = opt.text();
        obj.index = opt.index();
        if(obj.index !== 0) {
          obj.placeholder.text('מפלגה: ' + obj.val);
          var filteredMembers = _.filter(window.newMembers, function(v) {
            return v.party == obj.val;
          });
          $('#bar-chart').empty();
          makeMembersChart('#bar-chart', filteredMembers);
        } else {
          obj.placeholder.text(obj.val);
          $('#bar-chart').empty();
          makeMembersChart('#bar-chart', window.newMembers);
        }
      });
    },
    getValue: function() {
      return this.val;
    },
    getIndex: function() {
      return this.index;
    }
  };

  // Hasadna code

  // TODO: Deffered calls
  function getParties(callback) {
    $.getJSON('http://oknesset.org/api/v2/party/?callback=?',
      function(data) {
        console.log('[Parties]', data);
        window.parties = data;
        window.newParties = data.objects.map(function(o) {
          return {
            "size": o.number_of_members,
            "name": o.name
          };
        });
        var s = '';
        var i = 0;
        var len = window.newParties.length;
        var p;
        for(; i < len; i++) {
          p = window.newParties[i];
          s += '<li><a href="#">' + p.name + '</a></li>';
        }
        s += '';
        $('#parties').append(s);
        if(typeof(callback) !== 'undefined') {
          return callback();
        }
      }
    );
  }

  function getAgenda(agendaId, callback) {
    $.getJSON('http://oknesset.org/api/v2/agenda/' + agendaId + '?callback=?',
      function(data) {
        console.log('[Agenda]', data);
        window.agenda = data;
        $('.meta').html('<a href="http://oknesset.org/' + data.absolute_url + '">' + data.name + '</a> <span>ע"פ</span> <a href="' + data.description + '">' + data.public_owner_name + '</a>');
        var i = 0;
        var len = data.parties.length;
        for(; i < len; i++) {
          window.newParties[i].score = data.parties[i].score;
          // Computing a random volume until the API implements it
          var madeUpVolume;
          madeUpVolume = Math.random() * 100;
          madeUpVolume = 75;
          window.newParties[i].volume = (data.parties[i].volume ? data.parties[i].volume : madeUpVolume);
        }
        window.newParties = _.sortBy(window.newParties, function(p) {
          return p.score;
        });
        window.newMembers = _.flatten(data.members).map(function(v) {
          return {
            "party": v.party,
            "name": v.name,
            "score": v.score,
            "rank": v.rank,
            "volume": v.volume
          };
        });
        window.newMembers = _.sortBy(window.newMembers, function(m) {
          return m.score;
        });
        window.w = $(window).width() - $(window).width()/10;
        makePartiesChart('#scatter-chart', window.newParties);
        makeMembersChart('#bar-chart', window.newMembers);
        $('.loading').hide();
        $('.loader').hide();
        $('.charts').show();
      }
    );
  }

  function getData(agendaId) {
    return getParties(getAgenda(agendaId));
  }

  // Chart functions
  function makePartiesChart(containerElement, data) {
    //Width and height
    var w = window.w;
    var h = 150;
    var padding = 30;

    var dataset = [];
    dataset = data.map(function(v) {
      return [Math.round(v.score), Math.round(v.volume), Math.round(v.size), v.name];
    });

    //Create scale functions
    var xScale = d3.scale.linear()
    .domain([d3.min(dataset, function(d) {
      return d[0];
    }), d3.max(dataset, function(d) {
      return d[0];
    })])
    .range([w - padding * 2 - 40, padding + 40]);

    var yScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
      return d[1];
    })]).range([h - padding, padding]);

    var rScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
      return d[2];
    })]).range([2, padding-1]); // -1 For stroke


    var MIN_SCORE = d3.min(dataset, function(d) { return d[0]; });
    var MAX_SCORE = d3.max(dataset, function(d) { return d[0]; });

    // Not in use right now, test this scale vs the custom color implementation
    var color = d3.scale.linear().domain([MIN_SCORE, MAX_SCORE]).rangeRound(["rgba(44,160,44,0.4)", "rgba(214,39,40,0.4)"]);

    var linearEase = function(from, to, pct) {
        return from + pct * (to - from);
      };

    var colorScale = [
      [44, 160, 44],
      [214, 39, 40]
    ];

    var color = function(val, alpha) {
        var pct = (val - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
        var colors = [];
        for(var i = 0; i < 3; i++) {
          colors.push(Math.round(linearEase(colorScale[0][i], colorScale[1][i], pct)));
        }
        colors.push(alpha || 0.7);
        return 'rgba(' + colors.join(',') + ')';
      };

    //Create SVG element
    var svg = d3.select(containerElement).append("svg").attr("width", w).attr("height", h);

    //Create circles
    svg.selectAll("circle").data(dataset).enter().append("circle").attr("cx", function(d) {
      return xScale(d[0]);
    }).attr("cy", function(d) {
      return yScale(d[1]);
    }).attr("r", function(d) {
      return 0;
    })
    .attr("fill", function(d) {
      return color((d[0]));
    })
    .attr("stroke", function(d) {
      return color((d[0]));
    })
    .transition().duration(750).delay(function(d, i) {
      return i * 10;
    }).attr("r", function(d) {
      return rScale(d[2]);
    });

    // Tooltips
    $('svg circle').tipsy({
      gravity: 'w',
      html: true,
      title: function() {
        var d = this.__data__;
        return d[3] + ' - חברים: ' +  d[2]+ ' ניקוד: ' + d[0] + ' הצבעות: ' + d[1];
      }
    });
  }

  function makeMembersChart(containerElement, data) {
    //Width and height
    var w = window.w;
    var h = 100;
    var barPadding = 1;
    var stroke = 1;

    var dataset = data.map(function(v) {
      return [v.score, v.volume, v.rank, v.name, v.party];
    });

    var xScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
      return d[0];
    })]).range([h, 0]);

    var yScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
      return d[1];
    })]).range([h - 2, 0]);

    var MIN_SCORE = 0;
    var MAX_SCORE = window.newMembers.length;

    var color = d3.scale.linear().domain([MIN_SCORE, MAX_SCORE]).rangeRound(["rgba(44,160,44,0.4)", "rgba(214,39,40,0.4)"]);
    
    var linearEase = function(from, to, pct) {
        return from + pct * (to - from);
      };

    var colorScale = [
      [44, 160, 44],
      [214, 39, 40]
    ];

    var color = function(val, alpha) {
      var pct = (val - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
      var colors = [];
      for(var i = 0; i < 3; i++) {
        colors.push(Math.round(linearEase(colorScale[0][i], colorScale[1][i], pct)));
      }
      colors.push(alpha || 0.7);
      return 'rgba(' + colors.join(',') + ')';
    };

    //Create SVG element
    var svg = d3.select(containerElement).append("svg").attr("width", w+10).attr("height", h);

    svg.selectAll("rect").data(dataset).enter()
    .append("rect")
    .on("mouseover",
      function() {
        d3.select(this).transition()
        .duration(250)
        .attr("stroke-opacity", 0.3);
      })
    .on("mouseout", function() {
      d3.select(this).transition()
      .duration(250)
      .attr("stroke-opacity", 1);
    })
    .attr("x", function(d, i) {
      return 10 + i * (w / dataset.length);
    }).attr("y", function(d) {
      return h;
    }).attr("width", function(d) {
      return w / dataset.length - barPadding - stroke;
    }).attr("height", function(d) {
      return h - yScale(d[1]);
    }).attr("fill", function(d) {
      return color(d[2]);
    })
    .attr("stroke", function(d) {
      return color(d[2]);
    })
    .transition().duration(750).delay(function(d, i) {
      return i * 10;
    }).attr("y", function(d) {
      return yScale(d[1]);
    });

    // Tooltips
    $('svg rect').tipsy({
      gravity: 'w',
      html: true,
      title: function() {
        var d = this.__data__;
        return d[3]  + ' - ניקוד: ' + d[0] + ' הצבעות: ' + d[1] + ' דירוג: ' + d[2];
      }
    });
  }

  // Config
  var currentAgenda = 1;

  // Init
  $('.loader').spin();

  var dd = new DropDown($('#dd'));

  $(document).click(function() {
    $('.wrapper-dropdown').removeClass('active');
  });

  getData(currentAgenda);

})(jQuery, this);