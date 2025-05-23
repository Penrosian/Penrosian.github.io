var Game;
(function (Game) {
    // TODO:
    /*
        Tanky enemies
        Shop revamp
    */
    var canvas = document.getElementById("gameCanvas");
    if (canvas == null)
        throw new Error("No canvas found.");
    // @ts-expect-error: canvas has getContext
    var ctx = canvas.getContext("2d");
    var canvasWidth = Number(canvas.getAttribute("width"));
    var canvasHeight = Number(canvas.getAttribute("height"));
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
    function multiPressed(keys) {
        var returnVal = true;
        keys.forEach(function (key) {
            if (!pressed.includes(key))
                returnVal = false;
        });
        return returnVal;
    }
    function bulletCheck(bullet, ball) {
        if (bullet.meta["pierce"] == undefined)
            throw new Error("Bullet has no pierce. Something has gone horribly wrong.");
        if (bullet.radius + ball.radius >= Math.sqrt(Math.pow(bullet.x - ball.x, 2) + Math.pow(bullet.y - ball.y, 2))) {
            if (ball.meta["health"] && ball.meta["maxHealth"]) {
                var pierceCap = 0;
                while (bullet.meta["pierce"] > 0 && ball.meta["health"] > 0 && pierceCap < 5) {
                    bullet.meta["pierce"] -= pierceMod;
                    ball.meta["health"]--;
                    pierceCap++;
                }
                if (bullet.meta["pierce"] <= 0)
                    animData.circles = animData.circles.filter(function (a) { return a != bullet; });
                if (pierceCap >= 5) {
                    if (bullet.meta["intangible"] == undefined)
                        bullet.meta["intangible"] = [];
                    bullet.meta["intangible"].push(ball.id);
                }
                if (ball.meta["health"] <= 0) {
                    if (ball.meta["boss"]) {
                        animData.circles.push({
                            "id": nextFreeNumericId("circle"),
                            "class": "explosion",
                            "x": ball.x,
                            "y": ball.y,
                            "radius": 1,
                            "length": 1,
                            "animation": "static",
                            "xVel": 0,
                            "yVel": 0,
                            "color": "red",
                            "lineColor": "black",
                            "lineWidth": 8,
                            "meta": { "expanding": true }
                        });
                        score += Math.ceil(ball.meta["maxHealth"] / 2);
                        money += Math.ceil(ball.meta["maxHealth"] / 2);
                    }
                    score += ball.meta["maxHealth"];
                    money += ball.meta["maxHealth"];
                    animData.circles = animData.circles.filter(function (a) { return a != ball; });
                    animData.circles = animData.circles.filter(function (a) { return a != bullet; });
                }
            }
            else {
                animData.circles = animData.circles.filter(function (a) { return a != ball; });
                bullet.meta["pierce"] -= pierceMod;
                if (bullet.meta["pierce"] <= 0)
                    animData.circles = animData.circles.filter(function (a) { return a != bullet; });
                score += 1;
                money += 1;
            }
        }
    }
    ;
    var animData = {
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
                "yVel": -5,
                "meta": {}
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
                "yVel": 0,
                "meta": {}
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
                "lineWidth": 0,
                "meta": {}
            }
        ]
    };
    var pressed = [];
    var cooldown = 0;
    var fireMode = "single";
    var xVel = 0;
    var yVel = 0;
    var score = 0;
    var wave = 0;
    var health = 5;
    var shield = 0;
    var powerDuration = 0;
    var immunity = 60;
    var hurt = 0;
    var money = 0;
    var gameStatus = "Survive!";
    var shopTimer = -1;
    var powerup = "None";
    var powerMode = "Unlock Mode";
    var tripleCost = 100;
    var bigCost = 130;
    var fastCost = 220;
    var triple = false;
    var big = false;
    var fast = false;
    var shieldStatus = "";
    var pierceMod = 1;
    var powerSave;
    var speed = 2;
    var element;
    var debug = false;
    window.animData = animData;
    window.pressed = pressed;
    window.gameStatus = gameStatus;
    window.getRectById = getRectById;
    window.getCircleById = getCircleById;
    window.getCirclesByClass = getCirclesByClass;
    window.getRectsByClass = getRectsByClass;
    window.debug = debug;
    function getCircleById(id) {
        var returns = false;
        animData.circles.forEach(function (circle) { if (circle.id == id)
            returns = circle; });
        return returns;
    }
    function getRectById(id) {
        var returns = false;
        animData.rects.forEach(function (rect) { if (rect.id == id)
            returns = rect; });
        return returns;
    }
    function getCirclesByClass(className) {
        var returns = [];
        animData.circles.forEach(function (circle) { if (circle.class == className)
            returns.push(circle); });
        if (returns.length == 0)
            return false;
        return returns;
    }
    function getRectsByClass(className) {
        var returns = [];
        animData.rects.forEach(function (rect) { if (rect.class == className)
            returns.push(rect); });
        if (returns.length == 0)
            return false;
        return returns;
    }
    function nextFreeNumericId(shape) {
        for (var x = 0;; x++) {
            if (shape == "circle" && !getCircleById(x))
                return x;
            if (shape == "rect" && !getRectById(x))
                return x;
        }
    }
    // The main loop
    function animate() {
        fillPage("lightBlue");
        gameStatus = "Survive!";
        var _loop_1 = function (i) {
            var rect = animData.rects[i];
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
                if (rect.x + rect.width > canvasWidth)
                    rect.x = canvasWidth - rect.width;
                if (rect.x < 0)
                    rect.x = 0;
                if (rect.y + rect.height > canvasHeight)
                    rect.y = canvasHeight - rect.height;
                if (rect.y < 0)
                    rect.y = 0;
            }
            if (rect.animation == "exitKill") {
                if (rect.x > canvasWidth || rect.x + rect.width < 0 || rect.y > canvasHeight || rect.y + rect.height < 0)
                    animData.rects = animData.rects.filter(function (i) { return i != rect; });
            }
            if (rect.animation != "static") {
                rect.x += rect.xVel;
                rect.y += rect.yVel;
            }
        };
        for (var i = 0; i < animData.rects.length; i++) {
            _loop_1(i);
        }
        var _loop_2 = function (i) {
            var circle = animData.circles[i];
            fillCircle(circle.x, circle.y, circle.radius, circle.color, circle.lineColor, circle.lineWidth, circle.length);
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
                if (circle.x + circle.radius > canvasWidth)
                    circle.x = canvasWidth - circle.radius;
                if (circle.x - circle.radius < 0)
                    circle.x = 0 + circle.radius;
                if (circle.y + circle.radius > canvasHeight)
                    circle.y = canvasHeight - circle.radius;
                if (circle.y - circle.radius < 0)
                    circle.y = 0 + circle.radius;
            }
            if (circle.animation == "exitKill") {
                if (circle.x - circle.radius > canvasWidth || circle.x + circle.radius < 0 || circle.y - circle.radius > canvasHeight || circle.y + circle.radius < 0)
                    animData.circles = animData.circles.filter(function (i) { return i != circle; });
            }
            if (circle.animation != "static") {
                circle.x += circle.xVel;
                circle.y += circle.yVel;
            }
        };
        // Rectangles and circles are stored/drawn seperately
        for (var i = 0; i < animData.circles.length; i++) {
            _loop_2(i);
        }
        // Custom/Advanced animation rules
        var player = getRectById("player");
        if (!player)
            throw new Error("Player not found. Something has gone horribly wrong.");
        var ground = getRectById("ground");
        if (!ground)
            throw new Error("Ground not found. Something has gone horribly wrong.");
        if (player.y + player.height >= ground.y) {
            player.y = ground.y - player.height;
            if (player.yVel < 0)
                player.yVel = 0;
        }
        var balls = getCirclesByClass("ball");
        var bullets = getCirclesByClass("bullet");
        if (balls) {
            for (var i = 0; i < balls.length; i++) {
                var ball = balls[i];
                if (ball.y + ball.radius >= ground.y) {
                    ball.y = ground.y - ball.radius;
                    ball.yVel *= -1;
                }
                if (player.width / 2 + ball.radius >= Math.sqrt(Math.pow(player.x + player.width / 2 - ball.x, 2) + Math.pow(player.y + player.height / 2 - ball.y, 2)) && immunity <= 0) {
                    immunity = 60;
                    if (shield > 0)
                        shield -= 1;
                    else
                        health -= 1;
                    hurt = 20;
                }
                if (bullets) {
                    for (var x = 0; x < bullets.length; x++) {
                        var bullet = bullets[x];
                        if (bullet.meta["intangible"] != undefined) {
                            if (!bullet.meta["intangible"].includes(ball.id))
                                bulletCheck(bullet, ball);
                        }
                        else
                            bulletCheck(bullet, ball);
                    }
                }
            }
        }
        if (pressed.includes("KeyQ") && powerup != "None" && powerDuration < 0) {
            switch (powerup) {
                case "Teleport":
                    player.x = randInt(0, canvasWidth - player.width);
                    player.y = randInt(0, canvasHeight - player.height - ground.height);
                    immunity = 120;
                    powerup = "None";
                    break;
                case "Bomb":
                    balls = getCirclesByClass("ball");
                    if (balls) {
                        var _loop_3 = function (i) {
                            var ball = balls[i];
                            if (player.width / 2 + 400 >= Math.sqrt(Math.pow(player.x + player.width / 2 - ball.x, 2) + Math.pow(player.y + player.height / 2 - ball.y, 2))) {
                                if (ball.meta["health"])
                                    ball.meta["health"] -= 10;
                                else
                                    animData.circles = animData.circles.filter(function (a) { return a != ball; });
                            }
                        };
                        for (var i = 0; i < balls.length; i++) {
                            _loop_3(i);
                        }
                    }
                    powerup = "None";
                    break;
                case "Speed Boost":
                    powerDuration = 600;
                    break;
                case "Triple Shot":
                    powerSave = fireMode;
                    fireMode = "triple";
                    powerDuration = 600;
                    break;
                case "Big Shot":
                    powerSave = fireMode;
                    fireMode = "big";
                    powerDuration = 600;
                    break;
                case "Fast Shot":
                    powerSave = fireMode;
                    fireMode = "fast";
                    powerDuration = 600;
                    break;
                case "Pierce Boost":
                    powerSave = pierceMod;
                    pierceMod = pierceMod *= 0.5;
                    powerDuration = 600;
            }
        }
        if (powerDuration > 0 && powerup == "Speed Boost")
            speed = 4;
        else
            speed = 2;
        if (pressed.includes("KeyA"))
            player.xVel -= speed;
        if (pressed.includes("KeyD"))
            player.xVel += speed;
        if (pressed.includes("Space") && player.y + player.height >= ground.y)
            player.yVel = -5;
        if (multiPressed(["KeyP", "KeyE", "KeyN"])) {
            pressed = pressed.filter(function (a) { return !["KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"].includes(a); });
            alert("Debug ON");
            debug = true;
        }
        if (multiPressed(["KeyW", "KeyA", "KeyV", "KeyE"]) && debug) {
            pressed = pressed.filter(function (a) { return !["KeyW", "KeyA", "KeyV", "KeyE"].includes(a); });
            var ans = prompt("Wave:");
            if (ans != null) {
                if (Number.isNaN(Number(ans)))
                    alert("Not a number.");
                else
                    wave = Number(ans);
            }
        }
        if (multiPressed(["KeyM", "KeyO", "KeyN", "KeyE", "KeyY"]) && debug) {
            pressed = pressed.filter(function (a) { return !["KeyM", "KeyO", "KeyN", "KeyE", "KeyY"].includes(a); });
            var ans = prompt("Money:");
            if (ans != null) {
                if (Number.isNaN(Number(ans)))
                    alert("Not a number.");
                else
                    money = Number(ans);
            }
        }
        if (multiPressed(["KeyS", "KeyH", "KeyI", "KeyE", "KeyL", "KeyD"]) && debug) {
            pressed = pressed.filter(function (a) { return !["KeyS", "KeyH", "KeyI", "KeyE", "KeyL", "KeyD"].includes(a); });
            var ans = prompt("Shield:");
            if (ans != null) {
                if (Number.isNaN(Number(ans)))
                    alert("Not a number.");
                else
                    shield = Number(ans);
            }
        }
        if (pressed.includes("KeyZ"))
            fireMode = "single";
        if (pressed.includes("KeyX") && triple)
            fireMode = "triple";
        if (pressed.includes("KeyC") && big)
            fireMode = "big";
        if (pressed.includes("KeyV") && fast)
            fireMode = "fast";
        player.xVel *= 0.8;
        if (player.yVel < 10) {
            player.yVel += 0.2;
        }
        if (hurt > 15)
            player.color = "red";
        else if (hurt > 10)
            player.color = "black";
        else if (hurt > 5)
            player.color = "red";
        else
            player.color = "black";
        // Firing
        if (pressed.includes("ArrowLeft"))
            xVel -= 10;
        if (pressed.includes("ArrowRight"))
            xVel += 10;
        if (pressed.includes("ArrowUp"))
            yVel -= 10;
        if (pressed.includes("ArrowDown"))
            yVel += 10;
        if (cooldown <= 0 && (xVel != 0 || yVel != 0)) {
            switch (fireMode) {
                case "single":
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width / 2,
                        "y": player.y + player.height / 2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel,
                        "yVel": yVel,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3,
                        "meta": { "pierce": 3 }
                    });
                    cooldown = 20;
                    break;
                case "triple":
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width / 2,
                        "y": player.y + player.height / 2,
                        "radius": 5,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel,
                        "yVel": yVel,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3,
                        "meta": { "pierce": 3 }
                    });
                    if (xVel != 0 && yVel != 0) {
                        animData.circles.push({
                            "id": nextFreeNumericId("circle"),
                            "class": "bullet",
                            "x": player.x + player.width / 2,
                            "y": player.y + player.height / 2,
                            "radius": 5,
                            "length": 1,
                            "animation": "exitKill",
                            "xVel": xVel * 0.9,
                            "yVel": yVel,
                            "color": "lightGrey",
                            "lineColor": "black",
                            "lineWidth": 3,
                            "meta": { "pierce": 3 }
                        });
                        animData.circles.push({
                            "id": nextFreeNumericId("circle"),
                            "class": "bullet",
                            "x": player.x + player.width / 2,
                            "y": player.y + player.height / 2,
                            "radius": 5,
                            "length": 1,
                            "animation": "exitKill",
                            "xVel": xVel,
                            "yVel": yVel * 0.9,
                            "color": "lightGrey",
                            "lineColor": "black",
                            "lineWidth": 3,
                            "meta": { "pierce": 3 }
                        });
                    }
                    if (xVel != 0 && yVel == 0) {
                        animData.circles.push({
                            "id": nextFreeNumericId("circle"),
                            "class": "bullet",
                            "x": player.x + player.width / 2,
                            "y": player.y + player.height / 2,
                            "radius": 5,
                            "length": 1,
                            "animation": "exitKill",
                            "xVel": xVel,
                            "yVel": 1,
                            "color": "lightGrey",
                            "lineColor": "black",
                            "lineWidth": 3,
                            "meta": { "pierce": 3 }
                        });
                        animData.circles.push({
                            "id": nextFreeNumericId("circle"),
                            "class": "bullet",
                            "x": player.x + player.width / 2,
                            "y": player.y + player.height / 2,
                            "radius": 5,
                            "length": 1,
                            "animation": "exitKill",
                            "xVel": xVel,
                            "yVel": -1,
                            "color": "lightGrey",
                            "lineColor": "black",
                            "lineWidth": 3,
                            "meta": { "pierce": 3 }
                        });
                    }
                    if (xVel == 0 && yVel != 0) {
                        animData.circles.push({
                            "id": nextFreeNumericId("circle"),
                            "class": "bullet",
                            "x": player.x + player.width / 2,
                            "y": player.y + player.height / 2,
                            "radius": 5,
                            "length": 1,
                            "animation": "exitKill",
                            "xVel": 1,
                            "yVel": yVel,
                            "color": "lightGrey",
                            "lineColor": "black",
                            "lineWidth": 3,
                            "meta": { "pierce": 3 }
                        });
                        animData.circles.push({
                            "id": nextFreeNumericId("circle"),
                            "class": "bullet",
                            "x": player.x + player.width / 2,
                            "y": player.y + player.height / 2,
                            "radius": 5,
                            "length": 1,
                            "animation": "exitKill",
                            "xVel": -1,
                            "yVel": yVel,
                            "color": "lightGrey",
                            "lineColor": "black",
                            "lineWidth": 3,
                            "meta": { "pierce": 3 }
                        });
                    }
                    cooldown = 40;
                    break;
                case "big":
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width / 2,
                        "y": player.y + player.height / 2,
                        "radius": 15,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel,
                        "yVel": yVel,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3,
                        "meta": { "pierce": 100 }
                    });
                    cooldown = 30;
                    break;
                case "fast":
                    animData.circles.push({
                        "id": nextFreeNumericId("circle"),
                        "class": "bullet",
                        "x": player.x + player.width / 2,
                        "y": player.y + player.height / 2,
                        "radius": 3,
                        "length": 1,
                        "animation": "exitKill",
                        "xVel": xVel,
                        "yVel": yVel,
                        "color": "lightGrey",
                        "lineColor": "black",
                        "lineWidth": 3,
                        "meta": { "pierce": 2 }
                    });
                    cooldown = 5;
                    break;
            }
        }
        xVel = 0;
        yVel = 0;
        var explosions = getCirclesByClass("explosion");
        if (explosions) {
            explosions.forEach(function (explosion) {
                if (explosion.meta["expanding"]) {
                    explosion.radius += 1;
                    if (explosion.radius >= 30)
                        explosion.meta["expanding"] = false;
                }
                else
                    explosion.radius -= 1;
                if (explosion.radius <= 0)
                    animData.circles = animData.circles.filter(function (a) { return a != explosion; });
            });
        }
        if (!getCirclesByClass("ball") && (wave + 1) % 5 == 0) {
            wave += 1;
            shopTimer = 1800;
        }
        if (!getCirclesByClass("ball") && shopTimer < 0) {
            wave += 1;
            immunity = 120;
            if (health < 5)
                health++;
            ground = getRectById("ground");
            if (!ground)
                throw new Error("Ground not found. Something has gone horribly wrong.");
            if ((wave + 1) % 20 == 0) {
                var id = nextFreeNumericId("circle");
                while (getRectById(id))
                    id = nextFreeNumericId("circle");
                animData.circles.push({
                    id: id,
                    class: "ball",
                    x: randInt(0, canvasWidth / 5) * 5,
                    y: randInt(0, (canvasHeight - ground.height) / 5) * 5,
                    radius: 10 + (wave / 20) / 2,
                    length: 1,
                    animation: "bounce",
                    xVel: (function () {
                        var vel = randInt(-4, 5);
                        if (vel < 1)
                            vel -= 1;
                        return vel;
                    })(),
                    yVel: (function () {
                        var vel = randInt(-4, 5);
                        if (vel < 1)
                            vel -= 1;
                        return vel;
                    })(),
                    color: "orange",
                    lineColor: "black",
                    lineWidth: 2,
                    meta: {
                        health: (wave + 1) * 2,
                        maxHealth: (wave + 1) * 2,
                        boss: true
                    }
                });
                animData.rects.push({
                    id: id,
                    class: "bossbar",
                    x: 20,
                    y: 20,
                    width: canvasWidth - 40,
                    height: 30,
                    color: "red",
                    animation: "static",
                    xVel: 0,
                    yVel: 0,
                    meta: {}
                });
            }
            for (var i = 0; i < wave * 2.5; i++)
                animData.circles.push({
                    "id": nextFreeNumericId("circle"),
                    "class": "ball",
                    "x": randInt(0, canvasWidth / 5) * 5,
                    "y": randInt(0, (canvasHeight - ground.height) / 5) * 5,
                    "radius": 10,
                    "length": 1,
                    "animation": "bounce",
                    "xVel": randInt(-5, 5),
                    "yVel": randInt(-5, 5),
                    "color": "blue",
                    "lineColor": "white",
                    "lineWidth": 0,
                    "meta": {}
                });
        }
        var bars = getRectsByClass("bossbar");
        if (bars)
            bars.forEach(function (bar, index) {
                var backBar = getRectById(bar.id + "back");
                if (!backBar) {
                    animData.rects.splice(animData.rects.indexOf(bar), 0, {
                        id: bar.id + "back",
                        class: "bossbarBack",
                        x: bar.x,
                        y: bar.y,
                        width: canvasWidth - 40,
                        height: bar.height,
                        color: "lightGrey",
                        animation: "static",
                        xVel: 0,
                        yVel: 0,
                        meta: {}
                    });
                    backBar = getRectById(bar.id + "back");
                    if (!backBar)
                        throw new Error("Bossbar background not found after generation.");
                }
                bar.y = index * 30 + 20;
                var barBoss = getCircleById(bar.id);
                if (barBoss) {
                    if (barBoss.meta["maxHealth"] == undefined)
                        throw new Error("Boss max health not found. Something has gone horribly wrong.");
                    if (barBoss.meta["health"] == undefined)
                        throw new Error("Boss health not found. Something has gone horribly wrong.");
                    bar.width = (canvasWidth - 40) * (barBoss.meta["health"] / barBoss.meta["maxHealth"]);
                }
                else {
                    animData.rects = animData.rects.filter(function (a) { return a != bar && a != backBar; });
                }
            });
        if (shopTimer > 0)
            gameStatus = "Shop time! Game starts again in " + Math.ceil(shopTimer / 60);
        if (powerDuration == 0) {
            if (powerup.includes("Shot"))
                fireMode = powerSave;
            if (powerup == "Pierce Boost")
                pierceMod = powerSave;
            powerup = "None";
        }
        shopTimer--;
        hurt--;
        immunity--;
        cooldown--;
        if (powerDuration > 0 && powerup == "Speed Boost")
            cooldown--;
        if (powerDuration > -1)
            powerDuration--;
        if (shield > 0)
            shieldStatus = "+" + shield;
        else
            shieldStatus = "";
        element = document.getElementById("status");
        if (element)
            element.innerHTML = gameStatus;
        element = document.getElementById("wave");
        if (element)
            element.innerHTML = "Wave: " + wave + " - Score: " + score + " - Health: " + health + shieldStatus;
        element = document.getElementById("item");
        if (element)
            element.innerHTML = "Money: " + money + " - Powerup: " + powerup + " - Powerup Duration: " + Math.abs(Math.ceil(powerDuration / 60));
        element = document.getElementById("powerMode");
        if (element)
            element.innerHTML = powerMode;
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
        element = document.getElementById("triple");
        if (element)
            element.innerHTML = "Triple Shot $" + tripleCost;
        element = document.getElementById("big");
        if (element)
            element.innerHTML = "Big Shot $" + bigCost;
        element = document.getElementById("fast");
        if (element)
            element.innerHTML = "Fast Shot $" + fastCost;
        // Sets and unsets disabled for the shop buttons if they aren't purchasable
        element = document.getElementById("shield");
        if (element)
            element.setAttribute("disabled", "");
        if (shield < 5 && money >= 50) {
            element = document.getElementById("shield");
            if (element)
                element.removeAttribute("disabled");
        }
        element = document.getElementById("teleport");
        if (element)
            element.setAttribute("disabled", "");
        if (powerup == "None" && money >= 30) {
            element = document.getElementById("teleport");
            if (element)
                element.removeAttribute("disabled");
        }
        element = document.getElementById("bomb");
        if (element)
            element.setAttribute("disabled", "");
        if (powerup == "None" && money >= 40) {
            element = document.getElementById("bomb");
            if (element)
                element.removeAttribute("disabled");
        }
        element = document.getElementById("speed");
        if (element)
            element.setAttribute("disabled", "");
        if (powerup == "None" && money >= 60) {
            element = document.getElementById("speed");
            if (element)
                element.removeAttribute("disabled");
        }
        element = document.getElementById("triple");
        if (element)
            element.setAttribute("disabled", "");
        if (powerMode == "Unlock Mode" && !triple && money >= 220) {
            element = document.getElementById("triple");
            if (element)
                element.removeAttribute("disabled");
        }
        if (powerMode == "Powerup Mode" && powerup == "None" && money >= 60) {
            element = document.getElementById("triple");
            if (element)
                element.removeAttribute("disabled");
        }
        element = document.getElementById("big");
        if (element)
            element.setAttribute("disabled", "");
        if (powerMode == "Unlock Mode" && !big && money >= 340) {
            element = document.getElementById("big");
            if (element)
                element.removeAttribute("disabled");
        }
        if (powerMode == "Powerup Mode" && powerup == "None" && money >= 70) {
            element = document.getElementById("big");
            if (element)
                element.removeAttribute("disabled");
        }
        element = document.getElementById("fast");
        if (element)
            element.setAttribute("disabled", "");
        if (powerMode == "Unlock Mode" && !fast && money >= 600) {
            element = document.getElementById("fast");
            if (element)
                element.removeAttribute("disabled");
        }
        if (powerMode == "Powerup Mode" && powerup == "None" && money >= 100) {
            element = document.getElementById("fast");
            if (element)
                element.removeAttribute("disabled");
        }
        if (triple) {
            element = document.getElementById("tripleFire");
            if (element)
                element.removeAttribute("disabled");
        }
        if (big) {
            element = document.getElementById("bigFire");
            if (element)
                element.removeAttribute("disabled");
        }
        if (fast) {
            element = document.getElementById("fastFire");
            if (element)
                element.removeAttribute("disabled");
        }
        if (health > 0)
            requestAnimationFrame(animate);
        else
            element = document.getElementById("status");
        if (element)
            element.innerHTML = "Game over!";
    }
    element = document.getElementById("tripleFire");
    if (element)
        element.setAttribute("disabled", "");
    element = document.getElementById("bigFire");
    if (element)
        element.setAttribute("disabled", "");
    element = document.getElementById("fastFire");
    if (element)
        element.setAttribute("disabled", "");
    element = document.getElementById("singleFire");
    if (element)
        element.addEventListener("click", function () { return fireMode = "single"; });
    element = document.getElementById("tripleFire");
    if (element)
        element.addEventListener("click", function () { return fireMode = "triple"; });
    element = document.getElementById("bigFire");
    if (element)
        element.addEventListener("click", function () { return fireMode = "big"; });
    element = document.getElementById("fastFire");
    if (element)
        element.addEventListener("click", function () { return fireMode = "fast"; });
    element = document.getElementById("save");
    if (element)
        element.addEventListener("click", function () {
            var save = JSON.stringify({
                fireMode: fireMode,
                score: score,
                wave: wave,
                health: health,
                shield: shield,
                money: money,
                shopTimer: shopTimer,
                powerup: powerup,
                triple: triple,
                big: big,
                fast: fast,
                animData: animData
            });
            localStorage.setItem("save", save);
            alert("Your save is now in local storage, but you can copy this and save it somewhere safe in case your local storage gets cleared: " + save);
        });
    element = document.getElementById("load");
    if (element)
        element.addEventListener("click", function () {
            var storage = localStorage.getItem("save");
            var save = false;
            var answer;
            var run = true;
            if (storage != null) {
                answer = prompt("A save was found in local storage. If you have a different save to load, paste it here. Otherwise, leave it blank.");
                if (answer != null) {
                    if (answer == "") {
                        try {
                            save = JSON.parse(storage);
                        }
                        catch (error) {
                            alert("Stored save is invalid.");
                            run = false;
                        }
                    }
                    else {
                        try {
                            save = JSON.parse(answer);
                        }
                        catch (error) {
                            alert("Save is invalid. Make sure you copied the full save.");
                            run = false;
                        }
                    }
                }
            }
            else {
                answer = prompt("Paste your save here.");
                if (answer != null && answer != "") {
                    try {
                        save = JSON.parse(answer);
                    }
                    catch (error) {
                        alert("Save is invalid. Make sure you copied the full save.");
                        run = false;
                    }
                }
            }
            if (run && save) {
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
                }
                catch (error) {
                    alert("Save is valid, but loading failed. The save may be from a different version. As much of the save as possible was loaded, but some parts may be missing.");
                }
            }
        });
    element = document.getElementById("skip");
    if (element)
        element.addEventListener("click", function () { if (shopTimer > 300)
            shopTimer = 300; });
    element = document.getElementById("shield");
    if (element)
        element.addEventListener("click", function () {
            shield += 1;
            money -= 50;
        });
    element = document.getElementById("teleport");
    if (element)
        element.addEventListener("click", function () {
            powerup = "Teleport";
            money -= 30;
        });
    element = document.getElementById("bomb");
    if (element)
        element.addEventListener("click", function () {
            powerup = "Bomb";
            money -= 40;
        });
    element = document.getElementById("speed");
    if (element)
        element.addEventListener("click", function () {
            powerup = "Speed Boost";
            money -= 60;
        });
    element = document.getElementById("powerMode");
    if (element)
        element.addEventListener("click", function () {
            if (powerMode == "Unlock Mode")
                powerMode = "Powerup Mode";
            else
                powerMode = "Unlock Mode";
        });
    element = document.getElementById("triple");
    if (element)
        element.addEventListener("click", function () {
            if (powerMode == "Unlock Mode") {
                triple = true;
                money -= 220;
            }
            if (powerMode == "Powerup Mode") {
                powerup = "Triple Shot";
                money -= 60;
            }
        });
    element = document.getElementById("big");
    if (element)
        element.addEventListener("click", function () {
            if (powerMode == "Unlock Mode") {
                big = true;
                money -= 340;
            }
            if (powerMode == "Powerup Mode") {
                powerup = "Big Shot";
                money -= 70;
            }
        });
    element = document.getElementById("fast");
    if (element)
        element.addEventListener("click", function () {
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
    document.addEventListener("keydown", function (event) {
        event.preventDefault();
        pressed.push(event.code);
    });
    document.addEventListener("keyup", function (event) {
        event.preventDefault();
        pressed = pressed.filter(function (i) { return i != event.code; });
    });
    animate();
})(Game || (Game = {}));
