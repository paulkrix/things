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
    PrototypeManager.prototypes = _data.prototypes;
    $scope.prototypes = PrototypeManager.prototypes;
  });

  $scope.prototype = {
    name: "",
    id: null,
    fields: [],
    options: {}
  }

  $scope.save = PrototypeManager.save;

})

.controller('EditField', function($scope, $http, $location, $routeParams, MCData, PrototypeManager) {
  MCData.getData('prototype').then(function(_data) {

    PrototypeManager.prototypes = _data.prototypes;
    $scope.prototypes = PrototypeManager.prototypes;
    PrototypeManager.getCurrentPrototype( $routeParams.prototypeId, $scope.prototypes );
    $scope.prototype = PrototypeManager.prototype;

    $scope.field = PrototypeManager.getField( $scope.prototype, $routeParams.fieldId );

    $scope.otherPrototypes = PrototypeManager.getOtherPrototypes( $scope.prototype, $scope.prototypes );
  });

  $scope.saveField = PrototypeManager.saveField;
  $scope.destroyField = PrototypeManager.destroyField;

})

.controller('CreateField', function($scope, $http, $location, $routeParams, MCData, PrototypeManager) {
  MCData.getData('prototype').then(function(_data) {

    PrototypeManager.prototypes = _data.prototypes;
    $scope.prototypes = PrototypeManager.prototypes;
    PrototypeManager.getCurrentPrototype( $routeParams.prototypeId, $scope.prototypes );
    $scope.prototype = PrototypeManager.prototype;

    $scope.otherPrototypes = PrototypeManager.getOtherPrototypes( $scope.prototype, $scope.prototypes );

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

    ThingManager.things = _data.things;
    $scope.things = ThingManager.things;

    PrototypeManager.prototypes = _data.prototypes;
    $scope.prototypes = PrototypeManager.prototypes;

    for( var i = 0; i < $scope.prototypes.length; i++ ) {
      var prototype = $scope.prototypes[i];
      if(prototype.options.singleton === true) {
        for( var j = 0; j < $scope.things.length; j++ ) {
          var thing = $scope.things[j];
          if(thing.prototype === prototype.id) {
            prototype.alreadyCreated = true;
            break;
          }
        }
      }
    }

    for( var i = 0; i < $scope.things.length; i++ ) {
      var thing = $scope.things[i];
      thing.sidebar = false;
    }

    for( var i = 0; i < $scope.prototypes.length; i++ ) {
      var prototype = $scope.prototypes[i];
      if(prototype.options.singleton === true && prototype.options.sidebar === true) {
        for( var j = 0; j < $scope.things.length; j++ ) {
          var thing = $scope.things[j];
          if(thing.prototype === prototype.id) {
            thing.sidebar = true;
            break;
          }
        }
      }
    }
  });

  $scope.instantiate = function( prototype ) {
    ThingManager.instantiatePrototype( prototype, function() {
      $route.reload();
    });
  }

  $scope.save = PrototypeManager.save;

})

.controller('EditThing', function($scope, $http, $location, $upload, $route, $routeParams, MCData, PrototypeManager, ThingManager) {
  MCData.getData().then(function(_data) {

    ThingManager.things = _data.things;
    $scope.things = ThingManager.things;
    ThingManager.getCurrentThing($routeParams.thingId, $scope.things);
    $scope.thing = ThingManager.thing;
    $scope.otherThings = [];

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

    for(var i = 0; i < $scope.things.length; i++) {
      if($scope.things[i].id !== $scope.thing.id) {
        $scope.otherThings.push({"id":$scope.things[i].id,"name":$scope.things[i].name});
      }
    }
    PrototypeManager.prototypes = _data.prototypes;
    $scope.prototypes = PrototypeManager.prototypes;
    for( var i = 0; i < $scope.prototypes.length; i++ ) {
      var prototype = $scope.prototypes[i];
      if(prototype.options.singleton === true && prototype.options.sidebar === true) {
        for( var j = 0; j < $scope.things.length; j++ ) {
          var thing = $scope.things[j];
          if(thing.prototype === prototype.id) {
            thing.sidebar = true;
            break;
          }
        }
      }
    }
  });

  $scope.values = {
    "new":null
  };

  $scope.setupThingField = function(field) {
    field.thingFieldOptions = ThingManager.getThingFieldOptions($scope.things, $scope.thing, field);
    field.prototype = PrototypeManager.getPrototype(field.options.prototype.id, $scope.prototypes);
  }

  $scope.removeItem = function(field, index) {

    var value = field.value.splice(index, 1)[0];
    if( field.type == "IMAGE" || field.type == "FILE" ) {
      if( value !== null ) {
        MCData.deleteFile( value );
      }
    }
    MCData.save($scope.thing, "thing");
    $scope.getThingFieldOptions(field);
    $route.reload();

  }

  $scope.addItem = function(field, newValue) {
    if(field.value === null) {
      field.value = [];
    }
    if(field.type === "THING") {
      if(newValue === null || newValue === undefined) {
        var prototype = PrototypeManager.getPrototype(field.options.prototype.id, $scope.prototypes);
        ThingManager.instantiatePrototype(prototype, function(newThing) {
          $scope.things.push( newThing );
          field.value.push(newThing.id);
          MCData.save($scope.thing, "thing");
        });
      } else {
        field.value.push(newValue.id);
        MCData.save($scope.thing, "thing");
        $route.reload();
      }

    } else {
      field.value.push(newValue);
      MCData.save($scope.thing, "thing");
    }
  }

  $scope.getMirrorDetails = function(field) {
    var thing = $scope.getThing(field.options.mirrorThing.id, $scope.things);
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
     ThingManager.save( $scope.thing, $scope.returnPath );
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