const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = Number(canvas.getAttribute("width"));
const canvasHeight = Number(canvas.getAttribute("height"));

console.log(canvasWidth);
console.log(canvasHeight);

function randInt(low, high) {
    return Math.floor(Math.random() * (1 + high - low)) + low;
}

function fillCircle(x, y, radius, fillColor, strokeColor, strokeWidth, arcLength) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, arcLength * 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
}

function fillPage(fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function fillRect(x, y, width, height, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
}

/* Anim Data Format: 
{
    "rects":[
        {
            "id":"player",
            "x":55,
            "y":80,
            "width":20,
            "height":20,
            "color":"black",
            "animation":"bounce",
            "xVel":5,
            "yVel":-5
        },
        {
            "id":"ground",
            "x":0,
            "y":520,
            "width":960,
            "height":20,
            "color":"green",
            "animation":"static",
            "xVel":0,
            "yVel":0,
            "color":"blue",
            "lineColor":"black",
            "lineWidth":0
        }
    ],
    "circles":[
        {
            "id":"ball",
            "x":55,
            "y":80,
            "radius":10,
            "length":1,
            "animation":"bounce",
            "xVel":5,
            "yVel":-5
        }
    ]
}
*/

let animData = {
    "rects": [
        {
            "id": "player",
            "x": 55,
            "y": 80,
            "width": 20,
            "height": 20,
            "color": "black",
            "animation": "bounce",
            "xVel": 5,
            "yVel": -5
        },
        {
            "id": "ground",
            "x": 0,
            "y": 520,
            "width": 960,
            "height": 20,
            "color": "green",
            "animation": "static",
            "xVel": 0,
            "yVel": 0
        }
    ],
    "circles": [
        {
            "id": "ball",
            "x": 55,
            "y": 80,
            "radius": 10,
            "length": 1,
            "animation": "bounce",
            "xVel": 5,
            "yVel": -5,
            "color": "blue",
            "lineColor": "black",
            "lineWidth": 0
        }
    ]
};

function getAnimById(shape, id) {
    if (shape == "circle") {
        for (let i = 0; i < animData.circles.length; i++) {
            if (animData.circles[i].id == id) {
                return animData.circles[i];
            }
        }
    }
    if (shape == "rect") {
        for (let i = 0; i < animData.rects.length; i++) {
            if (animData.rects[i].id == id) {
                return animData.rects[i];
            }
        }
    }
}

function animate() {
    fillPage("lightBlue");

    for (let i = 0; i < animData.rects.length; i++) {
        rect = animData.rects[i];
        fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
        // Different animation styles move in different ways
        if (rect.animation == "bounce") {
            if (rect.x >= canvasWidth - rect.width || rect.x <= 0) rect.xVel *= -1;
            if (rect.y >= canvasHeight - rect.height || rect.y <= 0) rect.yVel *= -1;
        }
        if (rect.animation != "static") {
            rect.x += rect.xVel;
            rect.y += rect.yVel;
        }
        // Changes to the rectangle have to be put back into the object for future use
        animData.rects[i] = rect;
    }

    // Rectangles and circles are drawn/stored seperately
    for (let i = 0; i < animData.circles.length; i++) {
        circle = animData.circles[i];
        fillCircle(circle.x, circle.y, circle.radius, circle.color, circle.lineColor, circle.lineWidth, circle.length)
        // Different animation styles move in different ways
        if (circle.animation == "bounce") {
            if (circle.x >= canvasWidth - circle.radius || circle.x <= circle.radius) circle.xVel *= -1;
            if (circle.y >= canvasHeight - circle.radius || circle.y <= circle.radius) circle.yVel *= -1;
        }
        if (circle.animation != "static") {
            circle.x += circle.xVel;
            circle.y += circle.yVel;
        }
        // Changes to the circle have to be put back into the object for future use
        animData.circles[i] = circle;
    }

    requestAnimationFrame(animate);
}

animate();

document.getElementById("circleButton").addEventListener("click", () => {
    circle = getAnimById("circle", "ball")
    
    circle.x = randInt(0, canvasWidth/Math.abs(circle.xVel)) * Math.abs(circle.xVel);
    circle.y = randInt(0, canvasHeight/Math.abs(circle.yVel)) * Math.abs(circle.yVel);
});

document.getElementById("squareButton").addEventListener("click", () => {
    rect = getAnimById("rect", "player")
    
    rect.x = randInt(0, canvasWidth/Math.abs(rect.xVel)) * Math.abs(rect.xVel);
    rect.y = randInt(0, canvasHeight/Math.abs(rect.yVel)) * Math.abs(rect.yVel);
});