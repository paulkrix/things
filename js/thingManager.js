function ThingManager($location, $route, $upload, PrototypeManager, MCData) {

  this.things = [];
  this.thing = null;
  this.otherThings = [];
  var that = this;

  this.initialise = function( things, thingId ) {
    that.things = things;
    if( thingId !== undefined && thingId !== null ) {
      that.getCurrentThing( thingId );
    }
  }

  this.setupSingletons = function( prototypes ) {

    for( var i = 0; i < prototypes.length; i++ ) {
      var prototype = prototypes[i];
      if( prototype.options.singleton === true ) {
        for( var j = 0; j < that.things.length; j++ ) {
          var thing = that.things[j];
          if( thing.prototype === prototype.id ) {
            prototype.alreadyCreated = true;
            break;
          }
        }
      }
    }

/*
    for( var i = 0; i < that.things.length; i++ ) {
      var thing = that.things[i];
      thing.sidebar = false;
    }
*/
  }
 
  this.setupSidebar = function( prototypes ) {
    for( var i = 0; i < prototypes.length; i++ ) {
      var prototype = prototypes[i];
      if( prototype.options.singleton === true && prototype.options.sidebar === true ) {
        for( var j = 0; j < that.things.length; j++ ) {
          var thing = that.things[j];
          if( thing.prototype === prototype.id ) {
            thing.sidebar = true;
            break;
          }
        }
      }
    }

  }

  this.getCurrentThing = function( thingId ) {
    var thingArray = $.grep( that.things, function(t,i) {
      return parseInt(t.id) === parseInt(thingId);
    });
    this.thing = thingArray[0];
  }

  this.getOtherThings = function() {
    for(var i = 0; i < that.things.length; i++) {
      if(that.things[i].id !== that.thing.id) {
        that.otherThings.push({"id":that.things[i].id,"name":that.things[i].name});
      }
    }
  }

  this.instantiatePrototype = function( prototype, callback ) {
    var newThing = jQuery.extend({},prototype);
    newThing.prototype = newThing.id;
    newThing.id = null;
    newThing.options = prototype.options;
    for(var i = 0; i < newThing.fields.length; i++) {
      newThing.fields[i].thing = null;
      newThing.fields[i].value = null;
      newThing.fields[i].id = null;
    }
    that.save( newThing, callback );
  }

  this.save = function( thing, callback, returnPath ) {

    if( thing === undefined || thing === null) {
      if( that.thing === undefined || that.thing === null) {
        return false;
      }
      thing = that.thing;
    }
    MCData.save(thing, "thing", function(data) {
      if(data.status === "error") {
        console.log(data.error);
        return;
      }
      if(data.thingId !== 0 ) {
        thing.id = data.thingId;
      }
      if( callback !== undefined && callback !== null ) {
        callback( thing, data );
      } else if( returnPath !== undefined && returnPath !== null ) {
         $location.url( returnPath );
      } else {
        $route.reload();
      }
    });
  }

  this.destroy = function( thing, returnPath ) {
    MCData.destroy(thing, 'thing', function(data) {
      if(data.status === "error") {
        console.log(data.error);
        return;
      }
      if( returnPath === undefined) {
        $location.path("/");
      } else {
        $location.path( returnPath );
      }    
    });
  }

  this.getThing = function( thingId ) {
    var thingArray = $.grep( that.things, function(v,i) {
      return parseInt(v.id) === parseInt(thingId);
    });
    
    if(thingArray.length === 0) {
      return {"id":thingId, "name":"This item seems to have been deleted"};
    }
    return thingArray[0];
  }

  this.onFileSelect = function( $scope, $files, field, index ) {
    for (var i = 0; i < $files.length; i++) {
      var file = $files[i];
      $('#loading-overlay').show();
      $scope.upload = $upload.upload({
        url: '../upload.php',
        method: 'POST',
        data: {"id": field.id, "thing": $scope.thing.id},
        file: file,
      }).progress(function(evt) {
      }).success(function(data, status, headers, config) {
        if(field.array) {
          if(field.value === null) {
            field.value = [];
          }
          if(index === undefined) {
            field.value[field.value.length-1] = data;
          } else {
            field.value[index] = data;
          }
        } else {
          field.value = data;
        }
        $('#loading-overlay').hide();
        that.save( that.thing, function(){} );
      });
    }
  }

  this.getThingFieldOptions = function( field ) {
    var otherFieldThings = [];
    for(var i = 0; i < that.things.length; i++) {
      var thing = that.things[i];
      if( parseInt(thing.prototype) !== parseInt(field.options.prototype.id) ){
        continue;
      }
      var alreadyInList = false;
      if( field.value === null) {
        otherFieldThings.push(thing);
        continue;
      }
      for( var j = 0; j < field.value.length; j++ ) {
        if( parseInt(thing.id) === parseInt(field.value[j]) ) {
          alreadyInList = true;
          break;
        }
      }
      if(!alreadyInList) {
        otherFieldThings.push(thing);
      }
    }
    return otherFieldThings;
  };

  this.removeFieldItem = function( field, index ) {
    var value = field.value.splice(index, 1)[0];
    if( field.type == "IMAGE" || field.type == "FILE" ) {
      if( value !== null ) {
        MCData.deleteFile( value );
      }
    }
    MCData.save( that.thing, "thing");
    $route.reload();
  }

  this.addFieldItem = function( field, newValue ) {
    if( field.value === null ) {
      field.value = [];
    }
    if( field.type === "THING" ) {
      if( newValue === null || newValue === undefined ) {
        var prototype = PrototypeManager.getPrototype( field.options.prototype.id );
        that.instantiatePrototype( prototype, function( newThing ) {
          that.things.push( newThing );
          field.value.push( newThing.id );
          MCData.save( that.thing, "thing" );
        });
      } else {
        field.value.push( newValue.id );
        MCData.save( that.thing, "thing" );
        $route.reload();
      }
    } else {
      field.value.push( newValue );
      MCData.save( that.thing, "thing" );
      $route.reload();
    }
  }

}