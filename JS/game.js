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

// Storing in an object instead of in a bunch of variables is
// cleaner and means I can add more shapes using code
const animData = {
    "rects": [
        {
            "id": "player",
            "class": null,
            "x": 55,
            "y": 80,
            "width": 20,
            "height": 20,
            "color": "black",
            "animation": "locked",
            "xVel": 5,
            "yVel": -5
        },
        {
            "id": "ground",
            "class": null,
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
            "class": "ball",
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
let cooldown = 0;
let fireMode = "single";
let xVel = 0;
let yVel = 0;
let score = 0;
let wave = 0;
let health = 5;
let shield = 0;
let powerDuration = 0;
let immunity = 60;
let hurt = 0;
let money = 0;
let gameStatus = "Survive!";
let shopTimer = -1;
let powerup = "None";

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
    return false;
}
function getAnimsByClass(shape, className) {
    let returns = [];
    if (shape == "circle") {
        for (let i = 0; i < animData.circles.length; i++) {
            if (animData.circles[i].class == className) returns.push(animData.circles[i]);
        }
    }
    if (shape == "rect") {
        for (let i = 0; i < animData.rects.length; i++) {
            if (animData.rects[i].class == className) returns.push(animData.rects[i]);
        }
    }
    if (returns.length == 0) return false;
    return returns;
}
function nextFreeNumericId(shape) {for (let x = 0; ; x++) if (!getAnimById(shape, x)) return x;}

function animate() {
    fillPage("lightBlue");
    gameStatus = "Survive!";

    for (let i = 0; i < animData.rects.length; i++) {
        rect = animData.rects[i];
        fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
        // Different animation styles move in different ways
        // If you held both directions in bounce mode you could shimmy through the wall,
        // moving the player out of the wall fixes that and prevents future issues
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
        if (rect.animation == "locked") {
            if (rect.x + rect.width > canvasWidth) rect.x = canvasWidth - rect.width;
            if (rect.x < 0) rect.x = 0;
            if (rect.y + rect.height > canvasHeight) rect.y = canvasHeight - rect.height;
            if (rect.y < 0) rect.y = 0;
        }
        if (rect.animation == "exitKill") {
            if (rect.x > canvasWidth || rect.x + rect.width < 0 || rect.y > canvasHeight || rect.y + rect.height < 0) 
                animData.rects = animData.rects.filter(i => i != rect);
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
        // Same bounce collision is applied here, just in case
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
        if (circle.animation == "locked") {
            if (circle.x + circle.radius > canvasWidth) circle.x = canvasWidth - circle.radius;
            if (circle.x - circle.radius < 0) circle.x = 0 + circle.radius;
            if (circle.y + circle.radius > canvasHeight) circle.y = canvasHeight - circle.radius;
            if (circle.y - circle.radius < 0) circle.y = 0 + circle.radius;
        }
        if (circle.animation == "exitKill") {
            if (circle.x - circle.radius > canvasWidth || circle.x + circle.radius < 0 || circle.y - circle.radius > canvasHeight || circle.y + circle.radius < 0) 
                animData.circles = animData.circles.filter(i => i != circle);
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
    if (player.y + player.height >= ground.y) {
        player.y = ground.y - player.height;
        if (player.yVel < 0) player.yVel = 0;
    }
    let balls = getAnimsByClass("circle", "ball");
    let bullets = getAnimsByClass("circle", "bullet")
    for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];
        if (ball.y + ball.radius >= ground.y) {
            ball.y = ground.y - ball.radius;
            ball.yVel *= -1;
        }
        if (player.width/2 + ball.radius >= Math.sqrt(Math.pow(player.x + player.width/2 - ball.x, 2) + Math.pow(player.y + player.height/2 - ball.y, 2)) && immunity <= 0) {
            immunity = 60;
            health -= 1;
            hurt = 20;
        }
        for (let x = 0; x < bullets.length; x++) {
            let bullet = bullets[x];
            if (bullet.radius + ball.radius >= Math.sqrt(Math.pow(bullet.x - ball.x, 2) + Math.pow(bullet.y - ball.y, 2))) {
                animData.circles = animData.circles.filter(a => a != ball);
                score += 1;
            }
        }
    }


    if (pressed.includes("KeyA")) player.xVel -= 2;
    if (pressed.includes("KeyD")) player.xVel += 2;
    if (pressed.includes("Space") && player.y + player.height >= ground.y) player.yVel = -5;

    player.xVel *= 0.8
    if (player.yVel < 10) {
        player.yVel += 0.2
    }

    if (hurt > 15) player.color = "red";
    else if (hurt > 10) player.color = "black";
    else if (hurt > 5) player.color = "red";
    else player.color = "black";

    // Firing
    // Very cursed, don't @ me
    // It works with the power of magic and if statements inside of switch case
    if (pressed.includes("ArrowLeft")) xVel -= 10;
    if (pressed.includes("ArrowRight")) xVel += 10;
    if (pressed.includes("ArrowUp")) yVel -= 10;
    if (pressed.includes("ArrowDown")) yVel += 10;
    if (cooldown <= 0 && (xVel != 0 || yVel != 0)) {
        switch (fireMode) {
            case "single":
                animData.circles.push({
                    "id": nextFreeNumericId("circle"),
                    "class": "bullet",
                    "x": player.x + player.width/2,
                    "y": player.y + player.height/2,
                    "radius": 5,
                    "length": 1,
                    "animation": "exitKill",
                    "xVel": xVel,
                    "yVel": yVel,
                    "color": "lightGrey",
                    "lineColor": "black",
                    "lineWidth": 3
                });
                cooldown = 20;
                break;
            case "triple":
                animData.circles.push({
                    "id": nextFreeNumericId("circle"),
                    "class": "bullet",
                    "x": player.x + player.width/2,
                    "y": player.y + player.height/2,
                    "radius": 5,
                    "length": 1,
                    "animation": "exitKill",
                    "xVel": xVel,
                    "yVel": yVel,
                    "color": "lightGrey",
                    "lineColor": "black",
                    "lineWidth": 3
                });
                if (xVel != 0 && yVel != 0) {
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width/2,
                        "y": player.y + player.height/2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel * 0.9,
                        "yVel": yVel,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3
                    });
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width/2,
                        "y": player.y + player.height/2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel,
                        "yVel": yVel * 0.9,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3
                    });
                }
                if (xVel != 0 && yVel == 0) {
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width/2,
                        "y": player.y + player.height/2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel,
                        "yVel": 1,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3
                    });
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width/2,
                        "y": player.y + player.height/2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel,
                        "yVel": -1,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3
                    });
                }
                if (xVel == 0 && yVel != 0) {
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width/2,
                        "y": player.y + player.height/2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": 1,
                        "yVel": yVel,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3
                    });
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width/2,
                        "y": player.y + player.height/2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": -1,
                        "yVel": yVel,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3
                    });
                }
                cooldown = 40;
                break;
            case "big":
                animData.circles.push({
                    "id": nextFreeNumericId("circle"),
                    "class": "bullet",
                    "x": player.x + player.width/2,
                    "y": player.y + player.height/2,
                    "radius": 15,
                    "length": 1,
                    "animation": "exitKill",
                    "xVel": xVel,
                    "yVel": yVel,
                    "color": "lightGrey",
                    "lineColor": "black",
                    "lineWidth": 3
                });
                cooldown = 30;
                break;
            case "fast":
                animData.circles.push({
                    "id": nextFreeNumericId("circle"),
                    "class": "bullet",
                    "x": player.x + player.width/2,
                    "y": player.y + player.height/2,
                    "radius": 3,
                    "length": 1,
                    "animation": "exitKill",
                    "xVel": xVel,
                    "yVel": yVel,
                    "color": "lightGrey",
                    "lineColor": "black",
                    "lineWidth": 3
                });
                cooldown = 5;
                break;
        }
    }

    xVel = 0;
    yVel = 0;

    if (!getAnimsByClass("circle", "ball") && (wave + 1) % 5 == 0) {
        console.log("Shop time!");
        wave += 1;
        shopTimer = 1800;
    }
    if (!getAnimsByClass("circle", "ball") && shopTimer < 0) {
        wave += 1;
        immunity = 120;
        if (health < 5) health++;
        money += 5;
        for (let i = 0; i < wave * 2.5; i++)
            animData.circles.push({
                "id": nextFreeNumericId("shape"),
                "class": "ball",
                "x": randInt(0, canvasWidth / 5) * 5,
                "y": randInt(0, (canvasHeight - getAnimById("rect", "ground").height) / 5) * 5,
                "radius": 10,
                "length": 1,
                "animation": "bounce",
                "xVel": randInt(-5, 5),
                "yVel": randInt(-5, 5),
                "color": "blue",
                "lineColor": "white",
                "lineWidth": 0
            });
    }
    if (shopTimer > 0) gameStatus = "Shop time! Game starts again in " + Math.ceil(shopTimer/60);

    shopTimer--;
    hurt--;
    immunity--;
    cooldown--;
    if (powerDuration > 0) powerDuration--;

    document.getElementById("status").innerHTML = gameStatus;
    document.getElementById("wave").innerHTML = "Wave: " + wave + " - Score: " + score + " - Health: " + health + " - Money: " + money;
    document.getElementById("item").innerHTML = "Shield: " + shield + " - Powerup: " + powerup + " - Powerup Duration: " + Math.ceil(powerDuration/60);

    if (health > 0)
    requestAnimationFrame(animate);
}

animate();

document.getElementById("singleFire").addEventListener("click", () => fireMode = "single");
document.getElementById("tripleFire").addEventListener("click", () => fireMode = "triple");
document.getElementById("bigFire").addEventListener("click", () => fireMode = "big");
document.getElementById("fastFire").addEventListener("click", () => fireMode = "fast");

// Keys need to be tracked in a list to allow for key holding,
// and so that multiple keys can be pressed at once
document.addEventListener("keydown", event => {
    event.preventDefault();
    pressed.push(event.code);
});
document.addEventListener("keyup", event => {
    event.preventDefault();
    pressed = pressed.filter(i => i != event.code);
});

// pressed = pressed.filter(filterFunction);

/* function filterFunction(input) {
    result = input != event.code;
    return result;
} */

// Filter filters through all items in the list, and puts that item into the function
// If the returned value is true it adds it to the output list, if it is false it does not
// It then returns the new list, so I have to put it back in as the list's new value