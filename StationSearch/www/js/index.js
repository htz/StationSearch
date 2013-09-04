(function ($) {
  $(function() {
    var app = {
      models: {},
      views: {},
    };
    var apiVersion = 'v28.0';
    var stations;
    var map, markers = [], current = new google.maps.LatLng(35.679799, 139.764545);

    var toggleNavbar = function () {
      $('.navbar-toggle').trigger('click');
    };

    var clearResult = function () {
      $('#stations tbody').empty();
      _.each(markers, function (marker) {
        marker.setMap(null);
      });
      markers = [];
    };

    var search = function (name) {
      clearResult();
      stations.setCriteria(name);
      stations.fetch();
    };

    var initModels = function () {
      var stationFieldlist = ['Id', 'Name', 'Station_Line__r.Name', 'Location__Latitude__s', 'Location__Longitude__s'];
      app.models.Station = Force.SObject.extend({
        sobjectType: 'Station__c',
        fieldlist: stationFieldlist,
        getLocation: function () {
          return new google.maps.LatLng(
            this.get('Location__Latitude__s'),
            this.get('Location__Longitude__s')
          );
        },
      });
      app.models.StationCollection = Force.SObjectCollection.extend({
        model: app.models.Station,
        setCriteria: function (keyword) {
          this.keyword = keyword;
        },
        config: function () {
          var soql = 'SELECT ' + stationFieldlist.join(',') +' FROM Station__c';
          if (this.keyword) {
            soql += ' WHERE';
            soql += ' Name LIKE \'%' + soqlEscape(this.keyword) + '%\' OR';
            soql += ' Station_Line__r.Name LIKE \'%' + soqlEscape(this.keyword) + '%\'';
          }
          soql += ' ORDER BY DISTANCE(Location__c, GEOLOCATION(' + current.lat() + ',' + current.lng() + '), \'km\')';
          soql += ' LIMIT 1000';
          return {type: 'soql', query: soql};
        }
      });
    };

    var initViews = function () {
      app.views.Station = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#station-item-template').text()),
        render: function () {
          var location = this.model.getLocation();
          var dist = calculateDistance(current, location);
          this.$el.html(this.template({
            name: this.model.get('Name'),
            line: this.model.get('Station_Line__r').Name,
            dist: dist.toFixed(1)
          }));
          return this;
        }
      });
      app.views.Stations = Backbone.View.extend({
        el: '#stations tbody',
        initialize: function () {
          this.collection.bind('reset', this.render, this);
        },
        render: function () {
          var that = this;
          clearResult();
          this.collection.each(function (model) {
            var view = new app.views.Station({model: model});
            that.$el.append(view.render().$el);
            // set marker
            var location = model.getLocation();
            var marker = new google.maps.Marker({
                position: location,
                map: map
            });
            markers.push(marker);
          });
          return this;
        }
      });
    };

    var initEvents = function () {
      // menu buttons
      $('.navbar-nav a').click(function (e) {
        var href = $(this).attr('href');
        $('.navbar-nav li.active').removeClass('active');
        $(this).parents('li').addClass('active');
        $('body > .main').hide().filter('#' + href.slice(1)).show();
        if (href === '#map') {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(current);
        } else {
          current = map.getCenter();
        }
        toggleNavbar();
      });
      // search form
      $('#search-form').submit(function (e) {
        e.preventDefault();
        search($('input', this).val());
        $('input', this).blur();
        toggleNavbar();
      });
    };

    var initMap = function () {
      map = new google.maps.Map($('#gmap')[0], {
          zoom: 14
      });
      // get current geolocation
      navigator.geolocation.getCurrentPosition(function (position) {
        current = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      });
    };

    document.addEventListener('deviceready', function () {
      FastClick.attach(document.body);
      SalesforceOAuth.init(apiVersion, function () {
        initModels();
        initViews();
        initEvents();
        initMap();
        stations = new app.models.StationCollection();
        new app.views.Stations({collection: stations});
        search();
      });
    }, false);
  });
})(jQuery);
