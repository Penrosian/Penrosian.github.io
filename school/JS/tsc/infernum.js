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
    // Maps a value from one range to another
    function map(value, x1, y1, x2, y2) {
        return (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    }
    function evalPoints(cx, cy, vx, vy, rotation) {
        var dx = vx - cx;
        var dy = vy - cy;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var originalAngle = Math.atan2(dy, dx);
        var rotatedX = cx + distance * Math.cos(originalAngle + rotation);
        var rotatedY = cy + distance * Math.sin(originalAngle + rotation);
        return {
            x: rotatedX,
            y: rotatedY
        };
    }
    function rotatedSquare(square) {
        return {
            topLeft: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x, square.y, square.meta.rotation || 0),
            topRight: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x + square.width, square.y, square.meta.rotation || 0),
            bottomLeft: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x, square.y + square.height, square.meta.rotation || 0),
            bottomRight: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x + square.width, square.y + square.height, square.meta.rotation || 0)
        };
    }
    function sat(polygonA, polygonB) {
        var perpindicularLine = null;
        var dot = 0;
        var perpindicularStack = [];
        var amin = null;
        var amax = null;
        var bmin = null;
        var bmax = null;
        for (var i = 0; i < polygonA.edge.length; i++) {
            perpindicularLine = { x: -polygonA.edge[i].y, y: polygonA.edge[i].x };
            perpindicularStack.push(perpindicularLine);
        }
        for (var i = 0; i < polygonB.edge.length; i++) {
            perpindicularLine = { x: -polygonB.edge[i].y, y: polygonB.edge[i].x };
            perpindicularStack.push(perpindicularLine);
        }
        for (var i = 0; i < perpindicularStack.length; i++) {
            amin = null;
            amax = null;
            bmin = null;
            bmax = null;
            for (var j = 0; j < polygonA.vertex.length; j++) {
                dot = polygonA.vertex[j].x * perpindicularStack[i].x + polygonA.vertex[j].y * perpindicularStack[i].y;
                if (amin == null || dot < amin)
                    amin = dot;
                if (amax == null || dot > amax)
                    amax = dot;
            }
            for (var j = 0; j < polygonB.vertex.length; j++) {
                dot = polygonB.vertex[j].x * perpindicularStack[i].x + polygonB.vertex[j].y * perpindicularStack[i].y;
                if (bmin == null || dot < bmin)
                    bmin = dot;
                if (bmax == null || dot > bmax)
                    bmax = dot;
            }
            if (bmin == null || bmax == null || amin == null || amax == null) {
                throw new Error("Seperating Axis Theorem failed. " + amax + ", " + amin + ", " + bmax + ", " + bmin);
            }
            if ((amin < bmax && amin > bmin) || (bmin < amax && bmin > amin))
                continue;
            else
                return false;
        }
        return true;
    }
    function detectRectangleCollision(rect1, rect2) {
        if (rect1.meta["rotation"] || 0 == 0 && rect2.meta["rotation"] || 0 == 0) {
            // Seperate axis theorem doesn't work for non-rotated rectangles
            if (rect1.x + rect1.width < rect2.x || rect1.x > rect2.x + rect2.width ||
                rect1.y + rect1.height < rect2.y || rect1.y > rect2.y + rect2.height)
                return false;
            else
                return true;
        }
        var rect1Rotated = rotatedSquare(rect1);
        var rect2Rotated = rotatedSquare(rect2);
        var rect1Points = [
            rect1Rotated.topLeft,
            rect1Rotated.topRight,
            rect1Rotated.bottomLeft,
            rect1Rotated.bottomRight
        ];
        var rect1Edges = [
            { x: rect1Rotated.bottomRight.x - rect1Rotated.topRight.x, y: rect1Rotated.bottomRight.y - rect1Rotated.topRight.y },
            { x: rect1Rotated.bottomLeft.x - rect1Rotated.bottomRight.x, y: rect1Rotated.bottomLeft.y - rect1Rotated.bottomRight.y },
            { x: rect1Rotated.topLeft.x - rect1Rotated.bottomLeft.x, y: rect1Rotated.topLeft.y - rect1Rotated.bottomLeft.y },
            { x: rect1Rotated.topRight.x - rect1Rotated.topLeft.x, y: rect1Rotated.topRight.y - rect1Rotated.topLeft.y }
        ];
        var rect2Points = [
            rect2Rotated.topLeft,
            rect2Rotated.topRight,
            rect2Rotated.bottomLeft,
            rect2Rotated.bottomRight
        ];
        var rect2Edges = [
            { x: rect2Rotated.bottomRight.x - rect2Rotated.topRight.x, y: rect2Rotated.bottomRight.y - rect2Rotated.topRight.y },
            { x: rect2Rotated.bottomLeft.x - rect2Rotated.bottomRight.x, y: rect2Rotated.bottomLeft.y - rect2Rotated.bottomRight.y },
            { x: rect2Rotated.topLeft.x - rect2Rotated.bottomLeft.x, y: rect2Rotated.topLeft.y - rect2Rotated.bottomLeft.y },
            { x: rect2Rotated.topRight.x - rect2Rotated.topLeft.x, y: rect2Rotated.topRight.y - rect2Rotated.topLeft.y }
        ];
        var rect1Polygon = { vertex: rect1Points, edge: rect1Edges };
        var rect2Polygon = { vertex: rect2Points, edge: rect2Edges };
        return sat(rect1Polygon, rect2Polygon);
    }
    function detectCircleRectCollision(circle, rect) {
        var angle = rect.meta["rotation"] || 0;
        var rectMidPointX = rect.x + rect.width / 2;
        var rectMidPointY = rect.y + rect.height / 2;
        var unrotatedCircleX = Math.cos(-angle) * (circle.x - rectMidPointX) - Math.sin(-angle) * (circle.y - rectMidPointY) + rectMidPointX;
        var unrotatedCircleY = Math.sin(-angle) * (circle.x - rectMidPointX) + Math.cos(-angle) * (circle.y - rectMidPointY) + rectMidPointY;
        // Closest point in the rectangle to the center of circle rotated backwards(unrotated)
        var closestX, closestY;
        // Find the unrotated closest x point from center of unrotated circle
        if (unrotatedCircleX < rect.x)
            closestX = rect.x;
        else if (unrotatedCircleX > rect.x + rect.width)
            closestX = rect.x + rect.width;
        else
            closestX = unrotatedCircleX;
        // Find the unrotated closest y point from center of unrotated circle
        if (unrotatedCircleY < rect.y)
            closestY = rect.y;
        else if (unrotatedCircleY > rect.y + rect.height)
            closestY = rect.y + rect.height;
        else
            closestY = unrotatedCircleY;
        var distance = Math.sqrt(Math.pow(Math.abs(unrotatedCircleX - closestX), 2) + Math.pow(Math.abs(unrotatedCircleY - closestY), 2));
        if (distance < circle.radius)
            return true;
        else
            return false;
    }
    function detectCircleCollision(circle1, circle2) {
        return Math.sqrt(Math.pow(circle1.x - circle2.x, 2) + Math.pow(circle1.y - circle2.y, 2)) < (circle1.radius + circle2.radius);
    }
    function detectCollision(shape1, shape2) {
        if (shape1.radius != undefined && shape2.radius != undefined)
            return detectCircleCollision(shape1, shape2);
        else if (shape1.radius != undefined && shape2.width != undefined)
            return detectCircleRectCollision(shape1, shape2);
        else if (shape1.width != undefined && shape2.radius != undefined)
            return detectCircleRectCollision(shape2, shape1);
        else if (shape1.width != undefined && shape2.width != undefined)
            return detectRectangleCollision(shape1, shape2);
    }
    // Projectiles
    function lightSword(x, y, rotation, damage) {
    }
    ;
    var animData = {
        "rects": [
            {
                "id": "star1",
                "class": "star",
                "x": 100,
                "y": 100,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star2",
                "class": "star",
                "x": 130,
                "y": 215,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star3",
                "class": "star",
                "x": 40,
                "y": 110,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star4",
                "class": "star",
                "x": 255,
                "y": 300,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star5",
                "class": "star",
                "x": 900,
                "y": 400,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star6",
                "class": "star",
                "x": 840,
                "y": 100,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star7",
                "class": "star",
                "x": 870,
                "y": 80,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star8",
                "class": "star",
                "x": 590,
                "y": 340,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star9",
                "class": "star",
                "x": 450,
                "y": 370,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star10",
                "class": "star",
                "x": 370,
                "y": 210,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star11",
                "class": "star",
                "x": 671,
                "y": 147,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star12",
                "class": "star",
                "x": 161,
                "y": 528,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star13",
                "class": "star",
                "x": 59,
                "y": 444,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star14",
                "class": "star",
                "x": 395,
                "y": 128,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star15",
                "class": "star",
                "x": 640,
                "y": 342,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star16",
                "class": "star",
                "x": 409,
                "y": 573,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star17",
                "class": "star",
                "x": 521,
                "y": 229,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star18",
                "class": "star",
                "x": 762,
                "y": 467,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star19",
                "class": "star",
                "x": 323,
                "y": 440,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "star20",
                "class": "star",
                "x": 214,
                "y": 60,
                "width": 2,
                "height": 2,
                "color": "yellow",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "player",
                "class": null,
                "x": 55,
                "y": 80,
                "width": 20,
                "height": 20,
                "color": "white",
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
    var fighting = 3030;
    var flightTime = 396;
    var lastFrameTime = 0;
    var swapBind = "left";
    var capturing = false;
    var framerate = 0;
    var frame = 0;
    var frameSum = 0;
    var dashCooldown = 0;
    var dashDir = 0;
    var cursorX = 0;
    var cursorY = 0;
    var maxX = window.innerWidth;
    var maxY = window.innerHeight;
    // Expose variables to the global scope for debugging
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
    window.frame = frame;
    window.frameSum = frameSum;
    window.dashCooldown = dashCooldown;
    window.dashDir = dashDir;
    window.cursorX = cursorX;
    window.cursorY = cursorY;
    window.maxX = maxX;
    window.maxY = maxY;
    window.detectRectangleCollision = detectRectangleCollision;
    window.detectCircleCollision = detectCircleCollision;
    window.detectCollision = detectCollision;
    window.detectCircleRectCollision = detectCircleRectCollision;
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
        if (frame == 0) {
            element = document.getElementById("bgm");
            if (element) {
                // @ts-expect-error: bgm is an audio element, which has play
                element.play().then(function () { }, function () { return alert("Please enable autoplay for this site. This game features music-synced attacks, so precise audio timing is required."); });
            }
            ;
        }
        frame++;
        var delta = (timestamp - lastFrameTime) / 16.75;
        lastFrameTime = timestamp;
        framerate = 1000 / (delta * (50 / 3));
        fillPage("black");
        if (fighting < 0)
            gameStatus = "Survive";
        var _loop_1 = function (i) {
            var rect = animData.rects[i];
            if (rect.meta["rotation"] != undefined) {
                ctx.save();
                ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
                ctx.rotate(rect.meta["rotation"] * Math.PI / 180);
                ctx.translate(-(rect.x + rect.width / 2), -(rect.y + rect.height / 2));
                fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
                ctx.restore();
            }
            else if (!rect.meta["noDraw"])
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
        if (detectCollision(player, ground)) {
            player.y = ground.y - player.height;
            flightTime = 396;
            if (player.yVel < 0)
                player.yVel = 0;
        }
        var projectiles = getCirclesByClass("projectile");
        if (projectiles) {
            for (var i = 0; i < projectiles.length; i++) {
                var projectile = projectiles[i];
                if (detectCollision(player, projectile) && immunity <= 0) {
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
            if (detectCollision(player, ground))
                player.yVel = -7;
            else if (flightTime > 0) {
                player.yVel -= 0.7 * delta;
                flightTime -= delta;
            }
        }
        if (pressed.includes(binds.dash) && dashCooldown <= 0) {
            if (pressed.includes(binds.left)) {
                dashDir = -1;
                dashCooldown = 45;
            }
            if (pressed.includes(binds.right)) {
                dashDir = 1;
                dashCooldown = 45;
            }
        }
        if (dashCooldown > 30)
            player.xVel = 15 * dashDir;
        if (multiPressed(["KeyP", "KeyE", "KeyN"])) {
            pressed = pressed.filter(function (a) { return ![-1, "KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"].includes(a); });
            if (debug)
                debug = false;
            else
                debug = true;
            alert("Debug mode: " + debug);
        }
        if (multiPressed(["KeyM", "KeyA", "KeyP"]) && debug) {
            pressed = pressed.filter(function (a) { return ![-1, "KeyM", "KeyA", "KeyP"].includes(a); });
            var ans = prompt("MaxX:");
            var maxTmp = void 0;
            if (ans == null || ans == "") {
                alert("Cancelled.");
                return;
            }
            else {
                maxTmp = Number(ans);
                if (isNaN(maxTmp))
                    alert("Invalid number.");
                else
                    maxX = maxTmp;
            }
            ans = prompt("MaxY:");
            if (ans == null || ans == "") {
                alert("Cancelled.");
                return;
            }
            else {
                maxTmp = Number(ans);
                if (isNaN(maxTmp))
                    alert("Invalid number.");
                else
                    maxY = maxTmp;
            }
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
        if (frame % 30 == 0 && element) {
            element.innerHTML = Math.floor(frameSum / 30) + " fps";
            frameSum = 0;
        }
        frameSum += framerate;
        element = document.getElementById("cursor");
        if (element && debug)
            element.innerHTML = "Mapped: " + Math.round(map(cursorX, 0, maxX, 0, 960)) + ", " + Math.round(map(cursorY, 0, maxY, 0, 540)) + " - Cursor: " + cursorX + ", " + cursorY;
        else if (element)
            element.innerHTML = "";
        if (capturing) {
            if (pressed.length > 0) {
                binds[swapBind] = pressed[0];
                capturing = false;
                pressed = [];
            }
        }
        player.xVel -= (player.xVel / 6) * delta;
        if (player.yVel < 10)
            player.yVel += 0.2 * delta;
        if (player.yVel < -7)
            player.yVel = -7;
        immunity -= delta;
        fighting -= delta;
        dashCooldown -= delta;
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
        cursorX = event.clientX;
        cursorY = event.clientY;
        event.preventDefault();
        pressed.push(event.button);
    });
    document.addEventListener("mouseup", function (event) {
        event.preventDefault();
        pressed = pressed.filter(function (i) { return i != event.button; });
    });
    requestAnimationFrame(animate);
})(Infernum || (Infernum = {}));
