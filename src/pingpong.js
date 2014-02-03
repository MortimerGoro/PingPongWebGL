/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 Imanol Fernandez @MortimerGoro
*/

'use strict';

(function(){
    
window.PingPong = window.PingPong || {};

var camera, scene, controls;
var screenSize, tableSize, paddleSize, ballSize;
var paddle, paddleAI;
var paddleTrajectory = [];
var ball;
var STATES = {
    LOADING: 0,
    SERVING: 1,
    PLAYING: 2
}
var state = STATES.LOADING;
var input = {x:0, y: 0};
var inputPlane;
var projector = new THREE.Projector();

PingPong.GameScene = function(renderer, settings) {
    this.renderer = renderer;
    this.settings = settings;
    this.init();

    //THREE.utils.enableDebug(scene);
}

PingPong.GameScene.prototype = {
    
    init: function() {
        //create scene
    	scene = new THREE.Scene();
        screenSize = {width:this.renderer.domElement.width, height:this.renderer.domElement.height};
        screenSize = {width:window.innerWidth, height: window.innerHeight};
		//initialize camera
		camera = new THREE.PerspectiveCamera( 45, screenSize.width/screenSize.height, 0.5, 20);
		scene.add(camera);
		camera.position.set(0,this.settings.height/2,this.settings.depth/2);
		camera.lookAt(scene.position);
        
        //initialize audio
        PingPong.Audio.init(this.settings);
        
        //create physics
        this.simulation = new PingPong.Physics();
        
        //initialize world
        this.loadPlanes();
        this.loadLight();
        this.loadModels();
        this.initInput();

		//controls = new THREE.OrbitControls( camera, this.renderer.domElement );
    },
    
    loadPlanes: function() {
        var planes = this.settings.planes;
        for (var i = 0; i < planes.length; ++i) {
            var plane = planes[i];
            if (i > 0 || navigator.isCocoonJS) {
                var planeMaterial = new THREE.MeshBasicMaterial( { map: new THREE.ImageUtils.loadTexture(plane.texture),side: THREE.DoubleSide} ); 
            }
            else { //light on the floor (test)
                var planeMaterial = new THREE.MeshPhongMaterial( { map: new THREE.ImageUtils.loadTexture(plane.texture),ambient:0x333333, side: THREE.DoubleSide} ); 
            }
            planeMaterial.map.wrapS = THREE.RepeatWrapping; 
            planeMaterial.map.wrapT = THREE.RepeatWrapping; 
            var repeat = plane.repeat || [1,1];
            planeMaterial.map.repeat.set(repeat[0],repeat[1]);
            
            var planeGeometry = new THREE.PlaneGeometry(plane.size[0], plane.size[1], 10, 10);
            var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
            
            if (plane.rotation) {
                planeMesh.rotation.set(plane.rotation[0], plane.rotation[1], plane.rotation[2]);
            }
            if (plane.scale) {
                planeMesh.scale.set(plane.scale[0], plane.scale[1], plane.scale[2]);
            }
            if (plane.position) {
                planeMesh.position.set(plane.position[0], plane.position[1], plane.position[2]);
            }
            scene.add(planeMesh);
        }
    },
    
    loadLight: function() {

        if (navigator.isCocoonJS) {

            var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
            directionalLight.position.set( 0, 20, 20 );
            scene.add( directionalLight );
        }
        else {
            var light = new THREE.PointLight(0xffffff);
            light.position.set(0,2.5,2);
            scene.add(light);
            
            light = new THREE.SpotLight( 0xffffff, 0.8 );
                    light.position.set( 0, 2.0, 4.0 );
                    light.target.position.set( 0, 0, 0.2 );
                    light.target.updateMatrixWorld();
            scene.add(light);
        }
    },

    loadModels: function() {
        
        var me = this;
		var loader = new THREE.JSONLoader();
		loader.load(this.settings.table.model, onTableLoad );

		function onTableLoad( geometry, materials ) {
            //change the table color or texture
            var tableSettings = {ambient: 0x000000, specular: 0x777777 };
            if (me.settings.table.texture) {
                tableSettings.map = THREE.ImageUtils.loadTexture(me.settings.table.texture);
            }
            else {
                tableSettings.color = me.settings.table.color;
            }
			var m = new THREE.MeshPhongMaterial(tableSettings);
            if (m.map) {
                m.map.repeat.x = 0.1;
                m.map.repeat.y = 0.03;
                m.map.wrapS = THREE.RepeatWrapping;
                m.map.wrapT = THREE.RepeatWrapping;   
            }			
			materials[1] = m;

            //compute the model size
			var table = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
            geometry.computeBoundingBox();
            var boundingBox = geometry.boundingBox;
            var modelSize = {width: boundingBox.max.x - boundingBox.min.x, 
                             depth: boundingBox.max.z - boundingBox.min.z, 
                             height: boundingBox.max.y - boundingBox.min.y};
            
            //scale the table according to the aspect ratio and the defined size in settings
            var scale = me.settings.table.width / modelSize.width;
			table.scale.set(scale,scale,scale);
            tableSize = {width: modelSize.width * scale, depth: modelSize.depth * scale, height: modelSize.height * scale, scale: scale};
            
            //Simulation boxes
            var tw = tableSize.width * 0.91;
            var th = tableSize.height * 0.083;
            var ty = tableSize.height * 0.805;
            var tablebox = new THREE.Box3(new THREE.Vector3(0,0,0),new THREE.Vector3(1,1,1));
            tablebox.setFromCenterAndSize(new THREE.Vector3(0,ty,0), new THREE.Vector3(tw, th, tableSize.depth));
            me.simulation.addBox(tablebox);
            
            var wallMode = false;
            if (wallMode) {
                var netBox = new THREE.Box3();
                netBox.setFromCenterAndSize(new THREE.Vector3(0,tableSize.height,0), new THREE.Vector3(tableSize.width, tableSize.height, tableSize.depth * 0.1));
                me.simulation.addBox(netBox);
                
                var netHitCube = new THREE.Mesh(new THREE.CubeGeometry(netBox.max.x - netBox.min.x, netBox.max.y - netBox.min.y, netBox.max.z - netBox.min.z),
                                                       new THREE.MeshBasicMaterial({color:0x000000}))
                netHitCube.position.y = tableSize.height;
                netHitCube.visible = true;
                scene.add(netHitCube);
            }
            
            //Initial camera position according to the table size
            camera.position.set(0,tableSize.height * 1.7, tableSize.depth/2 * 2.3);
            var vector = new THREE.Vector3(0, tableSize.height, 0);
		    camera.lookAt(vector);
            
            //Initialize the inputPlane
            inputPlane = new THREE.Plane(new THREE.Vector3(0,-1,0), tableSize.height * 0.95);
            
            
            //setup table propeties and add it to the scene
			table.matrixAutoUpdate = false;
			table.updateMatrix();
			scene.add(table);
            
            //load paddles
            loader.load(me.settings.paddle.model, onPaddleLoad);
		}
        
        function onPaddleLoad(geometry, materials){
            //scale the paddles the same way as the table
            var scale = tableSize.scale;
            
            paddle = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
            paddle.scale.set(scale, scale, scale);
            paddle.position.set(0,tableSize.height, tableSize.depth/2);
            scene.add(paddle);
            

            var mat = new THREE.MeshFaceMaterial(materials, {side:THREE.DoubleSide});
            mat.side = THREE.DoubleSide;
            paddleAI = new THREE.Mesh( geometry, mat );
            paddleAI.scale.set(scale, scale, scale);
            paddleAI.position.set(0,tableSize.height, -tableSize.depth/2);
            scene.add(paddleAI);
            
            geometry.computeBoundingBox();
            var boundingBox = geometry.boundingBox;
            var modelSize = {width: boundingBox.max.x - boundingBox.min.x, 
                             depth: boundingBox.max.z - boundingBox.min.z, 
                             height: boundingBox.max.y - boundingBox.min.y};
            paddleSize = {width: modelSize.width * scale, depth: modelSize.depth * scale, height: modelSize.height * scale, scale: scale};
            
            
            var ballRadius = paddleSize.width * 0.13;
            var ballGeometry = new THREE.SphereGeometry(ballRadius,16,16);
            var ballMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, ambient: 0xcccccc} );
            ball = new THREE.Mesh( ballGeometry, ballMaterial );
            ball.position.set(0,tableSize.height * 2,tableSize.depth * 0.25);
            scene.add(ball);
            me.simulation.setBall(ball, ballRadius);
            
            me.ai = new PingPong.AI(me.simulation, tableSize, paddleAI, paddleSize, ball, ballRadius);
            
            state = STATES.SERVING;
        }
        
    },
    
    initInput: function() {
        
        var me = this;
        function inputHandler(ev) {
            if (ev.targetTouches && ev.targetTouches.length > 1) {
                me.serve();
                return;
            }
            var x = ev.targetTouches ? ev.targetTouches[0].clientX : ev.clientX;
            var y = ev.targetTouches ? ev.targetTouches[0].clientY : ev.clientY;
            me.processInput(x,y);
        }
        
        this.renderer.domElement.addEventListener("mousedown", function(){me.serve()});
        this.renderer.domElement.addEventListener("mousemove", inputHandler);
        this.renderer.domElement.addEventListener("touchstart", inputHandler);
        this.renderer.domElement.addEventListener("touchmove", inputHandler);
    },
    
    processInput: function(x,y) {
        input.x = x;
        input.y = y;
    },
    
    serve: function() {
        state = STATES.PLAYING;
        ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);
        
        var dir = new THREE.Vector3(0,-0.5,-1);
        this.simulation.hitBall(dir, 0.02);
        
    },
    toScreen: function(x, y, z) {
        var widthHalf = screenSize.width / 2; 
        var heightHalf = screenSize.height / 2;
        
        var projector = new THREE.Projector();
        var vector = projector.projectVector( new THREE.Vector3(x,y,z), camera );
        
        vector.x = ( vector.x * widthHalf ) + widthHalf;
        vector.y = - ( vector.y * heightHalf ) + heightHalf;
        return vector;
    },
    toWorld: function(x, y, zPlane) {
        var vector = new THREE.Vector3(
            (x / screenSize.width ) * 2 - 1,
            - (y / screenSize.height ) * 2 + 1,
            0.5 );
    
        projector.unprojectVector( vector, camera );
        var dir = vector.sub( camera.position ).normalize();
        zPlane = zPlane || 0;
        var distance = - (camera.position.z - zPlane) / dir.z;
        return camera.position.clone().add( dir.multiplyScalar( distance ) );
    },
    
    update: function() {
        if (state === STATES.LOADING) {
            return;
        }
        
        if (state === STATES.PLAYING) {
            this.ai.play();
            this.simulation.simulate();
        }
        
        //normalize input
        var px = (input.x / screenSize.width ) * 2 - 1;
        var py = - (input.y / screenSize.height ) * 2 + 1; 
        
        //set camera position
        var cx = tableSize.width * 0.5 * px;
        var cy = tableSize.height * 1.5;// + tableSize.height * 0.3 * py;
        var cz = tableSize.depth/2 * 3 * Math.abs(py);
        cz = Math.max(cz, tableSize.depth * 0.3);
        camera.position.set(cx,cy,cz);
        camera.lookAt(new THREE.Vector3(0, tableSize.height, 0));

        //camera.rotation.y = Math.PI * -0.05 * px;
        
        //Project input to table plane
        var maxpy = Math.min(0, py);
        var vector = new THREE.Vector3(px, maxpy, 0.5);
        projector.unprojectVector( vector, camera );
        var ray = new THREE.Ray( camera.position, vector.sub( camera.position ).normalize() );
        var intersect = ray.intersectPlane(inputPlane);
        
        if (!intersect) {
            intersect = paddle.position.clone();
        }
        intersect.z = Math.max(intersect.z, tableSize.depth * 0.05);
        
        //set paddle position  
        paddle.position.x = intersect.x;
        paddle.position.z = intersect.z;
        paddle.position.y = tableSize.height;
        

        
        if (state == STATES.SERVING) {
            ball.position.set(paddle.position.x, paddle.position.y + paddleSize.height, paddle.position.z);
        }
        else {
            this.checkBallHit();   
        }
        
        //set paddle rotation
        var dx = Math.min(1,Math.abs(paddle.position.x/(tableSize.width*0.6)));
        var dxAI = Math.min(1,Math.abs(paddleAI.position.x/(tableSize.width*0.6)));
        
        
        paddle.rotation.z = Math.PI * 0.5 * dx * (paddle.position.x > 0 ? -1.0 : 1.0);
        paddle.rotation.x = Math.PI * 0.2 * dx;
        paddle.rotation.y = Math.PI * 0.2 * dx * (paddle.position.x > 0 ? 1.0 : -1.0);
        
        paddleAI.rotation.z = Math.PI * 0.5 * dxAI * (paddleAI.position.x > 0 ? 1.0 : -1.0);
        paddleAI.rotation.x = -Math.PI * 0.2 * dxAI;
        paddleAI.rotation.y = Math.PI * 0.2 * dxAI * (paddleAI.position.x > 0 ? -1.0 : 1.0);
        paddleAI.rotation.y += Math.PI;        
        
    },
    
    checkBallHit: function() {
        var hitting = false;
        var hit = false;
        //check if paddle and ball are close
        if (this.simulation.getLinearVelocity().z > 0 && paddle.position.z > ball.position.z) {
            //store trayectory
            var trayectory = {
                time: Date.now(),
                x: paddle.position.x,
                y: paddle.position.y,
                z: paddle.position.z
            }
            paddleTrajectory.push(trayectory);
                            
            //check hit distances
            var zDistance = paddle.position.z - ball.position.z;
            var xDistance = Math.abs(paddle.position.x - ball.position.x); 
            var yDistance = paddle.position.y - ball.position.y;
            hit = zDistance < tableSize.depth * 0.03 && xDistance < paddleSize.width && Math.abs(yDistance) < paddleSize.height * 0.75;
            hitting = zDistance < tableSize.depth * 0.2 && xDistance < paddleSize.width;
        }
        
        //target paddle y position
        var targetY = tableSize.height;
        if (hitting) {
            targetY = ball.position.y;
        }
        var diffY = paddle.position.y - targetY; 
        paddle.position.y+= Math.min(Math.abs(diffY), paddleSize.height* 0.1) * (diffY ? -1 : 1);
        
        if (hit) {
            var trayectory = this.calculatePaddleTrajectory();
            trayectory.z = Math.min(trayectory.z, 0);
            
            var dir = new THREE.Vector3(0,0,0);
            //fixed z
            dir.z = -1.0;
            //trayector dependant x
            var tx = trayectory.x/ (tableSize.width * 0.1);
            dir.x = 0.6 * Math.min(Math.abs(tx),1.0) * (tx > 0 ? 1 : -1);
            //trayectory dependant force and y
            var tz = trayectory.z / (tableSize.depth * 0.25);
            tz = Math.min(Math.abs(tz),1);
            var force = 0.02 + tz * 0.01;

            dir.y = 0.4;
            if (ball.position.y < tableSize.height) {
                dir.y+= 0.1;
            }
            else {
                force*=1.1;
            }
            
            dir.y-= force * 2;
            if (paddle.position.z < tableSize.depth/2) {
                dir.y-= 0.1;   
            }

    
            this.simulation.hitBall(dir, force);
            paddleTrajectory.length = 0; //clear
        }
        
    },
    calculatePaddleTrajectory: function() {
        var now = Date.now();
        var trayectory = new THREE.Vector3(0,0,0);
        var prevT = null;
        for (var i = 0; i< paddleTrajectory.length; ++i) {
            var t = paddleTrajectory[i];
            if (now - t.time > 200) {
                continue; //we only check 200ms trayectory
            }
            if (!prevT) {
                prevT = t;
                continue;
            }
            trayectory.set(trayectory.x + t.x - prevT.x,
                          trayectory.y + t.y - prevT.y,
                          trayectory.z + t.z - prevT.z);
            prevT = t;
        }
        return trayectory;
        
    },
    
    render: function(){
        if (controls)
    	   controls.update();
        this.update();
        this.renderer.render(scene, camera);
    }
}
 
})();
