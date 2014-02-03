/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 Imanol Fernandez @MortimerGoro
*/

'use strict';

(function(){
    
window.PingPong = window.PingPong || {};
    
var targetPos = new THREE.Vector3(0,0,0);
    
PingPong.AI = function(simulation, tableSize, paddle, paddleSize, ball, ballRadius) {
    this.simulation = simulation;
    this.tableSize = tableSize;
    this.paddle = paddle;
    this.paddleSize = paddleSize;
    this.ball = ball;
    this.ballRadius = ballRadius;
    this.speed = 0.5;
    this.force = 0.5;
}

PingPong.AI.prototype = {
    
    setSpeed: function(speed){
        this.speed = speed;  
    },
    
    setForce: function(force) {
        this.force = force;
    },
    
    play: function() {
        var myPos = this.paddle.position;
        var ballPos = this.ball.position
        var paddleSize = this.paddleSize;
        var tableSize = this.tableSize;
        
        if (this.simulation.getLinearVelocity().z > 0){
            //ball going against opponent
            targetPos.set(0, tableSize.height, -tableSize.depth * 0.5);
        }
        else {
            targetPos.set(ballPos.x, tableSize.height, -tableSize.depth * 0.5);   
            
            var hitting = false;
            var hit = false;
            
            var zDistance = Math.abs(myPos.z - ballPos.z);
            var xDistance = Math.abs(myPos.x - ballPos.x); 
            var yDistance = myPos.y - ballPos.y;
            hit = zDistance < tableSize.depth * 0.05 && xDistance < paddleSize.width && Math.abs(yDistance) < paddleSize.height *0.75;
            hitting = zDistance < tableSize.depth * 0.2 && xDistance < paddleSize.width;
            
            if (hitting) {
                targetPos.y = ballPos.y;   
            }
            
            if (hit) {
                var dir = new THREE.Vector3(0,0,0);
                //fixed z
                dir.z = 1.0;  
                //random y
                dir.y = 0.2 + Math.random() * 0.25;
                //random x
                var rx = Math.random() * tableSize.width/2;
                rx*= Math.random() > 0.5 ? 1 : -1;
                var dirAngle = Math.atan2(-tableSize.depth + ballPos.z, rx - myPos.x);
                dir.x = Math.cos(dirAngle);
                dir.x = Math.min(Math.abs(dir.x),0.5) * (dir.x > 0? 1 : -1);
                //random force
                var hitForce = 0.02 + this.force * 0.02 * Math.random();
                
                
                this.simulation.hitBall(dir, 0.025);
            }
        }
        
        var diffY = myPos.y - Math.max(targetPos.y, tableSize.height * 0.8); 
        //myPos.y+= Math.min(Math.abs(diffY), paddleSize.height* 0.1) * (diffY ? -1 : 1);
        
        var diffX = Math.abs(targetPos.x - myPos.x);
        var speedX = tableSize.width* 0.05 * this.speed;
        myPos.x+= Math.min(diffX, speedX) * (myPos.x > targetPos.x ? -1 : 1);
    }
}
    
})();