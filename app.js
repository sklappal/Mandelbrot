// Copyright Sampsa Lappalainen 2012
function App() {
  
  var gl;
  function initGL() {
      try {
          var canvas = Get3dCanvas();
          gl = canvas.getContext("experimental-webgl");
          gl.viewportWidth = canvas.width;
          gl.viewportHeight = canvas.height;
      } catch (e) {
  
      }
      if (!gl) {
          alert("Could not initialise WebGL, sorry :-(");
      }
  }
  
  function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent + "\n";
        }
        k = k.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
  }
  
  
  var shaderProgram;
  
  function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "uModelMatrix");
    shaderProgram.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "uViewMatrix");
   
    shaderProgram.zoom = gl.getUniformLocation(shaderProgram, "zoom");
    shaderProgram.translation = gl.getUniformLocation(shaderProgram, "translation");
   
   
  }
  
  
  var modelMatrix = mat4.create();
  var modelMatrixStack = [];
  var pMatrix = mat4.create();
  var viewMatrix = mat4.create();
  
  function modelPushMatrix() {
    var copy = mat4.create();
    mat4.set(modelMatrix, copy);
    modelMatrixStack.push(copy);
  }
  
  function modelPopMatrix() {
    if (modelMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    modelMatrix = modelMatrixStack.pop();
  }
  
 var curX, curY, curZoom;
 
  function Reset() {
    curX = -0.7;
    curY = 0.0;
    curZoom = 1.2;  
  };
  
  function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
    gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
    
    gl.uniform1f(shaderProgram.zoom, curZoom);
    gl.uniform2f(shaderProgram.translation, curX, curY);
  }
       
var squareVertexPositionBuffer;

  function initBuffers() {
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         3.0,  3.0,  0,
        -3.0,  3.0,  0,
         3.0, -3.0,  0,
        -3.0, -3.0,  0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
  }


  function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(50, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(modelMatrix);
    mat4.identity(viewMatrix);

    mat4.translate(modelMatrix, [0.0, 0.0, -2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
  }

  
  function initialize() {
    initCanvasStyles();
    resize();
    initGL();
    initShaders();
    initBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    Reset();
  }
  
  function initCanvasStyles() { 
    var canvas3d = Get3dCanvas();
    canvas3d.style.position = 'absolute';
    //canvas3d.style.cursor = 'none';
  
    
  }
  
  function resize() {
    var canvas = Get3dCanvas();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function Get3dCanvas() {
    return document.getElementById("canvas");
  }
  
  mouseDown = false;
  function OnMouseDown(ev) {
    if (ev.which == 1) {
      mouseDown = true;
    } else {
      alert("curZoom: " + curZoom + "\n" + "curX: " + curX + "\ncurY: " + curY);      
    } 
  }
 
  function OnMouseUp() {
    mouseDown = false;    
  }
  
  prevMouseX = 0.0;
  prevMouseY = 0.0;
  function OnMouseMove(ev) {
    if (mouseDown) {
      curX -= (ev.clientX - prevMouseX) * 0.005 * curZoom;
      curY += (ev.clientY - prevMouseY) * 0.005 * curZoom;
    }
    prevMouseX = ev.clientX;
    prevMouseY = ev.clientY;
  }
 
  function OnKeyDown(event) {
    if (event.keyCode == 32) {
      // space
      Reset();
    }
      
  }
  
  
  this.webGLStart = function() {
    initialize();

    window.onresize = resize;
    document.onmousedown = OnMouseDown;
    document.onmouseup = OnMouseUp;
    document.onmousemove = OnMouseMove;
    document.onkeydown = OnKeyDown;
    if (window.addEventListener)
      /** DOMMouseScroll is for mozilla. */
      window.addEventListener('DOMMouseScroll', wheel, false);
    /** IE/Opera. */
    window.onmousewheel = document.onmousewheel = wheel;
    tick();
  }
  
  function tick() {
    requestAnimFrame(tick);
    drawScene();
  }
 
  function handle(delta) {
    var zoomFac = 1.1;
    var invZoom = 1.0 / zoomFac;
    if (delta < 0) {
      curZoom *= zoomFac;
    } else {
      curZoom *= invZoom;
    }
    curZoom = Math.max(0.000027, curZoom);
    curZoom = Math.min(1.0, curZoom);
  }
        
  /** Event handler for mouse wheel event.
   */
  function wheel(event) {
    var delta = 0;
    if (!event) /* For IE. */
            event = window.event;
    if (event.wheelDelta) { /* IE/Opera. */
            delta = event.wheelDelta/120;
    } else if (event.detail) { /** Mozilla case. */
            /** In Mozilla, sign of delta is different than in IE.
             * Also, delta is multiple of 3.
             */
            delta = -event.detail/3;
    }
    /** If delta is nonzero, handle it.
     * Basically, delta is now positive if wheel was scrolled up,
     * and negative, if wheel was scrolled down.
     */
    if (delta)
            handle(delta);
    /** Prevent default actions caused by mouse wheel.
     * That might be ugly, but we handle scrolls somehow
     * anyway, so don't bother here..
     */
    if (event.preventDefault)
            event.preventDefault();
    event.returnValue = false;
  }
    
  
}
