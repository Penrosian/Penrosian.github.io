const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = Number(canvas.getAttribute("width"));
const canvasHeight = Number(canvas.getAttribute("height"));

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

// Storing in an object instead of in a bunch of variables is
// cleaner and means I can add more shapes using code
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

let pressed = [];

function getAnimById(shape, id) {
    if (shape == "circle") {
        for (let i = 0; i < animData.circles.length; i++) {
            if (animData.circles[i].id == id) {
                return animData.circles[i];
            }
        }
    } else if (shape == "rect") {
        for (let i = 0; i < animData.rects.length; i++) {
            if (animData.rects[i].id == id) {
                return animData.rects[i];
            }
        }
    } else return false;
}

function animate() {
    fillPage("lightBlue");

    for (let i = 0; i < animData.rects.length; i++) {
        rect = animData.rects[i];
        fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
        // Different animation styles move in different ways
        // If you held both directions you could shimmy through the wall,
        // moving the player out of the wall fixes that
        if (rect.animation == "bounce") {
            if (rect.x + rect.width > canvasWidth) {
                rect.xVel *= -1;
                rect.x = canvasWidth - rect.width;
            }
            if (rect.x < 0) {
                rect.xVel *= -1;
                rect.x = 0;
            }
            if (rect.y + rect.height > canvasHeight) {
                rect.yVel *= -1;
                rect.y = canvasHeight - rect.height;
            }
            if (rect.y < 0) {
                rect.yVel *= -1;
                rect.y = 0;
            }
        }
        if (rect.animation != "static") {
            rect.x += rect.xVel;
            rect.y += rect.yVel;
        }
    }

    // Rectangles and circles are drawn/stored seperately
    for (let i = 0; i < animData.circles.length; i++) {
        circle = animData.circles[i];
        fillCircle(circle.x, circle.y, circle.radius, circle.color, circle.lineColor, circle.lineWidth, circle.length)
        // Different animation styles move in different ways
        // Same collision is applied here, just in case
        if (circle.animation == "bounce") {
            if (circle.x + circle.radius > canvasWidth) {
                circle.xVel *= -1;
                circle.x = canvasWidth - circle.radius;
            }
            if (circle.x - circle.radius < 0) {
                circle.xVel *= -1;
                circle.x = 0 + circle.radius;
            }
            if (circle.y + circle.radius > canvasHeight) {
                circle.yVel *= -1;
                circle.y = canvasHeight - circle.radius;
            }
            if (circle.y - circle.radius < 0) {
                circle.yVel *= -1;
                circle.y = 0 + circle.radius;
            }
        }
        if (circle.animation != "static") {
            circle.x += circle.xVel;
            circle.y += circle.yVel;
        }
    }

    // Custom/Advanced rules
    player = getAnimById("rect", "player");
    ground = getAnimById("rect", "ground");

    // Custom ground collision
    // Feeling cute, might make the ball collide here too later
    if (player.y + player.height >= ground.y) {
        player.y = ground.y - player.height;
        if (player.yVel < 0) player.yVel = 0;
    }

    if (pressed.includes("KeyA")) player.xVel -= 2;
    if (pressed.includes("KeyD")) player.xVel += 2;
    if (pressed.includes("Space") && player.y + player.height >= ground.y) player.yVel = -5;

    player.xVel *= 0.8
    if (player.yVel < 10) {
        player.yVel += 0.2
    }

    requestAnimationFrame(animate);
}

animate();

// Keys need to be tracked in a list to allow for key holding
// and so that multiple keys can be pressed at once
document.addEventListener("keydown", function(event) {
    event.preventDefault();
    pressed.push(event.code);
});
document.addEventListener("keyup", function(event) {
    event.preventDefault();
    pressed = pressed.filter(i => i !== event.code);
});

