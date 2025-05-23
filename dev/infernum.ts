namespace Infernum {
    const canvas = document.getElementById("gameCanvas");
    if (canvas == null) throw new Error("No canvas found.");
    // @ts-expect-error: canvas has getContext
    const ctx = canvas.getContext("2d");

    const canvasWidth = Number(canvas.getAttribute("width"));
    const canvasHeight = Number(canvas.getAttribute("height"));

    function randInt(low: number, high: number) {
        return Math.floor(Math.random() * (1 + high - low)) + low;
    }

    function fillCircle(x: number, y: number, radius: number, fillColor: string, strokeColor: string, strokeWidth: number, arcLength: number) {
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, arcLength * 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
    }

    function fillPage(fillColor: string) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    function fillRect(x: number, y: number, width: number, height: number, fillColor: string) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width, height);
    }

    function multiPressed(keys: string[]) {
        let returnVal = true;
        keys.forEach(key => {
            if (!pressed.includes(key)) returnVal = false;
        });
        return returnVal;
    }

    // Storing in an object instead of in a bunch of variables is
    // cleaner and means I can add more shapes using code
    type ShapeAnimation = "bounce" | "static" | "exitKill" | "locked";

    interface Meta {
        damage?: number;
    };

    type Rect = {
        "id": any;
        "class": any;
        "x": number;
        "y": number;
        "width": number;
        "height": number;
        "color": string;
        "animation": ShapeAnimation;
        "xVel": number;
        "yVel": number;
        "meta": object;
    };

    type Circle = {
        "id": any;
        "class": any;
        "x": number;
        "y": number;
        "radius": number;
        "length": number;
        "animation": ShapeAnimation;
        "xVel": number;
        "yVel": number;
        "color": string;
        "lineColor": string;
        "lineWidth": number;
        "meta": Meta;
    };

    interface animData {
        "rects": Rect[];
        "circles": Circle[];
    }

    interface Binds {
        left: string | number;
        right: string | number;
        jump: string | number;
        dash: string | number;
    }

    let animData: animData = {
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

    let binds: Binds = {
        left: "KeyA",
        right: "KeyD",
        jump: "Space",
        dash: "ShiftLeft"
    };

    let pressed: (string | number)[] = [];
    let score = 0;
    let health = 5;
    let immunity = 0;
    let gameStatus = ".........";
    let element: HTMLElement | null;
    let debug = false;
    let fighting = 3030;
    let flightTime = 396;
    let lastFrameTime = 0;
    let swapBind = "left";
    let capturing = false;
    let framerate = 0;
    let frame = 0;
    let frameSum = 0;
    let dashCooldown = 0;
    let dashDir = 0;
    let cursorX = 0;
    let cursorY = 0;

    (window as any).animData = animData;
    (window as any).debug = debug;
    (window as any).gameStatus = gameStatus;
    (window as any).health = health;
    (window as any).immunity = immunity;
    (window as any).score = score;
    (window as any).fighting = fighting;
    (window as any).pressed = pressed;
    (window as any).flightTime = flightTime;
    (window as any).randInt = randInt;
    (window as any).fillCircle = fillCircle;
    (window as any).fillPage = fillPage;
    (window as any).fillRect = fillRect;
    (window as any).multiPressed = multiPressed;
    (window as any).getCircleById = getCircleById;
    (window as any).getRectById = getRectById;
    (window as any).getCirclesByClass = getCirclesByClass;
    (window as any).getRectsByClass = getRectsByClass;
    (window as any).nextFreeNumericId = nextFreeNumericId;
    (window as any).framerate = framerate;
    (window as any).frame = frame;
    (window as any).frameSum = frameSum;
    (window as any).dashCooldown = dashCooldown;
    (window as any).dashDir = dashDir;
    (window as any).cursorX = cursorX;
    (window as any).cursorY = cursorY;

    function getCircleById(id: any): Circle | false {
        let returns: Circle | false = false;
        animData.circles.forEach(circle => { if (circle.id == id) returns = circle; });
        return returns;
    }
    function getRectById(id: any): Rect | false {
        let returns: Rect | false = false;
        animData.rects.forEach(rect => { if (rect.id == id) returns = rect; });
        return returns;
    }
    function getCirclesByClass(className: any): Circle[] | false {
        let returns: Circle[] = [];
        animData.circles.forEach(circle => { if (circle.class == className) returns.push(circle); });
        if (returns.length == 0) return false;
        return returns;
    }
    function getRectsByClass(className: any): Rect[] | false {
        let returns: Rect[] = [];
        animData.rects.forEach(rect => { if (rect.class == className) returns.push(rect); });
        if (returns.length == 0) return false;
        return returns;
    }

    function nextFreeNumericId(shape: "circle" | "rect") {
        for (let x = 0; ; x++) {
            if (shape == "circle" && !getCircleById(x)) return x;
            if (shape == "rect" && !getRectById(x)) return x;
        }
    }

    /*
        Start of game loop
        Start of game loop
        Start of game loop
    */
    function animate(timestamp: number) {
        if (frame == 0) {
            element = document.getElementById("bgm");
            // @ts-expect-error: bgm is an audio element, which has play
            if (element) element.play();
        }
        frame++;
        let delta = (timestamp - lastFrameTime) / 16.75;
        lastFrameTime = timestamp;
        framerate = 1000/(delta * (50/3));
        fillPage("black");
        if (fighting < 0) gameStatus = "Survive";

        for (let i = 0; i < animData.rects.length; i++) {
            let rect = animData.rects[i];
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
                rect.x += rect.xVel * delta;
                rect.y += rect.yVel * delta;
            }
        }

        // Rectangles and circles are stored/drawn seperately
        for (let i = 0; i < animData.circles.length; i++) {
            let circle = animData.circles[i];
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
                circle.x += circle.xVel * delta;
                circle.y += circle.yVel * delta;
            }
        }

        // Custom/Advanced animation rules
        let player = getRectById("player");
        if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
        let ground = getRectById("ground");
        if (!ground) throw new Error("Ground not found. Something has gone horribly wrong.");

        if (player.y + player.height >= ground.y) {
            player.y = ground.y - player.height;
            flightTime = 396;
            if (player.yVel < 0) player.yVel = 0;
        }

        let projectiles = getCirclesByClass("projectile");
        if (projectiles) {
            for (let i = 0; i < projectiles.length; i++) {
                let projectile = projectiles[i];
                if (player.width / 2 + projectile.radius >= Math.sqrt(Math.pow(player.x + player.width / 2 - projectile.x, 2) + Math.pow(player.y + player.height / 2 - projectile.y, 2)) && immunity <= 0) {
                    immunity = 30;
                    if (!projectile.meta.damage) throw new Error("Projectile has no damage value. Something has gone horribly wrong.");
                    health -= projectile.meta.damage;
                }
            }
        }

        if (pressed.includes(binds.left)) player.xVel -= 2 * delta;
        if (pressed.includes(binds.right)) player.xVel += 2 * delta;
        if (pressed.includes(binds.jump)) {
            if (player.y + player.height >= ground.y) player.yVel = -7;
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
        if (dashCooldown > 30) player.xVel = 15 * dashDir;

        if (multiPressed(["KeyP", "KeyE", "KeyN"])) {
            pressed = pressed.filter(a => ![-1, "KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"].includes(a));
            if (debug) debug = false;
            else debug = true;
            alert("Debug mode: " + debug);
        }

        element = document.getElementById("swapBind");
        if (element) element.innerHTML = "Current bind: " + swapBind;
        element = document.getElementById("currentBind");
        if (element) {
            if (capturing) element.innerHTML = "Press a key or mouse button to bind.";
            else element.innerHTML = "Current key: " + binds[swapBind as keyof Binds];
        }

        element = document.getElementById("status");
        if (element) element.innerHTML = gameStatus;
        element = document.getElementById("fps");
        if (frame % 30 == 0 && element) {
            element.innerHTML = Math.floor(frameSum/30) + " fps";
            frameSum = 0;
        }
        frameSum += framerate;

        element = document.getElementById("cursor");
            if (element && debug) element.innerHTML = "Cursor: " + cursorX + ", " + cursorY;
            else if (element) element.innerHTML = String(pressed);

        if (capturing) {
            if (pressed.length > 0) {
                binds[swapBind as keyof Binds] = pressed[0];
                capturing = false;
                pressed = [];
            }
        }
        player.xVel -= (player.xVel / 6) * delta;
        if (player.yVel < 10) player.yVel += 0.2;
        if (player.yVel < -7) player.yVel = -7;
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
    if (element) element.addEventListener("click", () => {
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
    if (element) element.addEventListener("click", () => {
        capturing = true;
        pressed = [];
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
    document.addEventListener("mousedown", event => {
        cursorX = event.clientX;
        cursorY = event.clientY;
        event.preventDefault();
        pressed.push(event.button);
    });
    document.addEventListener("mouseup", event => {
        event.preventDefault();
        pressed = pressed.filter(i => i != event.button);
    });

    requestAnimationFrame(animate);
}
