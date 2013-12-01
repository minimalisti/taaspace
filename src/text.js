Taaspace.Text = (function () {
  //
  // Methods
  //   create(space, string, options)
  //
  var exports = {};
  /////////////////
  
  
  
  // Constructor
  
  var Text = function (space, string, options) {
    
    // Normalize parameters
    if (typeof options === 'undefined') {
      options = {};
    }
    
    this._space = space;
    this._string = string;
    
    // Font size
    if (options.hasOwnProperty('fontSize')) {
        this._fontSize = options.fontSize;
    } else {
        this._fontSize = 1;
    }
    
  };
  
  // Inherit from SpaceElement
  Text.prototype = Taaspace.SpaceElement.create();
  
  // Extend Taaspace
  Taaspace.extension.createText = function (string, options) {
    var txt = new Text(this, string, options);
    return this.importSpaceElement(txt);
  };
  
  
  
  // Mutators
  
  Text.prototype.fontSize = function (newSize, options) {
    // Parameter
    //   options
    // 
    // Options
    //   Animation NOT IMPLEMENTED YET
    //   disableHtmlUpdate NOT IMPLEMENTED YET
    // 
    // Return
    //   this
    //     for chaining
    this._fontSize = newSize;
    this._scaleHtmlElement(options);
    return this;
  };
  
  Text.prototype.fontScale = function (multiplier, options) {
    // Scale font size by multiplier. Do not affect to element width.
    // 
    // Parameter
    //   options
    // 
    // Options
    //   Animation NOT IMPLEMENTED YET
    //   disableHtmlUpdate NOT IMPLEMENTED YET
    throw 'Not implemented';
  };
  
  
  
  // Pseudo-private mutators
  
  Text.prototype._appendHtmlElement = function (options) {
    // Called by space.
    // Appends HTMLElement into DOM.
    // 
    // Parameter
    //   options (optional)
    // 
    // Option
    //   disableHTML
    //     Handle string as plain text. See jQuery .text() and .html()
    
    // Normalize params
    if (typeof options !== 'object') {
      options = {};
    }
    
    var p = $(document.createElement('p'));
    this._htmlElement = p;
    
    var method = 'html';
    if (options.hasOwnProperty('disableHTML')) {
      if (options.disableHTML === true) {
        method = 'text';
      }
    }
    p[method](this._string);
    
    p.attr({
      'class': Taaspace.SPACE_ELEMENT_CLASS + ' taaspace-text'
    });
    
    p.css({
      position: 'absolute'
    });
    
    this._space._container.append(p);
    
    // Init position
    this._moveHtmlElement(options);
    
    return p;
  };
  
  Text.prototype._scaleHtmlElement = function (options) {
    // Parameter
    //   options
    // 
    // Option
    //   Animation (Not implemented)
    
    var from = this._space.translatePointFromSpace;
    var nw = from(this._x, this._y);
    var se = from(this._x + this._w, this._y + this._h);
    
    var dist = this._space.translateDistanceFromSpace;
    var size = dist(this._fontSize);
    
    this._htmlElement.css({
      'font-size': size + 'px',
      left: nw.x + 'px',
      top: nw.y + 'px',
      width: (se.x - nw.x) + 'px',
      height: (se.y - nw.y) + 'px'
    });
  };
  
  
  
  ///////////////
  return exports;
}());
