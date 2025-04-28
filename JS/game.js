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
let animData = {
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
let speedCounter = -1;
let firePower = false;
let powerMode = "Unlock Mode";
let tripleCost = 100;
let bigCost = 130;
let fastCost = 220;
let triple = false;
let big = false;
let fast = false;
let shieldStatus = "";

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
            if (shield > 0) shield -= 1;
            else health -= 1;
            hurt = 20;
        }
        for (let x = 0; x < bullets.length; x++) {
            let bullet = bullets[x];
            if (bullet.radius + ball.radius >= Math.sqrt(Math.pow(bullet.x - ball.x, 2) + Math.pow(bullet.y - ball.y, 2))) {
                animData.circles = animData.circles.filter(a => a != ball);
                score += 1;
                money += 1;
            }
        }
    }

    if (pressed.includes("KeyQ") && powerup != "None" && powerDuration == 0) {
        switch (powerup) {
            case "Teleport":
                player.x = randInt(0, canvasWidth - player.width);
                player.y = randInt(0, canvasHeight - player.height - ground.height);
                immunity = 120;
                break;
            case "Bomb":
                balls = getAnimsByClass("circle", "ball");
                for (let i = 0; i < balls.length; i++) {
                    let ball = balls[i];
                    if (player.width/2 + 400 >= Math.sqrt(Math.pow(player.x + player.width/2 - ball.x, 2) + Math.pow(player.y + player.height/2 - ball.y, 2))) 
                        animData.circles = animData.circles.filter(a => a != ball);
                }
                break;
            case "Speed Boost":
                speedCounter = 600;
                break;
            case "Triple Shot":
                savedMode = fireMode;
                fireMode = "triple";
                firePower = true;
                powerDuration = 600;
                break;
            case "Big Shot":
                savedMode = fireMode;
                fireMode = "big";
                firePower = true;
                powerDuration = 600;
                break;
            case "Fast Shot":
                savedMode = fireMode;
                fireMode = "fast";
                firePower = true;
                powerDuration = 600;
                break;
        }
        powerup = "None";
    }
    if (speedCounter > 0) speed = 4;
    else speed = 2;
    if (pressed.includes("KeyA")) player.xVel -= speed;
    if (pressed.includes("KeyD")) player.xVel += speed;
    if (pressed.includes("Space") && player.y + player.height >= ground.y) player.yVel = -5;
    if (pressed.includes("KeyP") && pressed.includes("KeyE") && pressed.includes("KeyN") && pressed.includes("KeyR") && pressed.includes("KeyO") && pressed.includes("KeyS") && pressed.includes("KeyI") && pressed.includes("KeyA") && pressed.includes("KeyN"))
        money = 999999999999;
    
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

    if (firePower && powerDuration == 0) {
        fireMode = savedMode; 
        firePower = false;
    }

    shopTimer--;
    hurt--;
    immunity--;
    speedCounter--;
    cooldown--;
    if (speedCounter > 0) cooldown--;
    if (powerDuration > 0) powerDuration--;
    
    if (speedCounter > 0) powerDuration = speedCounter;

    if (shield > 0) shieldStatus = "+" + shield;
    else shieldStatus = "";
    document.getElementById("status").innerHTML = gameStatus;
    document.getElementById("wave").innerHTML = "Wave: " + wave + " - Score: " + score + " - Health: " + health + shieldStatus;
    document.getElementById("item").innerHTML = "Money: " + money + " - Powerup: " + powerup + " - Powerup Duration: " + Math.ceil(powerDuration/60);
    document.getElementById("powerMode").innerHTML = powerMode;
    if (powerMode == "Unlock Mode") {
        tripleCost = 220;
        bigCost = 340;
        fastCost = 600;
    }
    else {
        tripleCost = 60;
        bigCost = 70;
        fastCost = 100;
    }
    document.getElementById("triple").innerHTML = "Triple Shot $" + tripleCost;
    document.getElementById("big").innerHTML = "Big Shot $" + bigCost;
    document.getElementById("fast").innerHTML = "Fast Shot $" + fastCost;

    // Sets and unsets disabled for the shop buttons if they aren't purchasable
    document.getElementById("shield").setAttribute("disabled", "");
    if (shield < 5 && money >= 50) document.getElementById("shield").removeAttribute("disabled");
    document.getElementById("teleport").setAttribute("disabled", "");
    if (powerup == "None" && money >= 30) document.getElementById("teleport").removeAttribute("disabled");
    document.getElementById("bomb").setAttribute("disabled", "");
    if (powerup == "None" && money >= 40) document.getElementById("bomb").removeAttribute("disabled");
    document.getElementById("speed").setAttribute("disabled", "");
    if (powerup == "None" && money >= 60) document.getElementById("speed").removeAttribute("disabled");

    document.getElementById("triple").setAttribute("disabled", "");
    if (powerMode == "Unlock Mode" && !triple && money >= 220) document.getElementById("triple").removeAttribute("disabled");
    if (powerMode == "Powerup Mode" && powerup == "None" && money >= 60) document.getElementById("triple").removeAttribute("disabled");
    document.getElementById("big").setAttribute("disabled", "");
    if (powerMode == "Unlock Mode" && !big && money >= 340) document.getElementById("big").removeAttribute("disabled");
    if (powerMode == "Powerup Mode" && powerup == "None" && money >= 70) document.getElementById("big").removeAttribute("disabled");
    document.getElementById("fast").setAttribute("disabled", "");
    if (powerMode == "Unlock Mode" && !fast && money >= 600) document.getElementById("fast").removeAttribute("disabled");
    if (powerMode == "Powerup Mode" && powerup == "None" && money >= 100) document.getElementById("fast").removeAttribute("disabled");

    if (triple) document.getElementById("tripleFire").removeAttribute("disabled");
    if (big) document.getElementById("bigFire").removeAttribute("disabled");
    if (fast) document.getElementById("fastFire").removeAttribute("disabled");

    if (health > 0)
    requestAnimationFrame(animate);
    else document.getElementById("status").innerHTML = "Game over!";
}

