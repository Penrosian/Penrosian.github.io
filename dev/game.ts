namespace Game {
    // TODO:
    /*
        Tanky enemies
        Shop revamp
    */
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

    function bulletCheck(bullet : Circle, ball : Circle) {
        if (bullet.meta["pierce"] == undefined) throw new Error("Bullet has no pierce. Something has gone horribly wrong.");
        if (bullet.radius + ball.radius >= Math.sqrt(Math.pow(bullet.x - ball.x, 2) + Math.pow(bullet.y - ball.y, 2))) {
            if (ball.meta["health"] && ball.meta["maxHealth"]) {
                let pierceCap = 0;
                while (bullet.meta["pierce"] > 0 && ball.meta["health"] > 0 && pierceCap < 5) {
                    bullet.meta["pierce"] -= pierceMod;
                    ball.meta["health"]--;
                    pierceCap++;
                }
                if (bullet.meta["pierce"] <= 0) animData.circles = animData.circles.filter(a => a != bullet);
                if (pierceCap >= 5) {
                    if (bullet.meta["intangible"] == undefined) bullet.meta["intangible"] = [];
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
                    animData.circles = animData.circles.filter(a => a != ball);
                    animData.circles = animData.circles.filter(a => a != bullet);
                }
            } else {
                animData.circles = animData.circles.filter(a => a != ball);
                bullet.meta["pierce"] -= pierceMod;
                if (bullet.meta["pierce"] <= 0) animData.circles = animData.circles.filter(a => a != bullet);
                score += 1;
                money += 1;
            }
        }
    }

    // Storing in an object instead of in a bunch of variables is
    // cleaner and means I can add more shapes using code
    type ShapeAnimation = "bounce" | "static" | "exitKill" | "locked";

    interface Meta {
        health?: number;
        pierce?: number;
        boss?: boolean;
        expanding?: boolean;
        maxHealth?: number;
        intangible?: any[];
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

    type Save = {
        fireMode: string;
        score: number;
        wave: number;
        health: number;
        shield: number;
        money: number;
        shopTimer: number;
        powerup: string;
        triple: boolean;
        big: boolean;
        fast: boolean;
        animData: animData;
    };

    interface animData {
        "rects": Rect[];
        "circles": Circle[];
    }

    let animData: animData = {
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

    let pressed: string[] = [];
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
    let powerMode = "Unlock Mode";
    let tripleCost = 100;
    let bigCost = 130;
    let fastCost = 220;
    let triple = false;
    let big = false;
    let fast = false;
    let shieldStatus = "";
    let pierceMod = 1;
    let powerSave: any;
    let speed = 2;
    let element: HTMLElement | null;
    let debug = false;

    (window as any).animData = animData;
    (window as any).pressed = pressed;
    (window as any).gameStatus = gameStatus;
    (window as any).getRectById = getRectById;
    (window as any).getCircleById = getCircleById;
    (window as any).getCirclesByClass = getCirclesByClass;
    (window as any).getRectsByClass = getRectsByClass;
    (window as any).debug = debug;

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

    // The main loop
    function animate() {
        fillPage("lightBlue");
        gameStatus = "Survive!";

        for (let i = 0; i < animData.rects.length; i++) {
            let rect = animData.rects[i];
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

        // Rectangles and circles are stored/drawn seperately
        for (let i = 0; i < animData.circles.length; i++) {
            let circle = animData.circles[i];
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

        // Custom/Advanced animation rules
        let player = getRectById("player");
        if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
        let ground = getRectById("ground");
        if (!ground) throw new Error("Ground not found. Something has gone horribly wrong.");

        if (player.y + player.height >= ground.y) {
            player.y = ground.y - player.height;
            if (player.yVel < 0) player.yVel = 0;
        }

        let balls = getCirclesByClass("ball");
        let bullets = getCirclesByClass("bullet");
        if (balls) {
            for (let i = 0; i < balls.length; i++) {
                let ball = balls[i];
                if (ball.y + ball.radius >= ground.y) {
                    ball.y = ground.y - ball.radius;
                    ball.yVel *= -1;
                }
                if (player.width / 2 + ball.radius >= Math.sqrt(Math.pow(player.x + player.width / 2 - ball.x, 2) + Math.pow(player.y + player.height / 2 - ball.y, 2)) && immunity <= 0) {
                    immunity = 60;
                    if (shield > 0) shield -= 1;
                    else health -= 1;
                    hurt = 20;
                }
                if (bullets) {
                    for (let x = 0; x < bullets.length; x++) {
                        let bullet = bullets[x];
                        if (bullet.meta["intangible"] != undefined) {
                            if (!bullet.meta["intangible"].includes(ball.id)) bulletCheck(bullet, ball);
                        }
                        else bulletCheck(bullet, ball);
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
                        for (let i = 0; i < balls.length; i++) {
                            let ball = balls[i];
                            if (player.width / 2 + 400 >= Math.sqrt(Math.pow(player.x + player.width / 2 - ball.x, 2) + Math.pow(player.y + player.height / 2 - ball.y, 2))) {
                                if (ball.meta["health"]) ball.meta["health"] -= 10;
                                else animData.circles = animData.circles.filter(a => a != ball);
                            }
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
        if (powerDuration > 0 && powerup == "Speed Boost") speed = 4;
        else speed = 2;
        if (pressed.includes("KeyA")) player.xVel -= speed;
        if (pressed.includes("KeyD")) player.xVel += speed;
        if (pressed.includes("Space") && player.y + player.height >= ground.y) player.yVel = -5;
        if (multiPressed(["KeyP", "KeyE", "KeyN"])) {
            pressed = pressed.filter(a => !["KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"].includes(a));
            alert("Debug ON");
            debug = true;
        }
        if (multiPressed(["KeyW", "KeyA", "KeyV", "KeyE"]) && debug) {
            pressed = pressed.filter(a => !["KeyW", "KeyA", "KeyV", "KeyE"].includes(a));
            let ans = prompt("Wave:");
            if (ans != null) {
                if (Number.isNaN(Number(ans))) alert("Not a number.");
                else wave = Number(ans);
            }
        }
        if (multiPressed(["KeyM", "KeyO", "KeyN", "KeyE", "KeyY"]) && debug) {
            pressed = pressed.filter(a => !["KeyM", "KeyO", "KeyN", "KeyE", "KeyY"].includes(a));
            let ans = prompt("Money:");
            if (ans != null) {
                if (Number.isNaN(Number(ans))) alert("Not a number.");
                else money = Number(ans);
            }
        }
        if (multiPressed(["KeyS", "KeyH", "KeyI", "KeyE", "KeyL", "KeyD"]) && debug) {
            pressed = pressed.filter(a => !["KeyS", "KeyH", "KeyI", "KeyE", "KeyL", "KeyD"].includes(a));
            let ans = prompt("Shield:");
            if (ans != null) {
                if (Number.isNaN(Number(ans))) alert("Not a number.");
                else shield = Number(ans);
            }
        }

        if (pressed.includes("KeyZ")) fireMode = "single";
        if (pressed.includes("KeyX") && triple) fireMode = "triple";
        if (pressed.includes("KeyC") && big) fireMode = "big";
        if (pressed.includes("KeyV") && fast) fireMode = "fast";

        player.xVel *= 0.8;
        if (player.yVel < 10) {
            player.yVel += 0.2;
        }

        if (hurt > 15) player.color = "red";
        else if (hurt > 10) player.color = "black";
        else if (hurt > 5) player.color = "red";
        else player.color = "black";

        // Firing
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

        let explosions = getCirclesByClass("explosion");
        if (explosions) {
            explosions.forEach(explosion => {
                if (explosion.meta["expanding"]) {
                    explosion.radius += 1;
                    if (explosion.radius >= 30) explosion.meta["expanding"] = false;
                }
                else explosion.radius -= 1;
                if (explosion.radius <= 0) animData.circles = animData.circles.filter(a => a != explosion);
            });
        }

        if (!getCirclesByClass("ball") && (wave + 1) % 5 == 0) {
            wave += 1;
            shopTimer = 1800;
        }
        if (!getCirclesByClass("ball") && shopTimer < 0) {
            wave += 1;
            immunity = 120;
            if (health < 5) health++;
            ground = getRectById("ground");
            if (!ground) throw new Error("Ground not found. Something has gone horribly wrong.");
            if ((wave + 1) % 20 == 0) {
                let id = nextFreeNumericId("circle");
                while (getRectById(id)) id = nextFreeNumericId("circle");
                animData.circles.push({
                    id: id,
                    class: "ball",
                    x: randInt(0, canvasWidth / 5) * 5,
                    y: randInt(0, (canvasHeight - ground.height) / 5) * 5,
                    radius: 10 + (wave / 20) / 2,
                    length: 1,
                    animation: "bounce",
                    xVel: (() => {
                        let vel = randInt(-4, 5);
                        if (vel < 1) vel -= 1;
                        return vel;
                    })(),
                    yVel: (() => {
                        let vel = randInt(-4, 5);
                        if (vel < 1) vel -= 1;
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
            for (let i = 0; i < wave * 2.5; i++)
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

        let bars = getRectsByClass("bossbar");
        if (bars) bars.forEach((bar, index) => {
            let backBar = getRectById(bar.id + "back");
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
                if (!backBar) throw new Error("Bossbar background not found after generation.");
            }
            bar.y = index * 30 + 20;
            let barBoss = getCircleById(bar.id);
            if (barBoss) {
                if (barBoss.meta["maxHealth"] == undefined) throw new Error("Boss max health not found. Something has gone horribly wrong.");
                if (barBoss.meta["health"] == undefined) throw new Error("Boss health not found. Something has gone horribly wrong.");
                bar.width = (canvasWidth - 40) * (barBoss.meta["health"] / barBoss.meta["maxHealth"]);
            } else {
                animData.rects = animData.rects.filter(a => a != bar && a != backBar);
            }
        });

        if (shopTimer > 0) gameStatus = "Shop time! Game starts again in " + Math.ceil(shopTimer / 60);

        if (powerDuration == 0) {
            if (powerup.includes("Shot")) fireMode = powerSave;
            if (powerup == "Pierce Boost") pierceMod = powerSave;
            powerup = "None";
        }

        shopTimer--;
        hurt--;
        immunity--;
        cooldown--;
        if (powerDuration > 0 && powerup == "Speed Boost") cooldown--;
        if (powerDuration > -1) powerDuration--;

        if (shield > 0) shieldStatus = "+" + shield;
        else shieldStatus = "";
        element = document.getElementById("status"); if (element) element.innerHTML = gameStatus;
        element = document.getElementById("wave"); if (element) element.innerHTML = "Wave: " + wave + " - Score: " + score + " - Health: " + health + shieldStatus;
        element = document.getElementById("item"); if (element) element.innerHTML = "Money: " + money + " - Powerup: " + powerup + " - Powerup Duration: " + Math.abs(Math.ceil(powerDuration / 60));
        element = document.getElementById("powerMode"); if (element) element.innerHTML = powerMode;
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
        element = document.getElementById("triple"); if (element) element.innerHTML = "Triple Shot $" + tripleCost;
        element = document.getElementById("big"); if (element) element.innerHTML = "Big Shot $" + bigCost;
        element = document.getElementById("fast"); if (element) element.innerHTML = "Fast Shot $" + fastCost;

        // Sets and unsets disabled for the shop buttons if they aren't purchasable
        element = document.getElementById("shield"); if (element) element.setAttribute("disabled", "");
        if (shield < 5 && money >= 50) { element = document.getElementById("shield"); if (element) element.removeAttribute("disabled"); }
        element = document.getElementById("teleport"); if (element) element.setAttribute("disabled", "");
        if (powerup == "None" && money >= 30) { element = document.getElementById("teleport"); if (element) element.removeAttribute("disabled"); }
        element = document.getElementById("bomb"); if (element) element.setAttribute("disabled", "");
        if (powerup == "None" && money >= 40) { element = document.getElementById("bomb"); if (element) element.removeAttribute("disabled"); }
        element = document.getElementById("speed"); if (element) element.setAttribute("disabled", "");
        if (powerup == "None" && money >= 60) { element = document.getElementById("speed"); if (element) element.removeAttribute("disabled"); }

        element = document.getElementById("triple"); if (element) element.setAttribute("disabled", "");
        if (powerMode == "Unlock Mode" && !triple && money >= 220) { element = document.getElementById("triple"); if (element) element.removeAttribute("disabled"); }
        if (powerMode == "Powerup Mode" && powerup == "None" && money >= 60) { element = document.getElementById("triple"); if (element) element.removeAttribute("disabled"); }
        element = document.getElementById("big"); if (element) element.setAttribute("disabled", "");
        if (powerMode == "Unlock Mode" && !big && money >= 340) {
            element = document.getElementById("big");
            if (element) element.removeAttribute("disabled");
        }
        if (powerMode == "Powerup Mode" && powerup == "None" && money >= 70) {
            element = document.getElementById("big");
            if (element) element.removeAttribute("disabled");
        }
        element = document.getElementById("fast"); if (element) element.setAttribute("disabled", "");
        if (powerMode == "Unlock Mode" && !fast && money >= 600) {
            element = document.getElementById("fast");
            if (element) element.removeAttribute("disabled");
        }
        if (powerMode == "Powerup Mode" && powerup == "None" && money >= 100) {
            element = document.getElementById("fast");
            if (element) element.removeAttribute("disabled");
        }

        if (triple) { element = document.getElementById("tripleFire"); if (element) element.removeAttribute("disabled"); }
        if (big) { element = document.getElementById("bigFire"); if (element) element.removeAttribute("disabled"); }
        if (fast) { element = document.getElementById("fastFire"); if (element) element.removeAttribute("disabled"); }

        if (health > 0)
            requestAnimationFrame(animate);
        else element = document.getElementById("status"); if (element) element.innerHTML = "Game over!";
    }

    element = document.getElementById("tripleFire"); if (element) element.setAttribute("disabled", "");
    element = document.getElementById("bigFire"); if (element) element.setAttribute("disabled", "");
    element = document.getElementById("fastFire"); if (element) element.setAttribute("disabled", "");

    element = document.getElementById("singleFire"); if (element) element.addEventListener("click", () => fireMode = "single");
    element = document.getElementById("tripleFire"); if (element) element.addEventListener("click", () => fireMode = "triple");
    element = document.getElementById("bigFire"); if (element) element.addEventListener("click", () => fireMode = "big");
    element = document.getElementById("fastFire"); if (element) element.addEventListener("click", () => fireMode = "fast");

    element = document.getElementById("save"); if (element) element.addEventListener("click", () => {
        let save = JSON.stringify({
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
    element = document.getElementById("load"); if (element) element.addEventListener("click", () => {
        let storage = localStorage.getItem("save");
        let save: Save | false = false;
        let answer: string | null;
        let run = true;
        if (storage != null) {
            answer = prompt("A save was found in local storage. If you have a different save to load, paste it here. Otherwise, leave it blank.");
            if (answer != null) {
                if (answer == "") {
                    try { save = JSON.parse(storage); }
                    catch (error) {
                        alert("Stored save is invalid.");
                        run = false;
                    }
                } else {
                    try { save = JSON.parse(answer); }
                    catch (error) {
                        alert("Save is invalid. Make sure you copied the full save.");
                        run = false;
                    }
                }
            }
        } else {
            answer = prompt("Paste your save here.");
            if (answer != null && answer != "") {
                try { save = JSON.parse(answer); }
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
            } catch (error) {
                alert("Save is valid, but loading failed. The save may be from a different version. As much of the save as possible was loaded, but some parts may be missing.");
            }
        }
    });

    element = document.getElementById("skip"); if (element) element.addEventListener("click", () => { if (shopTimer > 300) shopTimer = 300; });

    element = document.getElementById("shield"); if (element) element.addEventListener("click", () => {
        shield += 1;
        money -= 50;
    });
    element = document.getElementById("teleport"); if (element) element.addEventListener("click", () => {
        powerup = "Teleport";
        money -= 30;
    });
    element = document.getElementById("bomb"); if (element) element.addEventListener("click", () => {
        powerup = "Bomb";
        money -= 40;
    });
    element = document.getElementById("speed"); if (element) element.addEventListener("click", () => {
        powerup = "Speed Boost";
        money -= 60;
    });

    element = document.getElementById("powerMode"); if (element) element.addEventListener("click", () => {
        if (powerMode == "Unlock Mode") powerMode = "Powerup Mode";
        else powerMode = "Unlock Mode";
    });
    element = document.getElementById("triple"); if (element) element.addEventListener("click", () => {
        if (powerMode == "Unlock Mode") {
            triple = true;
            money -= 220;
        }
        if (powerMode == "Powerup Mode") {
            powerup = "Triple Shot";
            money -= 60;
        }
    });
    element = document.getElementById("big"); if (element) element.addEventListener("click", () => {
        if (powerMode == "Unlock Mode") {
            big = true;
            money -= 340;
        }
        if (powerMode == "Powerup Mode") {
            powerup = "Big Shot";
            money -= 70;
        }
    });
    element = document.getElementById("fast"); if (element) element.addEventListener("click", () => {
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

    animate();
}