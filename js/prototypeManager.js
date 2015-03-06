function PrototypeManager($location, MCData) {

  this.prototypes = [];
  this.prototype = null;

  this.getPrototype = function( prototypeId, prototypes ) {
    var prototypeArray = $.grep(prototypes, function(v,i) {
      return parseInt(v.id) === parseInt(prototypeId);
    });
    return prototypeArray[0];
  }
}