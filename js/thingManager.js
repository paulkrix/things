function ThingManager($location, $upload, MCData) {

  this.things = [];
  this.thing = null;

  this.getCurrentThing = function(thingId, things) {
    var thingArray = $.grep(things, function(t,i) {
      return parseInt(t.id) === parseInt(thingId);
    });
    this.thing = thingArray[0];
  }

  this.instantiatePrototype = function( prototype, callback ) {
    var newThing = jQuery.extend({},prototype);
    newThing.prototype = newThing.id;
    newThing.id = null;
    newThing.exposed = false;
    for(var i = 0; i < newThing.fields.length; i++) {
      newThing.fields[i].thing = null;
      newThing.fields[i].value = null;
      newThing.fields[i].id = null;
    }
    // $scope.things.push(newThing);
    MCData.save(newThing, "thing", function(data) {
      if(data.status === "error") {
        console.log(data.error);
        return;
      }
      newThing.id = data.thingId;
      if( callback !== undefined ) {
        callback(newThing);
      }
    });
  }
  this.save = function( thing, returnPath ) {
    MCData.save(thing, "thing", function(data) {
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
  
  this.getThing = function(thingId, things) {
    var thingArray = $.grep(things, function(v,i) {
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
        url: 'upload.php',
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
        MCData.save({things:$scope.things,prototypes:$scope.prototypes});
      });
    }
  }

  this.getThingFieldOptions = function(things, thing, field) {
    var otherFieldThings = [];
    for(var i = 0; i < things.length; i++) {
      var thing = things[i];
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

}