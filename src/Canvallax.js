  var win = window,
      doc = document,
      root = doc.documentElement,
      body = doc.body,
      requestAnimationFrame = win.requestAnimationFrame || win.mozRequestAnimationFrame || win.webkitRequestAnimationFrame || win.msRequestAnimationFrame || win.oRequestAnimationFrame || function(callback){ win.setTimeout(callback, 20); },

      noop = function(){},

      // Default options
      defaults = {

        scroll: true,
        // (Boolean||'invert'||'invertx'||'inverty')
        // If true, the X and Y of the scene are tied to document's scroll for a typical parallax experience.
        // If 'invert'||'invertx'||'inverty', the appropriate axes will be reversed on scroll.
        // Set to false if you want to control the scene's X and Y manually, perfect for animating with GSAP.

        x: 0,
        // (Number)
        // Starting x position.
        // If tied to scroll, this will be overridden on render.

        y: 0, // (Number)
        // Starting y position.
        // If tied to scroll, this will be overridden on render.

        damping: 1,
        // (Number)
        // The 'easing' of the x & y position when updated. 1 = none, higher is longer.
        // If you're syncing parallax items to regular items in the scroll, then you'll probably want a low damping.

        canvas: undefined,
        // (Node)
        // Use Canvallax on an existing canvas node, otherwise one is created.

        className: '',
        // (String)
        // Classes to add to the canvas, in addition to the 'canvallax' class automatically added.

        parent: document.body,
        // (Node)
        // Canvas is prepended to document.body by default. Override with your own node if you want it within a certain container.

        elements: undefined,
        // (Array)
        // Collection of elements to render on the Canvallax instance

        animating: true,
        // (Boolean)
        // Update canvas every requestAnimationFrame call.

        fullscreen: true,
        // (Boolean)
        // Set the canvas width and height to the size of the window, and update on window resize. Otherwise, the provided with and height will be used.

        preRender: noop,
        // (Function)
        // Callback before elements are rendered.

        postRender: noop
        // (Function)
        // Callback after elements are rendered.

      },

      // Only one scroll tracker that works for every Canvallax instance
      watchingScroll = false,
      winScrollX = 0,
      winScrollY = 0,
      onScroll = function(){
        winScrollX = root.scrollLeft || body.scrollLeft;
        winScrollY = root.scrollTop || body.scrollTop;
      };


  // Check for canvas support, exit out if no supprt
  if ( !win.CanvasRenderingContext2D ) { return win.Canvallax = function(){ return false; }; }

  win.Canvallax = function Canvallax(options) {
    // Make new instance if not called with `new Canvallax`
    if ( !(this instanceof Canvallax) ) { return new Canvallax(options); }

    var C = this;

    Canvallax.extend(this,defaults,options);

    C.canvas = C.canvas || doc.createElement('canvas');
    C.canvas.className += ' canvallax ' + C.className;

    C.parent.insertBefore(C.canvas, C.parent.firstChild);

    if ( C.fullscreen ) {
      C.resizeFullscreen();
      win.addEventListener('resize', C.resizeFullscreen.bind(C));
    } else {
      C.resize(C.width,C.height);
    }

    C.ctx = C.canvas.getContext('2d');

    C.elements = [];
    if ( options && options.elements ) { C.addElements(options.elements); }

    C.damping = ( !C.damping || C.damping < 1 ? 1 : C.damping );

    C.render();

    return C;
  }

////////////////////////////////////////

  function _zIndexSort(a,b){
    return (a.zIndex === b.zIndex ? 0 : a.zIndex < b.zIndex ? -1 : 1 );
  }

  Canvallax.prototype = {

    _x: 0,
    _y: 0,

    add: function(el){

      var elements = el.length ? el : arguments,
          len = elements.length,
          i = 0;

      for ( ; i < len; i++ ) {
        this.elements.push(elements[i]);
      }

      this.elements.sort(_zIndexSort);
      return this;
    },

    remove: function(element){
      var index = this.elements.indexOf(element);

      if ( index > -1 ) {
        this.elements.splice(index, 1);
      }
      return this;
    },

    render: function() {
      var C = this,
          i = 0,
          len = C.elements.length;

      if ( C.animating ) { C.animating = requestAnimationFrame(C.render.bind(C)); }

      if ( C.scroll ) {
        if ( !watchingScroll ) {
          watchingScroll = true;
          onScroll();
          win.addEventListener('scroll', onScroll);
          win.addEventListener('touchmove', onScroll);
        }
        C.x = ( C.scroll === 'invert' || C.scroll === 'invertx' ? -winScrollX : winScrollX );
        C.y = ( C.scroll === 'invert' || C.scroll === 'inverty' ? -winScrollY : winScrollY );
      }

      C._x += ( -C.x - C._x ) / C.damping;
      C._y += ( -C.y - C._y ) / C.damping;

      C.ctx.clearRect(0, 0, C.width, C.height);
      //C.ctx.scale(C.zoom,C.zoom);

      C.preRender(C.ctx,C);

      for ( ; i < len; i++ ){
        C.ctx.save();
        C.elements[i]._render(C.ctx,C);
        C.ctx.restore();
      }

      C.postRender(C.ctx,C);

      return this;
    },

    resize: function(width,height){
      this.width = this.canvas.width = width;
      this.height = this.canvas.height = height;
      return this;
    },

    resizeFullscreen: function() {
      return this.resize(win.innerWidth,win.innerHeight);
    },

    play: function(){
      this.animating = true;
      return this.render();
    },

    pause: function(){
      this.animating = false;
      return this;
    }
  };

////////////////////////////////////////

  Canvallax.extend = function(target) {
    target = target || {};

    var length = arguments.length,
        i = 1;

    if ( arguments.length === 1 ) {
      target = this;
      i = 0;
    }

    for ( ; i < length; i++ ) {
      if ( !arguments[i] ) { continue; }
      for ( var key in arguments[i] ) {
        if ( arguments[i].hasOwnProperty(key) ) { target[key] = arguments[i][key]; }
      }
    }

    return target;
  };