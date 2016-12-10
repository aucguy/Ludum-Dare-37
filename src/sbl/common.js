base.registerModule('sbl.common', function() {
  var util = base.importModule('util');
  
  var Token = util.extend(Object, 'Token', {
    constructor: function Token(position) {
      this.position = position;
    }
  });
});