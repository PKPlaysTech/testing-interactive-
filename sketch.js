let elements = [];
let fireflies = [];
let currentMode = "flower";
let myFont;
let wasPinching = false;
let imgStar, imgButterfly, imgRose;
let clearTextAlpha = 0;
let capture; 

let smoothX = 0, smoothY = 0;
let smoothThumbX = 0, smoothThumbY = 0;

function preload() {
    myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Bold.otf');
    imgStar = loadImage('Star.png');
    imgButterfly = loadImage('Butterfly.png');
    imgRose = loadImage('rose.png');
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.id("defaultCanvas0"); 
    
    // 强制获取并播放底层视频
    let rawVideo = document.getElementById('input-video');
    capture = select('#input-video'); 
    if(rawVideo) rawVideo.play(); 
    
    for(let i=0; i<15; i++) {
        createFirefly(random(width), random(height));
    }
}

function originalDraw() {
    // 1. 背景视频层 - 修复黑屏关键
    push();
    translate(0, 0, -850);
    scale(-4.2, 4.2);
    imageMode(CENTER);
    // 调亮背景，防止太暗看不见
    tint(255, 255, 255, 120); 
    
    // 使用 .elt 渲染原始视频流
    if (capture && capture.elt) {
        image(capture.elt, 0, 0);
    }
    pop();

    drawAndIdentifyFireflies();

    for (let i = 0; i < elements.length; i++) {
        let el = elements[i];
        let prevEl = (i > 0) ? elements[i-1] : null;

        if (el.type === "flower") drawFlower(el);
        else if (el.type === "roseFlower") drawRose(el);
        else if (el.type === "roseStem") drawRoseStem(el, prevEl);
        else if (el.type === "vine") drawVine(el, prevEl);
        else if (el.type === "grass") drawMagicGrass(el);
        else if (el.type === "star") drawStar(el);
        else if (el.type === "butterfly") drawButterfly(el);
    }

    drawClearFeedback();
    
    // 自动性能清理
    if (elements.length > 500) elements.splice(0, elements.length - 500);

    handleInput();
}

function handleInput() {
    if (window.handData && window.handData.length > 0) {
        let hand = window.handData[0];
        smoothX = lerp(smoothX, (1 - hand[8].x) * width, 0.3);
        smoothY = lerp(smoothY, hand[8].y * height, 0.3);
        smoothThumbX = lerp(smoothThumbX, (1 - hand[4].x) * width, 0.3);
        smoothThumbY = lerp(smoothThumbY, hand[4].y * height, 0.3);

        // 五指张开清屏
        let d1 = dist(hand[8].x, hand[8].y, hand[0].x, hand[0].y);
        let d2 = dist(hand[12].x, hand[12].y, hand[0].x, hand[0].y);
        let d3 = dist(hand[16].x, hand[16].y, hand[0].x, hand[0].y);
        let d4 = dist(hand[20].x, hand[20].y, hand[0].x, hand[0].y);
        if (d1 > 0.45 && d2 > 0.45 && d3 > 0.45 && d4 > 0.45) {
            if (elements.length > 50) clearCanvas();
            return;
        }

        let isPinching = dist(smoothX, smoothY, smoothThumbX, smoothThumbY) < 75;

        if (isPinching) {
            if (currentMode === "rose" && frameCount % 3 === 0) createNew(smoothX, smoothY, "roseStem");
            else if (currentMode === "vine" && frameCount % 2 === 0) createNew(smoothX, smoothY, "vine");
            else if (currentMode === "firefly" && frameCount % 10 === 0) createFirefly(smoothX, smoothY);
            else if (currentMode === "butterfly" && frameCount % 30 === 0) createNew(smoothX, smoothY, "butterfly");
            else if (["grass", "star"].includes(currentMode) && frameCount % 4 === 0) {
                createNew(smoothX, smoothY, currentMode);
            }
        }

        if (wasPinching && !isPinching) {
            if (currentMode === "flower") createNew(smoothX, smoothY, "flower");
            else if (currentMode === "rose") createNew(smoothX, smoothY, "roseFlower");
        }
        wasPinching = isPinching;
    }
}

// ... 辅助函数（createNew, drawFlower等保持你原有的逻辑） ...
function createNew(x, y, type) {
    let colors = [], leafData = [], targetSize = 0;
    if (type === "flower") {
        targetSize = random(40, 80);
        let h = random(360);
        colorMode(HSB, 360, 100, 100, 1);
        colors = [color(h, 70, 100, 0.7), color((h+40)%360, 60, 100, 0.8)];
        colorMode(RGB, 255, 255, 255, 255);
    } else if (type === "roseFlower") {
        targetSize = random(70, 110);
    } else if (type === "roseStem") {
        targetSize = random(15, 25);
        if (random() > 0.7) leafData.push({ side: random() > 0.5 ? 1 : -1, size: random(25, 45), angle: random(-0.2, 0.2) });
    } else if (type === "vine") {
        targetSize = 20;
        if (random() > 0.4) leafData.push({ side: random() > 0.5 ? 1 : -1, size: random(45, 85), angle: random(-0.3, 0.3), c: color(random(0,100), 255, random(100,200), 190) });
    } else if (type === "grass") {
        targetSize = random(90, 140);
        colors = color(random(0,100), 255, random(100,200), 180);
    } else {
        targetSize = random(25, 40);
    }
    elements.push({ x: x, y: y, type: type, size: 0, maxSize: targetSize, offset: random(1000), colors: colors, leaf: leafData });
}

