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
        "circles": []
    };

    let pressed : string[] = [];
    let score = 0;
    let health = 5;
    let immunity = 0;
    let gameStatus = ".........";
    let element : HTMLElement | null;
    let debug = false;
    let fighting = 600;
    let flightTime = 396;

    function getCircleById(id: any): Circle | false {
        animData.circles.forEach(circle => {if (circle.id = id) return circle})
        return false;
    }
    function getRectById(id: any): Rect | false {
        animData.rects.forEach(rect => {if (rect.id = id) return rect})
        return false;
    }
    function getCirclesByClass(className: any): Circle[] | false {
        let returns: Circle[] = [];
        animData.circles.forEach(circle => {if (circle.class == className) returns.push(circle)})
        if (returns.length == 0) return false;
        return returns;
    }
    function getRectsByClass(className: any): Rect[] | false {
        let returns: Rect[] = [];
        animData.rects.forEach(rect => {if (rect.class == className) returns.push(rect)})
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
        if (fighting < 0) gameStatus = "Survive";
        
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

        
        if (pressed.includes("KeyA")) player.xVel -= 2;
        if (pressed.includes("KeyD")) player.xVel += 2;
        if (pressed.includes("Space")) {
            if (player.y + player.height >= ground.y) player.yVel = -5;
            else if (flightTime > 0) {
                player.yVel -= 0.5;
                flightTime -= 1;
            }
        }
        if (multiPressed(["KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"])) {
            pressed = pressed.filter(a => !["KeyP", "KeyE", "KeyN", "KeyR", "KeyO", "KeyS", "KeyI", "KeyA"].includes(a));
            alert("Debug ON");
            debug = true;
        }

        player.xVel *= 0.8;
        if (player.yVel < 10) player.yVel += 0.2;
        if (player.yVel < -5) player.yVel = -5;
        immunity--;
    }
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