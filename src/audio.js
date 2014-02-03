/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 MortimerGoro
*/

'use strict';

(function(){
    
window.PingPong = window.PingPong || {};
    
PingPong.AudioManager = function() {
    this.paddleSounds = [];
    this.ballSounds = [];
}

PingPong.AudioManager.prototype = {
    init: function(settings) {
        
        var paddle = settings.audio.paddle || [];
        var ball = settings.audio.ball || [];
        //load paddle sounds
        for (var i = 0; i < paddle.length; ++i) {
            var audio = new Audio();
            audio.src = paddle[i];
            audio.load();
            this.paddleSounds.push(audio);
        }
        //load ball sounds
        for (var i = 0; i < paddle.length; ++i) {
            var audio = new Audio();
            audio.src = paddle[i];
            audio.load();
            this.ballSounds.push(audio);
        }
        
    },
    
    playBallSound: function(volume) {
        if (!this.ballSounds.length) {
            return;
        }
        
        var rnd = Math.floor(Math.random() * this.ballSounds.length);
        this.ballSounds[rnd].volume = volume || 0.5;
        this.ballSounds[rnd].play();
    },
    
    playPaddleSound: function(volume) {
        if (!this.paddleSounds.length) {
            return;
        }
        
        var rnd = Math.floor(Math.random() * this.paddleSounds.length);
        this.paddleSounds[rnd].volume = volume || 0.5;
        this.paddleSounds[rnd].play(); 
    }
}
    
PingPong.Audio = new PingPong.AudioManager();
    
})();