function drawFlower(el) {
    if (el.size < el.maxSize) el.size += 2.5;
    push(); translate(el.x - width/2, el.y - height/2, 2); noStroke();
    for (let l = 0; l < 2; l++) {
        fill(el.colors[l].levels[0], el.colors[l].levels[1], el.colors[l].levels[2], 200);
        let lSize = el.size * (1 - l * 0.23);
        for (let i = 0; i < 6; i++) { rotate(PI/3); ellipse(0, lSize/2, lSize/1.7, lSize); }
    }
    pop();
}

function drawRose(el) {
    if (el.size < el.maxSize) el.size += 3.5;
    push(); translate(el.x - width/2, el.y - height/2, 5);
    imageMode(CENTER); tint(255, 230); image(imgRose, 0, 0, el.size, el.size);
    pop();
}

function drawRoseStem(el, prevEl) {
    if (prevEl && prevEl.type === "roseStem" && dist(el.x, el.y, prevEl.x, prevEl.y) < 60) {
        push(); stroke(34, 139, 34, 200); strokeWeight(5);
        line(prevEl.x - width/2, prevEl.y - height/2, -1, el.x - width/2, el.y - height/2, -1);
        if (el.leaf.length > 0) {
            for (let l of el.leaf) {
                push(); translate(el.x - width/2, el.y - height/2, 0);
                rotate(l.side * PI/2.5 + l.angle); noStroke(); fill(46, 139, 87, 220);
                ellipse(0, -l.size/2, l.size/2, l.size); pop();
            }
        }
        pop();
    }
}

function drawVine(el, prevEl) {
    if (prevEl && prevEl.type === "vine" && dist(el.x, el.y, prevEl.x, prevEl.y) < 95) {
        push(); stroke(0, 255, 200, 200); strokeWeight(5.5);
        line(prevEl.x - width/2, prevEl.y - height/2, 0, el.x - width/2, el.y - height/2, 0);
        if (el.leaf.length > 0) {
            for (let l of el.leaf) {
                push(); translate(el.x - width/2, el.y - height/2, 1); rotate(l.side * PI/3 + l.angle);
                noStroke(); fill(l.c); beginShape(); vertex(0, 0);
                bezierVertex(l.size/3, -l.size/3, l.size/3, -l.size/1.5, 0, -l.size);
                bezierVertex(-l.size/3, -l.size/1.5, -l.size/3, -l.size/3, 0, 0);
                endShape(CLOSE); pop();
            }
        }
        pop();
    }
}

function drawMagicGrass(el) {
    if (el.size < el.maxSize) el.size += 3.5;
    push(); translate(el.x - width/2, el.y - height/2, 0);
    fill(el.colors); noStroke(); beginShape(); 
    vertex(-15, 0); vertex(15, 0);
    bezierVertex(10, -el.size*0.4, 0, -el.size*0.8, 0, -el.size); 
    endShape(CLOSE); pop();
}

function drawStar(el) {
    if (el.size < el.maxSize) el.size += 0.8;
    push(); translate(el.x - width/2, el.y - height/2, 1);
    imageMode(CENTER); image(imgStar, 0, 0, el.size, el.size); pop();
}

function drawButterfly(el) {
    if (el.size < el.maxSize) el.size += 0.5;
    el.y -= 1.6; el.x += sin(frameCount * 0.05 + el.offset) * 3.5;
    push(); translate(el.x - width/2, el.y - height/2, 10);
    scale(sin(frameCount * 0.2 + el.offset), 1);
    imageMode(CENTER); image(imgButterfly, 0, 0, el.size, el.size); pop();
}

function createFirefly(x, y) {
    fireflies.push({ x: x, y: y, vx: random(-0.8, 0.8), vy: random(-0.8, 0.8), size: random(6, 12), offset: random(1000) });
}

function drawAndIdentifyFireflies() {
    push(); translate(-width / 2, -height / 2, 50);
    for (let f of fireflies) {
        f.x += f.vx; f.y += f.vy; 
        if(f.x<0 || f.x>width) f.vx*=-1; 
        if(f.y<0 || f.y>height) f.vy*=-1;
        fill(200, 255, 100, 210); noStroke(); circle(f.x, f.y, f.size);
    }
    pop();
}

function drawClearFeedback() {
    if (clearTextAlpha > 0) {
        push(); fill(255, 255, 255, clearTextAlpha); textAlign(CENTER); textFont(myFont); textSize(80);
        text("✨ MAGIC RESET ✨", 0, 0); clearTextAlpha -= 5; pop();
    }
}

function setMode(mode) {
    currentMode = mode;
    let btns = document.getElementsByClassName('menu-btn');
    for(let btn of btns) btn.classList.remove('active');
    let target = document.getElementById('btn-' + mode);
    if(target) target.classList.add('active');
}

function clearCanvas() { elements = []; fireflies = []; clearTextAlpha = 255; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }
