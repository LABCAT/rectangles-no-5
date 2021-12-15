import React, { useRef, useEffect } from "react";
import "./helpers/Globals";
import "p5/lib/addons/p5.sound";
import * as p5 from "p5";
import { Midi } from '@tonejs/midi'
import PlayIcon from './functions/PlayIcon.js';

import audio from "../audio/circles-no-3.ogg";
import midi from "../audio/circles-no-3.mid";

const P5SketchWithAudio = () => {
    const sketchRef = useRef();

    const Sketch = p => {

        p.canvas = null;

        p.canvasWidth = window.innerWidth;

        p.canvasHeight = window.innerHeight;

        p.audioLoaded = false;

        p.player = null;

        p.PPQ = 3840 * 4;

        p.loadMidi = () => {
            Midi.fromUrl(midi).then(
                function(result) {
                    const noteSet1 = result.tracks[5].notes; // Synth 1
                    p.scheduleCueSet(noteSet1, 'executeCueSet1');
                    p.audioLoaded = true;
                    document.getElementById("loader").classList.add("loading--complete");
                    //document.getElementById("play-icon").classList.remove("fade-out");
                }
            );
            
        }

        p.preload = () => {
            p.song = p.loadSound(audio, p.loadMidi);
            p.song.onended(p.logCredits);
        }

        p.scheduleCueSet = (noteSet, callbackName, poly = false)  => {
            let lastTicks = -1,
                currentCue = 1;
            for (let i = 0; i < noteSet.length; i++) {
                const note = noteSet[i],
                    { ticks, time } = note;
                if(ticks !== lastTicks || poly){
                    note.currentCue = currentCue;
                    p.song.addCue(time, p[callbackName], note);
                    lastTicks = ticks;
                    currentCue++;
                }
            }
        } 

        p.cellSize = 0;

        p.cells = [];

        p.cellW = 20;
        p.cellH = 20;
        p.nbCellW = 0;
        p.nbCellH = 0;

        p.setup = () => {
            p.canvas = p.createCanvas(p.canvasWidth, p.canvasHeight);
            p.background(0);

            // p.rectMode(p.CENTER);
            p.colorMode(p.HSB, 1);
            
            p.nbCellW = Math.floor(p.width / p.cellW);
            p.nbCellH = Math.floor(p.height / p.cellH);
            
            // for (var i = 0; i <  p.nbCellW * p.nbCellH; i ++) {
            //     p.cells.push(p.createVector(0, 0));
            // }

            for (var i = 0; i < p.nbCellW; i ++) {
                for (var j = 0; j < p.nbCellH; j ++) {
                    const x =  p.cellW * i,
                        y =  p.cellH * j,
                        key = x + '-' + y;
                    p.cells.push(
                        {
                            key: key,
                            x: x,
                            y: y,
                            hue: 0,
                            brightness: 0,
                        }
                    );
                }
            }
        }

        p.draw = () => {
            if(p.audioLoaded && p.song.isPlaying()){

            }

            // var deltaMouse = p.createVector(p.mouseX - p.pmouseX, p.mouseY - p.pmouseY);
            
            // for (var i = 0; i < p.nbCellW; i ++) {
            //     for (var j = 0; j < p.nbCellH; j ++) {
            //         var k = i + j * p.nbCellW;
            //         var x =  p.cellW * i + p.cellW/2;
            //         var y =  p.cellH * j + p.cellH/2;
            //         var d = Math.max(1, p.dist(p.mouseX, p.mouseY, x, y));
                    
            //         deltaMouse.normalize();
            //         deltaMouse.mult(1/(d*30));
            //         p.cells[k].add(deltaMouse);
            //         p.cells[k].limit(10);
                    
            //         var h = p.map(p.cells[k].heading(), -p.PI, p.PI, 0, 1);
            //         var b = p.min(p.cells[k].mag()*100, 10);
            //         p.fill(h, 1, b);
                    
            //         p.rect(x, y, p.cellW, p.cellH);
                    
            //         p.cells[k].mult(.98);
            //     }
            // }
            p.cells.forEach(cell => {
                const { x, y, hue, brightness } = cell;
                p.fill(hue, 1, brightness);
                p.rect(x, y, p.cellW, p.cellH);
            });
        }

        p.executeCueSet1 = (note) => {
            // p.background(p.random(255), p.random(255), p.random(255));
            // p.fill(p.random(255), p.random(255), p.random(255));
            // p.noStroke();
            // p.ellipse(p.width / 2, p.height / 2, p.width / 4, p.width / 4);
            let x = 0, y = 0, h = 0.1, b = 0.1;
            let loop = true;
            while (loop) {
                const key = x + '-' + y,
                    cell = p.cells.find(cell => cell.key === key);
                cell.hue = h;
                cell.brightness = b;
                h = h + 0.05;
                b = b + 0.05;
                x = x +  p.cellW;
                y = y +  p.cellH;
                if(x > p.width|| y > p.height) {
                    loop = false;
                }
            }
        }

        p.mousePressed = () => {
            if(p.audioLoaded){
                if (p.song.isPlaying()) {
                    p.song.pause();
                } else {
                    if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                        p.reset();
                    }
                    //document.getElementById("play-icon").classList.add("fade-out");
                    p.song.play();
                }
            }
        }

        p.creditsLogged = false;

        p.logCredits = () => {
            if (
                !p.creditsLogged &&
                parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)
            ) {
                p.creditsLogged = true;
                    console.log(
                    "Music By: http://labcat.nz/",
                    "\n",
                    "Animation By: https://github.com/LABCAT/",
                    "\n",
                    "Coding Inspiration: https://openprocessing.org/sketch/849430"
                );
                p.song.stop();
            }
        };

        p.reset = () => {

        }

        p.updateCanvasDimensions = () => {
            p.canvasWidth = window.innerWidth;
            p.canvasHeight = window.innerHeight;
            p.canvas = p.resizeCanvas(p.canvasWidth, p.canvasHeight);
        }

        if (window.attachEvent) {
            window.attachEvent(
                'onresize',
                function () {
                    p.updateCanvasDimensions();
                }
            );
        }
        else if (window.addEventListener) {
            window.addEventListener(
                'resize',
                function () {
                    p.updateCanvasDimensions();
                },
                true
            );
        }
        else {
            //The browser does not support Javascript event binding
        }
    };

    useEffect(() => {
        new p5(Sketch, sketchRef.current);
    }, []);

    return (
        <div ref={sketchRef}>
        </div>
    );
};

export default P5SketchWithAudio;
