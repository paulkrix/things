function PrototypeManager($location, MCData) {

  this.prototypes = [];
  this.prototype= {};
  this.otherPrototypes = [];
  var that = this;

  this.initialise = function( prototypes, prototypeId ) {
    that.prototype = {
      name: "",
      id: null,
      fields: [],
      options: {}
    }
    that.prototypes = prototypes;
    if( prototypeId !== undefined && prototypeId !== null ) {
      that.getCurrentPrototype( prototypeId );
    }
  }

  this.getCurrentPrototype = function( prototypeId ) {
    this.prototype = this.getPrototype( prototypeId );
  }

  this.getPrototype = function( prototypeId ) {
    var prototypeArray = $.grep( that.prototypes, function(v,i) {
      return parseInt(v.id) === parseInt( prototypeId );
    });
    return prototypeArray[0];
  }


  this.save = function( prototype, changeLocation ) {
    MCData.save(prototype, 'prototype', function(data) {
      if(data.status === "error") {
        console.log(data.error);
        return;
      }
      if( changeLocation === undefined || changeLocation === true ) {
        $location.path('/');
      }
    });
  }

  this.destroy = function( prototype ) {
    MCData.destroy( prototype, 'prototype', function(data) {
      if(data.status === "error") {
        console.log(data.error);
        return;
      }
      $location.path('/');
    });
  }

  this.getField = function( fieldId ) {
    console.log( fieldId );
    var fields = $.grep( that.prototype.fields, function(v,i) {
      return parseInt(v.id) === parseInt(fieldId);
    });
    return fields[0];
  }

  this.getOtherPrototypes = function( ) {
    var otherPrototypes = [];
    for( var i = 0 ; i < that.prototypes.length; i++ ) {
      if( that.prototype.id !== that.prototypes[i].id ) {
        otherPrototypes.push( { "name": that.prototypes[i].name, "id":that.prototypes[i].id } );
      }
    }
    that.otherPrototypes = otherPrototypes;
  }

  this.saveField = function( field, prototype ) {

    if( field.id === null ) {
      field.id = that.assignFieldId( prototype );
      prototype.fields.push( field );
    }

    if( field.type === "THING" ) {
      delete field.options.prototype.name;
    }

    if( field.type === "MIRROR" ) {
      //Not sure what is meant to happen here
      console.log( field );
      //delete $scope.field.options.prototype.name;
      //delete $scope.field.options.mirrorField.name;
    }

    that.save( prototype );
  }

  this.destroyField = function( field, prototype ) {
    for(var i = 0; i < prototype.fields.length; i++) {
      if( prototype.fields[i].id === field.id) {
         prototype.fields.splice(i, 1);
        continue;
      }
    }
    that.save( prototype );
  }

  this.assignFieldId = function ( prototype ) {
    var id = 0;
    for(var i = 0; i < prototype.fields.length; i++) {
      if(id <= prototype.fields[i].id) {
        id = prototype.fields[i].id+1;
      }
    }
    return id;
  }

}