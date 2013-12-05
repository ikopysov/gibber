( function() {

"use strict"

var Graphics = Gibber.Graphics = {
  canvas :  null,
  ctx:      null,
  width:    0,
  height:   0,
  running:  false,
  resolution: .5,
  fps: null,
  
  load : function() {
    $script( [ 'external/three/three.min', 'external/three/stats.min', 'gibber/graphics/geometry','gibber/graphics/2d', 'gibber/graphics/shapes2d'], 'graphics', function() {
      console.log("LOADED")
      $script([
        'external/three/postprocessing/EffectComposer',
        'external/three/postprocessing/RenderPass',
        'external/three/postprocessing/MaskPass',
        'external/three/postprocessing/ShaderPass',
        'external/three/postprocessing/CopyShader',
        'external/three/postprocessing/shaders/DotScreenShader',
        'external/three/postprocessing/DotScreenPass',
        'external/three/postprocessing/FilmPass',
        'external/three/postprocessing/shaders/FilmShader',      
        'external/three/postprocessing/shaders/KaleidoShader',
        'external/three/postprocessing/shaders/EdgeShader',
        'external/three/postprocessing/shaders/FocusShader',      
        'external/three/postprocessing/shaders/ShaderGodRays',      
        'external/three/postprocessing/shaders/BleachBypassShader',
        'external/three/postprocessing/shaders/ColorifyShader',
      ], 'postprocessing', function() {
        console.log("CALLED")
        $script(['gibber/graphics/postprocessing','gibber/graphics/shader'], function() {
          console.log( 'POST PROCESSING INIT' )
          Graphics.PostProcessing.init()
          //Graphics.start()
        })
      })
    })
  },
  
  init : function( mode, column ) {
    this.canvas = $( '<div>' )
          
    this.canvas.parent = typeof column === 'undefined' ? window : column.element
    this.assignWidthAndHeight( true )
    this.canvas.css({
        left:0,
        top:0,
        position: this.canvas.parent === window ? 'fixed' : 'absolute',
        float: this.canvas.parent === window ? 'none' : 'left',
        overflow:'hidden'
      })
      .attr( 'id', 'three' )

    if( this.canvas.parent === window ) { 
      $( '#contentCell' ).append( this.canvas )
    }else{
      $( column.element ).append( this.canvas )
    }
    
    this.render = this.render.bind( this )
    this.mode = mode || '3d'    
    this.createScene( this.mode )

    var res = this.resolution, self = this
    Object.defineProperty(this, 'resolution', {
      get: function() { return res; },
      set: function(v) { res = v; self.assignWidthAndHeight() }
    });

    var running = false
    Object.defineProperty(this, 'running', {
      get: function() { return running },
      set: function(v) {
        if( v !== running ) {
          if( running === true ) { // switching to false, clear screen
            self.render()
            running = v
          }else{ // switching to true, restart animation timer
            running = v
            self.render()
          }
        }
      }
    });
    this.start()

  },
  
  createScene : function( mode ) {		
    this.renderer = new THREE.WebGLRenderer();
    
		$( '#three' ).append( this.renderer.domElement )
    
    this.assignWidthAndHeight()
		this.scene = new THREE.Scene();
		// must wait until scene and renderer are created to initialize effect composer

    this.ambientLight = new THREE.AmbientLight(0xFFFFFF);

		this.pointLight = new THREE.PointLight( 0xFFFFFF )
		this.pointLight.position.x = 100
		this.pointLight.position.y = 100
		this.pointLight.position.z = -130

		this.pointLight2 = new THREE.PointLight( 0x666666 )
		this.pointLight2.position.x = 0
		this.pointLight2.position.y = 0
		this.pointLight2.position.z = 260

		this.lights = [ this.pointLight, this.pointLight2 ]
    this.use( mode ); // creates camera and adds lights	
		this.graph = [];
	
    this.camera.updateProjectionMatrix();
    if( this.mode === '3d' ) {
      this.camera.position.z = 250;
      this.camera.lookAt( this.scene.position );
    }
  },
  
  start : function() {
    this.running = true
		window.requestAnimationFrame( this.render );
  },
  
  use : function( mode ) {
    $( '#three' ).show()

    if( mode === '2d' ) {
      console.log("Now drawing in 2d.")
      if( this.mode === '3d' ) {
        this.scene.remove( this.camera )
        this.scene.remove( this.pointLight )
        this.scene.remove( this.pointLight2 )
        this.scene.add( this.ambientLight )
      }

      this.camera = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 1.00000001 );
      this.camera.position.z = 1
      this.resolution = 1
      this.renderer.setSize( this.width, this.height )

      this.mode = '2d'
    }else{
      console.log("Now drawing in 3d.")
      if( this.mode === '2d' ) {
        Gibber.Graphics.canvas2d.hide()
        this.scene.remove( this.camera )
      }
		  var VIEW_ANGLE = 45,
		  	  ASPECT = this.width / this.height,
		  	  NEAR = 0.1,
		  	  FAR = 10000;

     	this.camera = new THREE.PerspectiveCamera(
		    VIEW_ANGLE,
		    ASPECT,
		    NEAR,
		    FAR
		  )
      this.scene.add( this.camera );
      this.camera.updateProjectionMatrix();
      this.scene.add( this.pointLight );
      this.scene.add( this.pointLight2 );
      this.scene.remove( this.ambientLight );

      this.camera.position.z = 250;
      this.camera.lookAt( this.scene.position )

      this.mode = '3d'
    }
  }, 
  clear : function() {
    if( this.running ) {
      for( var i = 0; i < this.graph.length; i++ ) {
        this.graph[ i ].remove( true )
      }

      this.graph.length = 0
      // if( this.PostProcessing ) this.PostProcessing.fx.length = 0
      for( var j = this.PostProcessing.fx - 1; j >= 0; j++ ) {
        this.PostProcessing.fx[ j ].remove()
      }
      
      this.running = false
    }
  },
  render : function() {
   
    if( this.running ) {
  		for( var i = 0; i < this.graph.length; i++ ) {
  			this.graph[i]._update();
  			this.graph[i].update();
  		}

  		this.renderer.clear()
      
      if( this.PostProcessing && this.PostProcessing.fx.length ) {
        this.PostProcessing.composer.render()
      }else{
        this.renderer.render( this.scene, this.camera )
      }

  		if( this.stats ) this.stats.update()
      
      if( this.fps === null || this.fps >= 55 ) {
        window.requestAnimationFrame( this.render )
      }else{
        setTimeout( function() { Graphics.render() }, 1000 / this.fps )
      }
    }
  },
  
  test : function() {
    var cube = new THREE.CubeGeometry( 50, 50, 50 ),
        fill = new THREE.Color( 0x000000 ).setRGB( .5, 0, 0 ),
        mat  = new THREE.MeshPhongMaterial( { color: fill, shading: THREE.FlatShading, shininess: 50 } ),
        geo  = new THREE.Mesh( cube, mat );
				
    this.scene.add( geo )
    this.graph.push( geo )
    
    return geo
  },
  
	showStats : function() {
		this.stats = new Stats();
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '0px';
		this.stats.domElement.style.right = '0px';			
		$( 'body' ).append( this.stats.domElement );	
	},
  
  assignWidthAndHeight : function( isInitialSetting ) { // don't run final lines before renderer is setup...
    this.width = $( this.canvas.parent ).width() // either column or window... 
    this.height = $( window ).height() - $( "thead" ).height() - $( "tfoot" ).height()

    this.canvas.css({
      top: $( '#header' ).height(),
      width: this.width,
      height: this.height,
      zIndex: -1
    })
    
    if( !isInitialSetting ) {
  		this.renderer.setSize( this.width * this.resolution, this.height * this.resolution );
      $( this.renderer.domElement ).css({ width: this.width, height: this.height })
    }
  },
  
}

})()