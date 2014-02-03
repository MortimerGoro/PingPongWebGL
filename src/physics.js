/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 MortimerGoro
*/

'use strict';

(function(){
    
window.PingPong = window.PingPong || {};
    
var linearVelocity = new THREE.Vector3(0,0,0);
var angularVelocity = new THREE.Vector3(0,0,0);
var ballRadius = 0;
var gravity = -4.8;
var prevGravity = 0;
var gravityTime = 0;
var restitution = 0.75;
var ballBoundingBox = new THREE.Box3();
    
PingPong.Physics = function() {
    this.ball = null;
    this.boxes=[];
}

PingPong.Physics.prototype = {
    
    addBox: function(box){
        this.boxes.push(box);        
    },
    
    setBall: function(ball, radius) {
        this.ball = ball;  
        ballRadius = radius;
    },
    
    getLinearVelocity: function() {
        return linearVelocity;  
    },
    
    hitBall: function(dir, force) {
        linearVelocity.set(dir.x, dir.y, dir.z);
        linearVelocity.multiplyScalar(force);
        prevGravity = 0;
        gravityTime = 0;
        PingPong.Audio.playPaddleSound();
    },
    
    simulate: function(step) {
        step = step || 1/60;
        
        
        gravityTime+= step;
        var currentGravity = 0.1 * gravity * gravityTime * gravityTime;
        var vg = currentGravity - prevGravity;
        prevGravity = currentGravity;
        
        var ball = this.ball;
        
        ball.position.x += linearVelocity.x;
        ball.position.y += linearVelocity.y + vg;
        ball.position.z += linearVelocity.z;
        
        ballBoundingBox.setFromCenterAndSize(ball.position, new THREE.Vector3(ballRadius,ballRadius,ballRadius));
        
        for (var i = 0; i < this.boxes.length; ++i) {
            var box = this.boxes[i];
            if (this.isSphereIntersectingBox(box, ball.position, ballRadius)) {
                this.collideBall(ball, box, vg);
            }
        }
    
    },
    
    isSphereIntersectingBox: function(box, sphere, radius) {
        var min = box.min;
        var max = box.max;
        var dmin = radius * radius;
        if (sphere.x < min.x) dmin -= Math.pow(sphere.x - min.x, 2);
        else if (sphere.x > max.x) dmin -= Math.pow(sphere.y - max.x, 2);
        if (sphere.y < min.y) dmin -= Math.pow(sphere.y - min.y, 2);
        else if (sphere.y > max.y) dmin -= Math.pow(sphere.y - max.y, 2);
        if (sphere.z < min.z) dmin -= Math.pow(sphere.z - min.z, 2);
        else if (sphere.z > max.z) dmin -= Math.pow(sphere.z - max.z, 2);
        return dmin > 0;
    },
    
    collideBall: function(ball, box, g){
        
        var plane = new THREE.Plane();
        function sphereInterserctsPlane(nx, ny, nz, w, sphere, radius) {
            plane.setComponents(nx,ny,nz,w);
            return plane.distanceToPoint(sphere) <= radius;
        }
        
        var top = sphereInterserctsPlane(0, -1, 0, box.max.y, ball.position, ballRadius);
        var front = sphereInterserctsPlane(0, 0, -1, box.max.z, ball.position, ballRadius);
        //TODO: check remaining planes and handle edge collisions.

                
        if (top) {
            ball.position.y = box.max.y + ballRadius;  
            linearVelocity.y = -restitution * (linearVelocity.y + g);
            gravityTime = 0;
            prevGravity = 0;
        }
        if (front) {
            ball.position.z = box.max.z + ballRadius;  
            linearVelocity.z*= -restitution;
        }
        
        //TODO: Angular velocity

        
        if (Math.abs(linearVelocity.y) > 0.001){
            PingPong.Audio.playBallSound();            
        }
            
    }
 
}
    
})();