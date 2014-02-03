'use strict';

(function(){
    
    var renderer;
    var gameScene;
    
    var requestAnimationFrame = window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
        function(callback) {
			window.setTimeout( callback, 1000 / 60 );
		};
    
    
    function createSettings() {
        
        //size in meters
        var width = 10;
        var depth = 20;
        var height = 5;
        var tableWidth = 1.5;

        var quality = 0;
        
        var settings = {
            width: width,
            height: height,
            depth: depth,
            planes: [
                {texture:"images/floor4.jpg", size:[width,depth], repeat:[6,6], rotation:[-Math.PI/2,0, 0]}, //floor
                {texture:"images/wall.jpg" , size:[width,height], position:[0, height/2, -depth/2]}, //front wall
                {texture:"images/wall.jpg" , size:[width,height], rotation:[0, Math.PI,0], position:[0, height/2, depth/2]}, //back wall
                {texture:"images/wall.jpg" , size:[depth,height], scale:[-1,1,1],rotation:[0, Math.PI/2, 0], position:[-width/2, height/2, 0]}, //left wall
                {texture:"images/wall.jpg" , size:[depth,height], scale:[-1,1,1], rotation:[0, -Math.PI/2, 0], position:[width/2, height/2, 0]} //right wall
            ],
            table: {
                model: "models/table.js",
                width: tableWidth,
                color: 0x2b476e,
                texture: "images/table.jpg"
            },
            
            paddle: {
                model: "models/paddle.js",
            },
            
            audio: {
                ball: ["audio/ball1.ogg", "audio/ball2.ogg"],
                paddle: ["audio/paddle1.ogg", "audio/paddle2.ogg"]
            }
        };
        
        return settings;
    }
    
    function init(){

        var canvas = document.createElement("canvas");
        canvas.screencanvas = true; //for cocoonjs
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas});
        renderer.setClearColor(0x000000);
        renderer.setSize(canvas.width, canvas.height);
        document.getElementById( 'container' ).appendChild( renderer.domElement );
        
        gameScene = new PingPong.GameScene(renderer, createSettings());
        
        requestAnimationFrame( render );
    }
    
    function render(){     
        gameScene.render();
        requestAnimationFrame(render);
    }
    
    window.onload = init;
    
})();