animate();

document.getElementById("tripleFire").setAttribute("disabled", "");
document.getElementById("bigFire").setAttribute("disabled", "");
document.getElementById("fastFire").setAttribute("disabled", "");

document.getElementById("singleFire").addEventListener("click", () => fireMode = "single");
document.getElementById("tripleFire").addEventListener("click", () => fireMode = "triple");
document.getElementById("bigFire").addEventListener("click", () => fireMode = "big");
document.getElementById("fastFire").addEventListener("click", () => fireMode = "fast");

document.getElementById("save").addEventListener("click", () => {
    let save = JSON.stringify({
        "fireMode": fireMode,
        "score": score,
        "wave": wave,
        "health": health,
        "shield": shield,
        "money": money,
        "shopTimer": shopTimer,
        "powerup": powerup,
        "triple": triple,
        "big": big,
        "fast": fast,
        "animData": animData
    });
    localStorage.setItem("save", save);
    alert("Your save is now in local storage, but you can copy this and save it somewhere safe in case your local storage gets cleared: " + save);
});
document.getElementById("load").addEventListener("click", () => {
    let storage = localStorage.getItem("save");
    let save = {};
    let answer = "";
    let run = true;
    if (storage != null) {
        answer = prompt("A save was found in local storage. If you have a different save to load, paste it here. Otherwise, leave it blank.");
        if (answer == "") {
            try {save = JSON.parse(storage)}
            catch (error) {
                alert("Stored save is invalid.");
                run = false;
            }
        } else {
            try {save = JSON.parse(answer)}
            catch (error) {
                alert("Save is invalid. Make sure you copied the full save.");
                run = false;
            }
        }
    } else {
        try {save = JSON.parse(prompt("Paste your save here."))}
        catch (error) {
            alert("Save is invalid. Make sure you copied the full save.");
            run = false;
        }
    }
    if (run) {
        try {
            immunity = 300;
            fireMode = save.fireMode;
            score = save.score;
            wave = save.wave;
            health = save.health;
            shield = save.shield;
            money = save.money;
            shopTimer = save.shopTimer;
            powerup = save.powerup;
            triple = save.triple;
            big = save.big;
            fast = save.fast;
            animData = save.animData;
        } catch (error) {
            alert("Save is valid, but loading failed. The save may be from a different version. As much of the save as possible was loaded, but some parts may be missing.");
        }
    }
})

document.getElementById("skip").addEventListener("click", () => {if (shopTimer > 300) shopTimer = 300});

document.getElementById("shield").addEventListener("click", () => {
    shield += 1;
    money -= 50;
});
document.getElementById("teleport").addEventListener("click", () => {
    powerup = "Teleport";
    money -= 30;
});
document.getElementById("bomb").addEventListener("click", () => {
    powerup = "Bomb";
    money -= 40;
});
document.getElementById("speed").addEventListener("click", () => {
    powerup = "Speed Boost";
    money -= 60;
});

document.getElementById("powerMode").addEventListener("click", () => {
    if (powerMode == "Unlock Mode") powerMode = "Powerup Mode";
    else powerMode = "Unlock Mode";
});
document.getElementById("triple").addEventListener("click", () => {
    if (powerMode == "Unlock Mode") {
        triple = true;
        money -= 220;
    }
    if (powerMode == "Powerup Mode") {
        powerup = "Triple Shot";
        money -= 60;
    }
});
document.getElementById("big").addEventListener("click", () => {
    if (powerMode == "Unlock Mode") {
        big = true;
        money -= 340;
    }
    if (powerMode == "Powerup Mode") {
        powerup = "Big Shot";
        money -= 70;
    }
});
document.getElementById("fast").addEventListener("click", () => {
    if (powerMode == "Unlock Mode" && !fast && money >= 600) {
        fast = true;
        money -= 600;
    }
    if (powerMode == "Powerup Mode" && powerup == "None" && money >= 100) {
        powerup = "Fast Shot";
        money -= 100;
    }
});

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