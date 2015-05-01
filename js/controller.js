angular.module('things', ['ngRoute', 'angularFileUpload', 'ui.bootstrap'])
.factory('MCData', function($http) {
  return {
    getData: function(type) {
      if(type === null || type === undefined) {
        type = 'all';
      }
      return $http.get('data/load.php?='+type+'&cacheBreaker='+Date.now()).then(function(result) {
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
      $http.post('data/save.php', { 'data': data, 'type':type })
      .success(callback);
    },

    destroy: function (data, type, callback) {
      if(callback === undefined) {
        callback = function(){}
      };
      $http.post('data/destroy.php', { 'data': data, 'type':type })
      .success(callback);
    }


  }
})
.service( 'ThingManager', ThingManager )
.service( 'PrototypeManager', PrototypeManager )
.directive('sortable', function(MCData) {
  return {
    restrict: 'A',
    require: '^ngModel',
    controller: ['$scope', 'MCData', function($scope) {
      $scope.dragStart = function(e, ui) {
        ui.item.data('start', ui.item.index());
      };
      $scope.dragEnd = function(e, ui) {
        var start = ui.item.data('start'),
            end = ui.item.index();
        $scope.prototype.fields.splice( end, 0, 
            $scope.prototype.fields.splice( start, 1)[0] );
        $scope.$apply();

        MCData.save($scope.prototype, 'prototype', function(data) {
          if(data.status === "error") {
            console.log(data.error);
            return;
          }
        });

      }
    }],
    link: function($scope, elem, attrs) {
      elem.sortable({
        start: $scope.dragStart,
        update: $scope.dragEnd
      });
    }
  }
})
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
.filter('hidden', function() {
  return function(items) {
    var filteredItems = [];
    angular.forEach( items, function( item ) {
      if( !item.options.exposed ) {
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
    .when('/', {
      controller:'Prototypes',
      templateUrl:'prototypes.html'
    })
    /* Prototypes */
    .when('/edit/prototype/:prototypeId', {
      controller:'EditPrototype',
      templateUrl:'prototypeDetail.html'
    })
    .when('/new/prototype', {
      controller:'CreatePrototype',
      templateUrl:'prototypeDetail.html'
    })
    /* Fields */
    .when('/edit/field/:prototypeId/:fieldId', {
      controller:'EditField',
      templateUrl:'fieldDetail.html'
    })
    .when('/new/field/:prototypeId', {
      controller:'CreateField',
      templateUrl:'fieldDetail.html'
    })
    /* Things */
    .when('/things/', {
      controller:'Things',
      templateUrl:'things.html'
    })
    .when('/edit/thing/:thingId', {
      controller:'EditThing',
      templateUrl:'thingDetail.html'
    })

/*
    .when('/client/'), {
      controller:'ClientThings',
      templateUrl:'client-things.html'
    }
*/

})

.controller('Prototypes', function($scope, MCData) {

  MCData.getData('prototype').then(function(_data) {
    $scope.prototypes = _data.prototypes;
  });

})

.controller('EditPrototype', function($scope, $http, $location, $routeParams, MCData, PrototypeManager) {
  MCData.getData('prototype').then(function(_data) {
    //Get prototypes, setup PrototypeManager
    PrototypeManager.prototypes = _data.prototypes;
    $scope.prototypes = PrototypeManager.prototypes;
    PrototypeManager.getCurrentPrototype( $routeParams.prototypeId, $scope.prototypes );
    $scope.prototype = PrototypeManager.prototype;
  });

  $scope.save = PrototypeManager.save;
  $scope.destroy = PrototypeManager.destroy;

})

.controller('CreatePrototype', function($scope, $http, $location, MCData, PrototypeManager) {
  MCData.getData('prototype').then(function(_data) {
    //Get prototypes, setup PrototypeManager
    PrototypeManager.initialise(_data.prototypes);
    $scope.prototypes = PrototypeManager.prototypes;
    $scope.prototype = PrototypeManager.prototype;

  });

  $scope.save = PrototypeManager.save;

})

.controller('EditField', function($scope, $http, $location, $routeParams, MCData, PrototypeManager) {
  MCData.getData('prototype').then(function(_data) {

    PrototypeManager.initialise( _data.prototypes, $routeParams.prototypeId );
    $scope.prototypes = PrototypeManager.prototypes;
    $scope.prototype = PrototypeManager.prototype;
    $scope.field = PrototypeManager.getField( $routeParams.fieldId );

    PrototypeManager.getOtherPrototypes();
    $scope.otherPrototypes = PrototypeManager.otherPrototypes;

  });

  $scope.saveField = PrototypeManager.saveField;
  $scope.destroyField = PrototypeManager.destroyField;

})

.controller('CreateField', function($scope, $http, $location, $routeParams, MCData, PrototypeManager) {
  MCData.getData('prototype').then(function(_data) {

    PrototypeManager.initialise( _data.prototypes, $routeParams.prototypeId );
    $scope.prototypes = PrototypeManager.prototypes;
    $scope.prototype = PrototypeManager.prototype;

    PrototypeManager.getOtherPrototypes();
    $scope.otherPrototypes = PrototypeManager.otherPrototypes;
    $scope.mirrorFields = [];

  });

  $scope.field = {
    name: "",
    type: "SHORT",
    array: false,
    options: null,
    id: null,
    helpText: ""
  }

  $scope.saveField = PrototypeManager.saveField;
  $scope.destroyField = PrototypeManager.destroyField;

})

.controller('Things', function($scope, $location, $route, MCData, PrototypeManager, ThingManager) {

  MCData.getData().then(function(_data) {

    ThingManager.initialise( _data.things );
    $scope.things = ThingManager.things;

    PrototypeManager.initialise(_data.prototypes);
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

    $scope.returnPath = "/things";

    if( $routeParams.parents !== undefined ) {
      var parents = $routeParams.parents;
      var parentIds = parents.split(",");
      var parentId = parentIds.splice(parentIds.length-1, 1);
      $scope.returnPath = "/edit/thing/" + parentId;
      if( parentIds.length > 0) {
        $scope.returnPath += "?parents=" + parentIds.join(',');
      }
    }

    $scope.getEditPath = function( thingId ) {
      if( $routeParams.parents !== undefined ) {
      return '#edit/thing/' + thingId + '?parents=' + $routeParams.parents + "," + $scope.thing.id;
      }
      return '#edit/thing/' + thingId + '?parents=' + $scope.thing.id;
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

  $scope.save = function() {
     ThingManager.save( $scope.thing, null, $scope.returnPath );
  }
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