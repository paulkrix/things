angular.module('things', ['ngRoute', 'angularFileUpload', 'ui.bootstrap'])
.factory('MCData', function($http) {
  return {
    getData: function(type) {
      if(type === null || type === undefined) {
        type = 'all';
      }
      return $http.get('../data/load.php?='+type+'&cacheBreaker='+Date.now()).then(function(result) {
        if(result.data) {
          return result.data;
        }
        return {prototypes: [], things: []};
      },
      function(result) {
        return {prototypes: [], things: []};
      });
    },

    save: function (data, type, callback) {
      if(callback === undefined) {
        callback = function(){}
      };
      $http.post('../data/save.php', { 'data': data, 'type':type })
      .success(callback);
    },

    destroy: function (data, type, callback) {
      if(callback === undefined) {
        callback = function(){}
      };
      $http.post('../data/destroy.php', { 'data': data, 'type':type })
      .success(callback);
    }


  }
})
.service( 'ThingManager', ThingManager )
.service( 'PrototypeManager', PrototypeManager )

.filter('exposed', function() {
  return function(items) {
    var filteredItems = [];
    angular.forEach( items, function( item ) {
      if( item.options.exposed ) {
        filteredItems.push( item );
      }
    });
    return filteredItems; 
  }
})
.filter('sidebar', function() {
  return function(items) {
    var filteredItems = [];
    angular.forEach( items, function( item ) {
      if( item.options.sidebar ) {
        filteredItems.push( item );
      }
    });
    return filteredItems; 
  }
})
.filter('notSidebar', function() {
  return function(items) {
    var filteredItems = [];
    angular.forEach( items, function( item ) {
      if( !item.options.sidebar ) {
        filteredItems.push( item );
      }
    });
    return filteredItems; 
  }
})

.filter('notCreated', function() {
  return function(items) {
    var filteredItems = [];
    angular.forEach( items, function( item ) {
      if( item.options.singleton ) {
        if( !item.alreadyCreated) {
          filteredItems.push( item );
        }
      } else {
        filteredItems.push( item );
      }
    });
    return filteredItems; 
  }
})

.directive('ckEditor', function() {
  return {
    require: '?ngModel',
    link: function(scope, elm, attr, ngModel) {
      var ck = CKEDITOR.replace(elm[0]);
      var ready = false;
      if (!ngModel) return;

      ck.on('instanceReady', function() {
        ck.setData(ngModel.$viewValue);
      });

      function updateModel() {
        if(ready) {
          scope.$apply(function() {
              ngModel.$setViewValue(ck.getData());
          });
        }
      }
      ck.on('change', updateModel);
      ck.on('key', updateModel);
      ck.on('dataReady', updateModel);

      ngModel.$render = function(value) {
        if(ngModel.$viewValue !== undefined) {
          ck.setData(ngModel.$viewValue, function() {
            ready = true;
          });
        }
      };
    }
  };
})
.config(function($routeProvider) {
  $routeProvider


    /* Things */
    .when('/', {
      controller:'Things',
      templateUrl:'things.html'
    })
    .when('/edit/:thingId', {
      controller:'EditThing',
      templateUrl:'thingDetail.html'
    })

})


.controller('Things', function($scope, $location, $route, MCData, PrototypeManager, ThingManager) {

  MCData.getData().then(function(_data) {

    ThingManager.initialise( _data.things );
    $scope.things = ThingManager.things;

    PrototypeManager.prototypes = _data.prototypes;
    $scope.prototypes = PrototypeManager.prototypes;

    ThingManager.setupSingletons( $scope.prototypes );
    ThingManager.setupSidebar( $scope.prototypes );

  });
  
  $scope.instantiate = ThingManager.instantiatePrototype;
  $scope.savePrototype = PrototypeManager.save;
  $scope.saveThing = ThingManager.save;

})

.controller('EditThing', function($scope, $http, $location, $upload, $route, $routeParams, MCData, PrototypeManager, ThingManager) {
  MCData.getData().then(function(_data) {

    ThingManager.initialise( _data.things, $routeParams.thingId );
    $scope.things = ThingManager.things;
    $scope.thing = ThingManager.thing;

    $scope.returnPath = "/";

    if( $routeParams.parents !== undefined ) {
      var parents = $routeParams.parents;
      var parentIds = parents.split(",");
      var parentId = parentIds.splice(parentIds.length-1, 1);
      $scope.returnPath = "/edit/" + parentId;
      if( parentIds.length > 0) {
        $scope.returnPath += "?parents=" + parentIds.join(',');
      }
    }

    $scope.getEditPath = function( thingId ) {
      if( $routeParams.parents !== undefined ) {
      return '#edit/' + thingId + '?parents=' + $routeParams.parents + "," + $scope.thing.id;
      }
      return '#edit/' + thingId + '?parents=' + $scope.thing.id;
    }

    PrototypeManager.initialise( _data.prototypes );
    $scope.prototypes = PrototypeManager.prototypes;
    ThingManager.setupSidebar( $scope.prototypes );

  });

  $scope.values = {
    'new':{
      'text':null
    }
  };

  $scope.setupThingField = function(field) {
    field.thingFieldOptions = ThingManager.getThingFieldOptions( field );
    field.prototype = PrototypeManager.getPrototype( field.options.prototype.id );
  }


  $scope.removeItem = ThingManager.removeFieldItem;
  $scope.addItem = ThingManager.addFieldItem;

  $scope.getMirrorDetails = function(field) {
    var thing = $scope.getThing(field.options.mirrorThing.id );
    var fields = $.grep(thing.fields, function(v,i) {
      return parseInt(v.id) === parseInt(field.options.mirrorField.id);
    });
    var mirrorField = fields[0];
    mirrorField.thing = thing;
    return mirrorField;
  }

  $scope.onFileSelect = function( $files, field, index ) {
    ThingManager.onFileSelect( $scope, $files, field, index );
  };

  $scope.getThing = ThingManager.getThing;

  $scope.save = ThingManager.save;

  $scope.destroy = function() {
     ThingManager.destroy( $scope.thing, $scope.returnPath );
  }

  $scope.getMirrorFields = function(field) {
    $scope.mirrorFields = [];
    if(field.options !== null && field.options.mirrorThing !== null) {
      var mid = field.options.mirrorThing.id;
      var other = null;
      for(var i = 0; i < $scope.things.length; i++) {
        if($scope.things[i].id === mid) {
          other = $scope.things[i];
          break;
        }
      }

      for(var i = 0; i < other.fields.length; i++) {
        $scope.mirrorFields.push({ "name":other.fields[i].name, "id":other.fields[i].id });
      }
    }
  }

});