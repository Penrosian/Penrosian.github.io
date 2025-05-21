var Infernum;
(function (Infernum) {
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
        "circles": []
    };
    var binds = {
        left: "KeyA",
        right: "KeyD",
        jump: "Space",
        dash: "ShiftLeft"
    };
    var pressed = [];
    var score = 0;
    var health = 5;
    var immunity = 0;
    var gameStatus = ".........";
    var element;
    var debug = false;
    var fighting = 600;
    var flightTime = 396;
    var lastFrameTime = 0;
    var swapBind = "left";
    var capturing = false;
    var framerate = 0;
    window.animData = animData;
    window.debug = debug;
    window.gameStatus = gameStatus;
    window.health = health;
    window.immunity = immunity;
    window.score = score;
    window.fighting = fighting;
    window.pressed = pressed;
    window.flightTime = flightTime;
    window.randInt = randInt;
    window.fillCircle = fillCircle;
    window.fillPage = fillPage;
    window.fillRect = fillRect;
    window.multiPressed = multiPressed;
    window.getCircleById = getCircleById;
    window.getRectById = getRectById;
    window.getCirclesByClass = getCirclesByClass;
    window.getRectsByClass = getRectsByClass;
    window.nextFreeNumericId = nextFreeNumericId;
    window.framerate = framerate;
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
    /*
        Start of game loop
        Start of game loop
        Start of game loop
    */
    function animate(timestamp) {
        console.log(timestamp);
        var delta = (timestamp - lastFrameTime) / 15;
        lastFrameTime = timestamp;
        framerate = 1000 / ((lastFrameTime / 15) * (3 / 50));
        console.log(delta);
        fillPage("lightBlue");
        if (fighting < 0)
            gameStatus = "Survive";
        var _loop_1 = function (i) {
            var rect = animData.rects[i];
            fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
            // Different animation styles move in different ways
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
                rect.x += rect.xVel * delta;
                rect.y += rect.yVel * delta;
            }
        };
        for (var i = 0; i < animData.rects.length; i++) {
            _loop_1(i);
        }
        var _loop_2 = function (i) {
            var circle = animData.circles[i];
            fillCircle(circle.x, circle.y, circle.radius, circle.color, circle.lineColor, circle.lineWidth, circle.length);
            // Different animation styles move in different ways
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
                circle.x += circle.xVel * delta;
                circle.y += circle.yVel * delta;
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
            flightTime = 396;
            if (player.yVel < 0)
                player.yVel = 0;
        }
        var projectiles = getCirclesByClass("projectile");
        if (projectiles) {
            for (var i = 0; i < projectiles.length; i++) {
                var projectile = projectiles[i];
                if (player.width / 2 + projectile.radius >= Math.sqrt(Math.pow(player.x + player.width / 2 - projectile.x, 2) + Math.pow(player.y + player.height / 2 - projectile.y, 2)) && immunity <= 0) {
                    immunity = 30;
                    if (!projectile.meta.damage)
                        throw new Error("Projectile has no damage value. Something has gone horribly wrong.");
                    health -= projectile.meta.damage;
                }
            }
        }
        if (pressed.includes(binds.left))
            player.xVel -= 2 * delta;
        if (pressed.includes(binds.right))
            player.xVel += 2 * delta;
        if (pressed.includes(binds.jump)) {
            if (player.y + player.height >= ground.y)
                player.yVel = -5;
            else if (flightTime > 0) {
                player.yVel -= 0.5 * delta;
                flightTime -= delta;
            }
        }
        if (multiPressed(["KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"])) {
            pressed = pressed.filter(function (a) { return ![-1, "KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"].includes(a); });
            if (debug)
                debug = false;
            else
                debug = true;
            alert("Debug mode: " + debug);
        }
        element = document.getElementById("swapBind");
        if (element)
            element.innerHTML = "Current bind: " + swapBind;
        element = document.getElementById("currentBind");
        if (element) {
            if (capturing)
                element.innerHTML = "Press a key or mouse button to bind.";
            else
                element.innerHTML = "Current key: " + binds[swapBind];
        }
        element = document.getElementById("status");
        if (element)
            element.innerHTML = gameStatus;
        element = document.getElementById("fps");
        if (element)
            element.innerHTML = Math.floor(framerate) + " fps";
        if (capturing) {
            if (pressed.length > 0) {
                binds[swapBind] = pressed[0];
                capturing = false;
                pressed = [];
            }
        }
        player.xVel -= (player.xVel / 6) * delta;
        if (player.yVel < 10)
            player.yVel += 0.2;
        if (player.yVel < -5)
            player.yVel = -5;
        immunity--;
        requestAnimationFrame(animate);
    }
    /*
    ^^^^ End of game loop ^^^^
    ^^^^ End of game loop ^^^^
    ^^^^ End of game loop ^^^^
    */
    element = document.getElementById("swapBind");
    if (element)
        element.addEventListener("click", function () {
            switch (swapBind) {
                case "left":
                    swapBind = "right";
                    break;
                case "right":
                    swapBind = "jump";
                    break;
                case "jump":
                    swapBind = "dash";
                    break;
                case "dash":
                    swapBind = "left";
                    break;
            }
        });
    element = document.getElementById("captureBind");
    if (element)
        element.addEventListener("click", function () {
            capturing = true;
            pressed = [];
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
    document.addEventListener("mousedown", function (event) {
        event.preventDefault();
        pressed.push(event.button);
    });
    document.addEventListener("mouseup", function (event) {
        event.preventDefault();
        pressed = pressed.filter(function (i) { return i != event.button; });
    });
    requestAnimationFrame(animate);
})(Infernum || (Infernum = {}));
