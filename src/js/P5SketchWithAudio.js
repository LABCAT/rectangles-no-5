import React, { useRef, useEffect } from "react";
import rough from "../../node_modules/roughjs/bundled/rough.cjs.js";
import "./helpers/Globals";
import "p5/lib/addons/p5.sound";
import * as p5 from "p5";
import { Midi } from '@tonejs/midi'
import PlayIcon from './functions/PlayIcon.js';

import audio from "../audio/rectangles-no-5.ogg";
import midi from "../audio/rectangles-no-5.mid";

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
                    const noteSet1 = result.tracks[1].notes; // Sampler 2 - W-80's Synth
                    p.scheduleCueSet(noteSet1, 'executeCueSet1');
                    p.audioLoaded = true;
                    document.getElementById("loader").classList.add("loading--complete");
                    document.getElementById("play-icon").classList.remove("fade-out");
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

        p.setup = () => {
            p.canvas = p.createCanvas(p.canvasWidth, p.canvasHeight);
            p.rc = rough.canvas(document.getElementById('defaultCanvas0'));
            p.noLoop();
            p.colorMode(p.HSB);
            p.rectMode(p.CENTER);
        }

        p.draw = () => {
            if(p.audioLoaded && p.song.isPlaying()){

            }
        }

        p.rects = [];


        p.executeCueSet1 = (note) => {
            const { duration, currentCue } = note,
                delayMultiplier = duration > 1 ? 0.8 : 0.6,
                heightDivisor =  duration < 1 ? p.random(4, 12) : p.random([16, 24, 36]),
                height = p.height / heightDivisor,
                fillStyle = heightDivisor > 12 
                    ? (Math.random() > 0.15 ? p.random(['hachure', 'cross-hatch']) : 'solid')
                    : p.random(['zigzag', 'cross-hatch', 'sunburst', 'dashed', 'zigzag-line']),
                colourScheme = fillStyle === 'solid' 
                    ? 'tetradic'
                    : p.random(['random', 'tetradic', 'rainbow']);
            
            p.clear();
            p.rects = [];

            let x = p.random(-height / 2, 0);
            let y = p.random(-height / 2, 0);
            let count = 0;
            while(y < p.height) {
                while (x < p.width) {
                    let width = p.random(height * 1.5, height * 2),
                        colour = '';
                    if(colourScheme === 'random') {
                        colour = p.color(
                            p.random(0, 360),
                            p.random(50, 100),
                            p.random(50, 100)
                        );
                    } 
                    else if(colourScheme === 'tetradic') {
                        colour = p.color(
                            count % 4 * 90,
                            75, 
                            75
                        );
                    } 
                    else {
                        colour = p.color(
                            count % 6 * 60,
                            p.random(25, 100),
                            p.random(25, 100)
                        );
                    }
                    
                    p.rects.push(
                        {
                            x: x, 
                            y: y, 
                            width: width * 0.9, 
                            height: height * 0.9,
                            colour: colour.toString(),
                            fillStyle: fillStyle
                        }
                    );
                    count++;
                    x = x + width;
                }
                x = p.random(-height/2, 0);
                y = y + height;
            }

            p.rects = p.shuffle(p.rects);
            const delay = (duration * 1000 / p.rects.length) * delayMultiplier;
            for (let i = 0; i < p.rects.length; i++) {
                const rect = p.rects[i],
                    { x, y, width, height, colour, fillStyle } = rect;
                setTimeout(
                    function () {
                        p.rc.rectangle(
                            x, 
                            y, 
                            width, 
                            height,
                            { 
                                roughness: p.random(1, 2.5),
                                fill: colour,
                                fillStyle: fillStyle
                            }
                        );
                    },
                    (delay * i)
                );
            }

            if(currentCue > 60) {
                const overlay = p.rects.find(p.centralRect),
                    fillColour = p.color(overlay.colour),
                    fillHue = fillColour._getHue(),
                    strokeHue = fillHue + 180 > 360 ? fillHue - 180 : fillHue + 180,
                    strokeColour = p.color(strokeHue, fillColour._getSaturation(), fillColour._getBrightness()),
                    strokeSize = (currentCue % 20) ? p.width / (22 - (currentCue % 20)) : p.width / 2;

                p.strokeWeight(strokeSize);
                p.stroke(strokeColour);
                p.fill(fillColour);
                
                p.rect(
                    p.width / 2, 
                    p.height / 2, 
                    p.width, 
                    p.height,
                );          
            }
        }

        p.centralRect = (rect) => {
            const midX = p.width / 2,
                midY = p.height / 2,
                divisor = 4;

            return rect.x < midX + midX / divisor 
                && rect.x > midX - midX / divisor
                && rect.y < midY + midY / divisor
                && rect.y > midY - midY / divisor; 
        }

        p.hasStarted = false;

        p.mousePressed = () => {
            if(p.audioLoaded){
                if (p.song.isPlaying()) {
                    p.song.pause();
                } else {
                    if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                        p.reset();
                        if (typeof window.dataLayer !== typeof undefined){
                            window.dataLayer.push(
                                { 
                                    'event': 'play-animation',
                                    'animation': {
                                        'title': document.title,
                                        'location': window.location.href,
                                        'action': 'replaying'
                                    }
                                }
                            );
                        }
                    }
                    document.getElementById("play-icon").classList.add("fade-out");
                    p.canvas.addClass("fade-in");
                    p.song.play();
                    if (typeof window.dataLayer !== typeof undefined && !p.hasStarted){
                        window.dataLayer.push(
                            { 
                                'event': 'play-animation',
                                'animation': {
                                    'title': document.title,
                                    'location': window.location.href,
                                    'action': 'start playing'
                                }
                            }
                        );
                        p.hasStarted = false
                    }
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
                    "Animation By: https://github.com/LABCAT/"
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
            <PlayIcon />
        </div>
    );
};

export default P5SketchWithAudio;
