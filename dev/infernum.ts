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

    function fillPolygon(vertexes: { x: number, y: number; }[], fillColor: string, strokeColor: string, strokeWidth: number) {
        ctx.beginPath();
        vertexes.forEach((vertex, index) => {
            if (index == 0) ctx.moveTo(vertex.x, vertex.y);
            else ctx.lineTo(vertex.x, vertex.y);
        });
        ctx.lineTo(vertexes[0].x, vertexes[0].y);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
        ctx.restore();
    }

    // Maps a value from one range to another
    function map(value: number, x1: number, y1: number, x2: number, y2: number): number {
        return (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    }

    type Shape = Circle | Rect | AdvancedPolygon;

    /* 
    Collision detection is really freaking complex
    Rectangle-Rectangle collision is simple
    Polygon-Polygon collision is very complicated
    https://www.youtube.com/watch?v=MvlhMEE9zuc
    Circle-Circle collision is very easy
    Circle-Rectangle collision is only kind of complicated
    Circle-RotatedRectangle collision is just Circle-Rectangle collision with the circle's center rotated
    a negative amount of the rectangle's rotation around the rectangle's center, so that it becomes normal Circle-Rectangle collision
    https://stackoverflow.com/a/70723337
    */

    type Polygon = {
        vertex: { x: number, y: number; }[];
        edge: { x: number, y: number; }[];
    };

    function vertexesToEdges(vertexes: { x: number, y: number; }[]) {
        let edges: { x: number, y: number; }[] = [];
        vertexes.forEach((vertex, index) => {
            if (index == vertexes.length - 1) edges.push({ x: vertexes[0].x - vertex.x, y: vertexes[0].y - vertex.y });
            else edges.push({ x: vertexes[index + 1].x - vertex.x, y: vertexes[index + 1].y - vertex.y });
        });
        return edges;
    }

    function evalPoints(cx: number, cy: number, vx: number, vy: number, rotation: number) {
        const dx = vx - cx;
        const dy = vy - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const originalAngle = Math.atan2(dy, dx);

        const rotatedX = cx + distance * Math.cos(originalAngle + rotation);
        const rotatedY = cy + distance * Math.sin(originalAngle + rotation);

        return {
            x: rotatedX,
            y: rotatedY
        };
    }

    function rotatedSquare(square: Rect) {
        return {
            topLeft: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x, square.y, square.meta.rotation || 0),
            topRight: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x + square.width, square.y, square.meta.rotation || 0),
            bottomLeft: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x, square.y + square.height, square.meta.rotation || 0),
            bottomRight: evalPoints(square.x + square.width / 2, square.y + square.height / 2, square.x + square.width, square.y + square.height, square.meta.rotation || 0)
        };
    }

    function sat(polygonA: Polygon, polygonB: Polygon) {
        let perpindicularLine = null;
        let dot = 0;
        let perpindicularStack = [];
        let amin = null;
        let amax = null;
        let bmin = null;
        let bmax = null;
        for (let i = 0; i < polygonA.edge.length; i++) {
            perpindicularLine = { x: -polygonA.edge[i].y, y: polygonA.edge[i].x };
            perpindicularStack.push(perpindicularLine);
        }
        for (let i = 0; i < polygonB.edge.length; i++) {
            perpindicularLine = { x: -polygonB.edge[i].y, y: polygonB.edge[i].x };
            perpindicularStack.push(perpindicularLine);
        }
        for (let i = 0; i < perpindicularStack.length; i++) {
            amin = null;
            amax = null;
            bmin = null;
            bmax = null;
            for (let j = 0; j < polygonA.vertex.length; j++) {
                dot = polygonA.vertex[j].x * perpindicularStack[i].x + polygonA.vertex[j].y * perpindicularStack[i].y;
                if (amin == null || dot < amin) amin = dot;
                if (amax == null || dot > amax) amax = dot;
            }
            for (let j = 0; j < polygonB.vertex.length; j++) {
                dot = polygonB.vertex[j].x * perpindicularStack[i].x + polygonB.vertex[j].y * perpindicularStack[i].y;
                if (bmin == null || dot < bmin) bmin = dot;
                if (bmax == null || dot > bmax) bmax = dot;
            }
            if (bmin == null || bmax == null || amin == null || amax == null) {
                throw new Error("Seperating Axis Theorem failed. " + amax + ", " + amin + ", " + bmax + ", " + bmin);
            }
            if ((amin < bmax && amin > bmin) || (bmin < amax && bmin > amin)) continue;
            else return false;
        }
        return true;
    }

    function detectRectangleCollision(rect1: Rect, rect2: Rect) {
        if (rect1.meta["rotation"] || 0 == 0 && rect2.meta["rotation"] || 0 == 0) {
            // Seperate axis theorem doesn't work for non-rotated rectangles
            if (rect1.x + rect1.width < rect2.x || rect1.x > rect2.x + rect2.width ||
                rect1.y + rect1.height < rect2.y || rect1.y > rect2.y + rect2.height) return false;
            else return true;
        }

        let rect1Rotated = rotatedSquare(rect1);
        let rect2Rotated = rotatedSquare(rect2);

        let rect1Points = [
            rect1Rotated.topRight,
            rect1Rotated.bottomRight,
            rect1Rotated.bottomLeft,
            rect1Rotated.topLeft
        ];
        let rect1Edges = vertexesToEdges(rect1Points);
        let rect2Points = [
            rect2Rotated.topRight,
            rect2Rotated.bottomRight,
            rect2Rotated.bottomLeft,
            rect2Rotated.topLeft
        ];
        let rect2Edges = vertexesToEdges(rect2Points);
        let rect1Polygon = { vertex: rect1Points, edge: rect1Edges };
        let rect2Polygon = { vertex: rect2Points, edge: rect2Edges };

        return sat(rect1Polygon, rect2Polygon);
    }

    function detectCircleRectCollision(circle: Circle, rect: Rect) {
        const angle = rect.meta["rotation"] || 0;
        const rectMidPointX = rect.x + rect.width / 2;
        const rectMidPointY = rect.y + rect.height / 2;
        const unrotatedCircleX = Math.cos(-angle) * (circle.x - rectMidPointX) - Math.sin(-angle) * (circle.y - rectMidPointY) + rectMidPointX;
        const unrotatedCircleY = Math.sin(-angle) * (circle.x - rectMidPointX) + Math.cos(-angle) * (circle.y - rectMidPointY) + rectMidPointY;

        // Closest point in the rectangle to the center of circle rotated backwards(unrotated)
        let closestX: number, closestY: number;

        // Find the unrotated closest x point from center of unrotated circle
        if (unrotatedCircleX < rect.x) closestX = rect.x;
        else if (unrotatedCircleX > rect.x + rect.width) closestX = rect.x + rect.width;
        else closestX = unrotatedCircleX;

        // Find the unrotated closest y point from center of unrotated circle
        if (unrotatedCircleY < rect.y) closestY = rect.y;
        else if (unrotatedCircleY > rect.y + rect.height) closestY = rect.y + rect.height;
        else closestY = unrotatedCircleY;

        const distance = Math.sqrt(Math.pow(Math.abs(unrotatedCircleX - closestX), 2) + Math.pow(Math.abs(unrotatedCircleY - closestY), 2));
        if (distance < circle.radius) return true;
        else return false;
    }

    function detectCircleCollision(circle1: Circle, circle2: Circle) {
        return Math.sqrt(Math.pow(circle1.x - circle2.x, 2) + Math.pow(circle1.y - circle2.y, 2)) < (circle1.radius + circle2.radius);
    }

    function detectRectPolygonCollision(polygon: AdvancedPolygon, rect: Rect) {
        const rectRotatedPoints = rotatedSquare(rect);
        const rectPoints = [
            rectRotatedPoints.topRight,
            rectRotatedPoints.bottomRight,
            rectRotatedPoints.bottomLeft,
            rectRotatedPoints.topLeft
        ];
        const rectEdges = vertexesToEdges(rectPoints);
        const rectPolygon = { vertex: rectPoints, edge: rectEdges };
        let rotatedVertexes: { x: number, y: number; }[] = [];
        polygon.vertexes.forEach(vertex => {
            const rotatedVertex = evalPoints(polygon.center.x, polygon.center.y, vertex.x, vertex.y, polygon.meta.rotation || 0);
            rotatedVertexes.push(rotatedVertex);
        });
        return sat({ vertex: rotatedVertexes, edge: vertexesToEdges(rotatedVertexes) }, rectPolygon);
    }

    function detectPolygonCollision(polygon1: AdvancedPolygon, polygon2: AdvancedPolygon) {
        const rotatedVertexes1: { x: number, y: number; }[] = [];
        polygon1.vertexes.forEach(vertex => {
            const rotatedVertex = evalPoints(polygon1.center.x, polygon1.center.y, vertex.x, vertex.y, polygon1.meta.rotation || 0);
            rotatedVertexes1.push(rotatedVertex);
        });
        const rotatedVertexes2: { x: number, y: number; }[] = [];
        polygon2.vertexes.forEach(vertex => {
            const rotatedVertex = evalPoints(polygon2.center.x, polygon2.center.y, vertex.x, vertex.y, polygon2.meta.rotation || 0);
            rotatedVertexes2.push(rotatedVertex);
        });
        const polygon1Edges = vertexesToEdges(rotatedVertexes1);
        const polygon2Edges = vertexesToEdges(rotatedVertexes2);
        return sat({ vertex: rotatedVertexes1, edge: polygon1Edges }, { vertex: rotatedVertexes2, edge: polygon2Edges });
    }

    function detectCollision(shape1: Shape, shape2: Shape) {
        if (isCircle(shape1) && isCircle(shape2)) return detectCircleCollision(shape1 as Circle, shape2 as Circle);
        else if (isCircle(shape1) && isRect(shape2)) return detectCircleRectCollision(shape1 as Circle, shape2 as Rect);
        else if (isRect(shape1) && isCircle(shape2)) return detectCircleRectCollision(shape2 as Circle, shape1 as Rect);
        else if (isRect(shape1) && isRect(shape2)) return detectRectangleCollision(shape1 as Rect, shape2 as Rect);
        else if (isAdvancedPolygon(shape1) && isAdvancedPolygon(shape2)) return detectPolygonCollision(shape1 as AdvancedPolygon, shape2 as AdvancedPolygon);
        else if (isAdvancedPolygon(shape1) && isRect(shape2)) return detectRectPolygonCollision(shape1 as AdvancedPolygon, shape2 as Rect);
        else if (isRect(shape1) && isAdvancedPolygon(shape2)) return detectRectPolygonCollision(shape2 as AdvancedPolygon, shape1 as Rect);
        else throw new Error("Unsupported collision type. " + JSON.stringify(shape1) + ", " + JSON.stringify(shape2));
    }

    // Projectiles
    function lightSword(x: number, y: number, rotation: number, damage: number, projectileID: any) {
        const sword: AdvancedPolygon = {
            id: nextFreeNumericId("advancedPolygon"),
            class: "projectileHitbox",
            vertexes: [
                { x: x, y: y }, // Up-Right
                { x: x + 2.5, y: y + 2.5 }, // Base / Down-right
                { x: x + 2.5, y: y + 10 }, // Down
                { x: x + 5, y: y + 10 }, // Right
                { x: x + 10, y: y + 15 }, // Down-right
                { x: x + 5, y: y + 20 }, // Down-left
                { x: x + 2.5, y: y + 20 }, // Left
                { x: x + 2.5, y: y + 40 }, // Down
                { x: x, y: y + 45 }, // Down-left
                { x: x - 2.5, y: y + 40 }, // Up-left
                { x: x - 2.5, y: y + 20 }, // Up
                { x: x - 5, y: y + 20 }, // Left
                { x: x - 10, y: y + 15 }, // Up-left
                { x: x - 5, y: y + 10 }, // Up-right
                { x: x - 2.5, y: y + 10 }, // Right
                { x: x - 2.5, y: y + 2.5 } // Up
            ],
            center: { x: x, y: y + 12.5 },
            animation: "exitKill",
            xVel: 0,
            yVel: 0,
            color: "white",
            lineColor: "lightGray",
            lineWidth: 1,
            meta: {
                damage: damage,
                rotation: rotation,
                projectileID: projectileID
            }
        };
        const telegraph: Rect = {
            id: nextFreeNumericId("rect"),
            class: "projectileTelegraph",
            x: x - 10,
            y: y - 12.5,
            width: 20,
            height: 1000,
            color: "rgba(255, 255, 255, 0.5)",
            animation: "static",
            xVel: 0,
            yVel: 0,
            meta: {
                rotation: rotation,
                projectileID: projectileID,
                alpha: 0.5,
                rotationCenter: { x: sword.center.x, y: sword.center.y }
            }
        };
        animData.advancedPolygons.push(sword);
        animData.rects.push(telegraph);
    }

    function execution() {
        let player = getRectById("player");
        if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
        for (let i = 0; i < 40; i++) {
            lightSword(i * (canvasWidth / 40), player.y + 60, 180, 10000, "0");
            lightSword(i * (canvasWidth / 40), player.y - 60, 0, 10000, "1");
        }
    }

    function lightBall(x: number, y: number, radius: number, damage: number, projectileID: any) {
        const ball: Circle = {
            id: nextFreeNumericId("circle"),
            class: "projectileHitbox",
            x: x,
            y: y,
            radius: radius,
            length: 1,
            animation: "exitKill",
            xVel: 0,
            yVel: 0,
            color: "#FFE135",
            lineColor: "lightGray",
            lineWidth: 1,
            meta: {
                damage: damage,
                projectileID: projectileID
            }
        };
        animData.circles.push(ball);
    }

    function radialBurst(x: number, y: number, count: number, damage: number, rotation: number) {
        while (rotation > 360) rotation -= 360;
        if (count < 1) throw new Error("Count must be at least 1.");
        const angleStep = 360 / count;
        const telegraphID = nextFreeNumericId("projectile");
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep + rotation - 90; // Telegraph angles were offset by 90 degrees and I don't know why
            const telegraphX = x;
            const telegraphY = y;
            const telegraph: Rect = {
                id: nextFreeNumericId("rect"),
                class: "projectileTelegraph",
                x: telegraphX - 10,
                y: telegraphY - 10,
                width: 20,
                height: 1000,
                color: "white",
                animation: "static",
                xVel: 0,
                yVel: 0,
                meta: {
                    rotation: angle,
                    alpha: 0.5,
                    rotationCenter: { x: telegraphX, y: telegraphY },
                    projectileID: telegraphID
                }
            };
            animData.rects.push(telegraph);
        }
        setTimeout(() => {
            const telegraphs = getProjectilePartsById(telegraphID);
            if (telegraphs) animData.rects = animData.rects.filter(a => !telegraphs.includes(a));
            for (let i = 0; i < count; i++) {
                const projectileID = nextFreeNumericId("projectile");
                const angle = i * angleStep + rotation;
                const vector = { x: Math.cos(angle * Math.PI / 180) * 20, y: Math.sin(angle * Math.PI / 180) * 20 };
                const xVel = vector.x;
                const yVel = vector.y;
                lightBall(x, y, 5, damage, projectileID);
                let balls = getProjectilePartsById(projectileID);
                if (!balls) throw new Error("Projectile not found after creation.");
                const ball = balls[0];
                if (ball) {
                    ball.xVel = xVel;
                    ball.yVel = yVel;
                }
            }
        }, 750);
    }

    function normalizeVector(x: number, y: number, targetMagnitude: number) {
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude == 0) return { x: 0, y: 0 };
        return { x: (x / magnitude) * targetMagnitude, y: (y / magnitude) * targetMagnitude };
    }

    // Storing in an object instead of in a bunch of variables is
    // cleaner and means I can add more shapes using code
    type ShapeAnimation = "bounce" | "static" | "exitKill" | "locked" | "custom";

    interface Meta {
        damage?: number;
        rotation?: number;
        noDraw?: boolean;
        projectileID?: any;
        age?: number;
        alpha?: number;
        rotationCenter?: { x: number, y: number; };
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
        "meta": Meta;
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

    type AdvancedPolygon = {
        id: any;
        class: any;
        vertexes: { x: number, y: number; }[];
        center: { x: number, y: number; };
        animation: ShapeAnimation;
        xVel: number;
        yVel: number;
        color: string;
        lineColor: string;
        lineWidth: number;
        meta: Meta;
    };

    interface animData {
        "rects": Rect[];
        "circles": Circle[];
        "advancedPolygons": AdvancedPolygon[];
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
                "id": "player",
                "class": "player",
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
                "class": "ground",
                "x": 0,
                "y": 520,
                "width": 960,
                "height": 20,
                "color": "green",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "healthBarBackground",
                "class": "healthBarBackground",
                "x": 850,
                "y": 30,
                "width": 100,
                "height": 10,
                "color": "lightGray",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            },
            {
                "id": "healthBar",
                "class": "healthBar",
                "x": 850,
                "y": 30,
                "width": 100,
                "height": 10,
                "color": "red",
                "animation": "static",
                "xVel": 0,
                "yVel": 0,
                "meta": {}
            }
        ],
        "circles": [],
        "advancedPolygons": []
    };
    // Stars were cluterring the animData object, so they are here instead now
    const stars = [{
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
        "y": 428,
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
    }];
    stars.forEach(star => animData.rects.push((star as Rect)));

    let binds: Binds = {
        left: "KeyA",
        right: "KeyD",
        jump: "Space",
        dash: "ShiftLeft"
    };

    let pressed: (string | number)[] = [];
    let health = 920;
    let immunity = 0;
    let gameStatus = ".........";
    let element: HTMLElement | null;
    let debug = false;
    let fighting = -3030;
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
    let maxX = window.innerWidth;
    let maxY = window.innerHeight;
    let attackIndex = 0;
    let regenTime = 0;
    let regenCounter = 0;
    let gameOver = false;
    let gameOverTime = 0;

    // Expose variables to the global scope for debugging
    (window as any).animData = animData;
    (window as any).debug = debug;
    (window as any).gameStatus = gameStatus;
    (window as any).health = health;
    (window as any).immunity = immunity;
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
    (window as any).maxX = maxX;
    (window as any).maxY = maxY;
    (window as any).detectRectangleCollision = detectRectangleCollision;
    (window as any).detectCircleCollision = detectCircleCollision;
    (window as any).detectCollision = detectCollision;
    (window as any).detectCircleRectCollision = detectCircleRectCollision;
    (window as any).getAdvancedPolygonById = getAdvancedPolygonById;
    (window as any).getAdvancedPolygonsByClass = getAdvancedPolygonsByClass;
    (window as any).getProjectilePartsById = getProjectilePartsById;
    (window as any).lightSword = lightSword;
    (window as any).execution = execution;
    (window as any).lightBall = lightBall;
    (window as any).radialBurst = radialBurst;
    (window as any).normalizeVector = normalizeVector;
    (window as any).movePolygon = movePolygon;
    (window as any).isRect = isRect;
    (window as any).isCircle = isCircle;
    (window as any).isAdvancedPolygon = isAdvancedPolygon;
    (window as any).shapeOf = shapeOf;
    (window as any).fillPolygon = fillPolygon;

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
    function getAdvancedPolygonById(id: any): AdvancedPolygon | false {
        let returns: AdvancedPolygon | false = false;
        animData.advancedPolygons.forEach(advancedPolygon => { if (advancedPolygon.id == id) returns = advancedPolygon; });
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
    function getAdvancedPolygonsByClass(className: any): AdvancedPolygon[] | false {
        let returns: AdvancedPolygon[] = [];
        animData.advancedPolygons.forEach(advancedPolygon => { if (advancedPolygon.class == className) returns.push(advancedPolygon); });
        if (returns.length == 0) return false;
        return returns;
    }
    function getProjectilePartsById(id: any) {
        let returns: Shape[] = [];
        animData.rects.forEach(rect => { if (rect.meta.projectileID == id) returns.push(rect); });
        animData.circles.forEach(circle => { if (circle.meta.projectileID == id) returns.push(circle); });
        animData.advancedPolygons.forEach(advancedPolygon => { if (advancedPolygon.meta.projectileID == id) returns.push(advancedPolygon); });
        if (returns.length == 0) return false;
        return returns;
    }

    function nextFreeNumericId(shape: "circle" | "rect" | "advancedPolygon" | "projectile"): number {
        for (let x = 0; ; x++) {
            if (shape == "circle" && !getCircleById(x)) return x;
            if (shape == "rect" && !getRectById(x)) return x;
            if (shape == "advancedPolygon" && !getAdvancedPolygonById(x)) return x;
            if (shape == "projectile" && !getProjectilePartsById(x)) return x;
        }
    }

    function movePolygon(polygon: AdvancedPolygon, x: number, y: number) {
        polygon.vertexes.forEach(vertex => {
            vertex.x += x;
            vertex.y += y;
        });
        polygon.center.x += x;
        polygon.center.y += y;
    }

    function isRect(shape: Shape): boolean {
        return (shape as Rect).width != undefined;
    }
    function isCircle(shape: Shape): boolean {
        return (shape as Circle).radius != undefined;
    }
    function isAdvancedPolygon(shape: Shape): boolean {
        return (shape as AdvancedPolygon).vertexes != undefined;
    }
    function shapeOf(shape: Shape): "rect" | "circle" | "advancedPolygon" {
        if (isRect(shape)) return "rect";
        else if (isCircle(shape)) return "circle";
        else return "advancedPolygon";
    }

    /*
        Start of game loop
        Start of game loop
        Start of game loop
    */
    function animate(timestamp: number) {
        if (frame == 0) {
            element = document.getElementById("bgm");
            if (element) {
                // @ts-expect-error: bgm is an audio element, which has play
                element.play().then(() => { }, () => alert("Please enable autoplay for this site. This game features music-sync, so precise audio timing is required."));
            };
        }
        frame++;
        let delta = (timestamp - lastFrameTime) / 16.75;
        lastFrameTime = timestamp;
        framerate = 1000 / (delta * (50 / 3));
        if (fighting > 0) gameStatus = "Survive";

        if (gameOver) {
            gameOverTime += delta;
            let player = getRectById("player");
            if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
            if (gameOverTime > 60) fillPage("black");
            if (gameOverTime > 120) {
                ctx.font = "50px Arial";
                ctx.fillStyle = "white";
                ctx.fillText("You have failed the test.", canvasWidth / 2 - 260, canvasHeight / 2);
            }
            if (gameOverTime > 180) {
                ctx.font = "20px Arial";
                ctx.fillStyle = "white";
                ctx.fillText("Press R to restart.", canvasWidth / 2 - 65, canvasHeight / 2 + 50);
            }
            if (pressed.includes("KeyR")) {
                gameOver = false;
                gameOverTime = 0;
                animData.rects = animData.rects.filter(a => a.class == "player" || a.class == "ground" || a.class == "healthBarBackground" || a.class == "healthBar" || a.class == "star");
                animData.circles = [];
                animData.advancedPolygons = [];
                health = 920;
                fighting = -330;
                element = document.getElementById("bgm");
                if (element) {
                    // @ts-expect-error: bgm is an audio element, which has currentTime
                    element.currentTime = 45;
                    // @ts-expect-error: bgm is an audio element, which has play
                    element.play();
                }
                attackIndex = 0;
            }
            requestAnimationFrame(animate);
            return;
        }

        fillPage("black");
        for (let i = 0; i < animData.rects.length; i++) {
            let rect = animData.rects[i];
            ctx.save();
            if (rect.meta["rotation"] != undefined) {
                const translateX = rect.meta["rotationCenter"] ? rect.meta["rotationCenter"].x : rect.x + rect.width / 2;
                const translateY = rect.meta["rotationCenter"] ? rect.meta["rotationCenter"].y : rect.y + rect.height / 2;
                ctx.translate(translateX, translateY);
                ctx.rotate(rect.meta["rotation"] * Math.PI / 180);
                ctx.translate(-translateX, -translateY);
            }
            ctx.globalAlpha = rect.meta["alpha"] != undefined ? rect.meta["alpha"] : 1;
            if (!rect.meta["noDraw"]) fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
            ctx.restore();
            // Different animation styles move in different ways
            if (rect.animation != "static") {
                rect.x += rect.xVel * delta;
                rect.y += rect.yVel * delta;
            }
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
                if (rect.x + rect.width > canvasWidth) {
                    rect.x = canvasWidth - rect.width;
                    rect.xVel = 0;
                }
                if (rect.x < 0) {
                    rect.x = 0;
                    rect.xVel = 0;
                }
                if (rect.y + rect.height > canvasHeight) {
                    rect.y = canvasHeight - rect.height;
                    rect.yVel = 0;
                }
                if (rect.y < 0) {
                    rect.y = 0;
                    rect.yVel = 0;
                }
            }
            if (rect.animation == "exitKill") {
                if (rect.x > canvasWidth || rect.x + rect.width < 0 || rect.y > canvasHeight || rect.y + rect.height < 0)
                    animData.rects = animData.rects.filter(i => i != rect);
            }
        }

        // Rectangles and circles are stored/drawn seperately
        for (let i = 0; i < animData.circles.length; i++) {
            let circle = animData.circles[i];
            ctx.save();
            if (circle.meta["rotation"] != undefined) {
                const translateX = circle.meta["rotationCenter"] ? circle.meta["rotationCenter"].x : circle.x;
                const translateY = circle.meta["rotationCenter"] ? circle.meta["rotationCenter"].y : circle.y;
                ctx.translate(translateX, translateY);
                ctx.rotate(circle.meta["rotation"] * Math.PI / 180);
                ctx.translate(-translateX, -translateY);
            }
            ctx.globalAlpha = circle.meta["alpha"] != undefined ? circle.meta["alpha"] : 1;
            if (!circle.meta["noDraw"]) fillCircle(circle.x, circle.y, circle.radius, circle.color, circle.lineColor, circle.lineWidth, circle.length);
            ctx.restore();
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
        // They are called advanced polygons for a reason
        for (let i = 0; i < animData.advancedPolygons.length; i++) {
            let polygon = animData.advancedPolygons[i];
            ctx.save();
            if (polygon.meta["rotation"] != undefined) {
                ctx.translate(polygon.center.x, polygon.center.y);
                ctx.rotate(polygon.meta["rotation"] * Math.PI / 180);
                ctx.translate(-polygon.center.x, -polygon.center.y);
            }
            ctx.globalAlpha = polygon.meta["alpha"] != undefined ? polygon.meta["alpha"] : 1;
            if (!polygon.meta["noDraw"]) fillPolygon(polygon.vertexes, polygon.color, polygon.lineColor, polygon.lineWidth);
            ctx.restore();
            // Different animation styles move in different ways
            if (polygon.animation == "bounce") {
                polygon.vertexes.forEach(vertex => {
                    if (vertex.x > canvasWidth) {
                        polygon.xVel *= -1;
                        movePolygon(polygon, canvasWidth - vertex.x, 0);
                    }
                    if (vertex.x < 0) {
                        polygon.xVel *= -1;
                        movePolygon(polygon, -vertex.x, 0);
                    }
                    if (vertex.y > canvasHeight) {
                        polygon.yVel *= -1;
                        movePolygon(polygon, 0, canvasHeight - vertex.y);
                    }
                    if (vertex.y < 0) {
                        polygon.yVel *= -1;
                        movePolygon(polygon, 0, -vertex.y);
                    }
                });
            }
            if (polygon.animation == "locked") {
                polygon.vertexes.forEach(vertex => {
                    if (vertex.x > canvasWidth) movePolygon(polygon, canvasWidth - vertex.x, 0);
                    if (vertex.x < 0) movePolygon(polygon, -vertex.x, 0);
                    if (vertex.y > canvasHeight) movePolygon(polygon, 0, canvasHeight - vertex.y);
                    if (vertex.y < 0) movePolygon(polygon, 0, -vertex.y);
                });
            }
            if (polygon.animation == "exitKill") {
                let counter = 0;
                polygon.vertexes.forEach(vertex => { if (vertex.x > canvasWidth || vertex.x < 0 || vertex.y > canvasHeight || vertex.y < 0) counter++; });
                if (counter >= polygon.vertexes.length) animData.advancedPolygons = animData.advancedPolygons.filter(i => i != polygon);
            }
            if (polygon.animation != "static") movePolygon(polygon, polygon.xVel * delta, polygon.yVel * delta);
        }

        // Custom/Advanced animation rules
        let player = getRectById("player");
        if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
        let ground = getRectById("ground");
        if (!ground) throw new Error("Ground not found. Something has gone horribly wrong.");

        if (detectCollision(player, ground)) {
            player.y = ground.y - player.height;
            flightTime = 396;
            if (player.yVel > 0) player.yVel = 0;
        }

        let projectiles: Shape[] = ((getCirclesByClass("projectileHitbox") as Shape[]) || []).concat((getRectsByClass("projectileHitbox") as Shape[]) || []).concat((getAdvancedPolygonsByClass("projectileHitbox") as Shape[]) || []);
        if (projectiles.length > 0) {
            for (let i = 0; i < projectiles.length; i++) {
                let projectile = projectiles[i];
                if (detectCollision(player, projectile) && immunity <= 0) {
                    immunity = 30;
                    if (projectile.meta.damage == undefined) throw new Error("Projectile has no damage value. Something has gone horribly wrong.");
                    health -= projectile.meta.damage;
                    regenTime = 0;
                }
            }
        }

        if (pressed.includes(binds.left)) player.xVel -= 2 * delta;
        if (pressed.includes(binds.right)) player.xVel += 2 * delta;
        if (pressed.includes(binds.jump)) {
            if (detectCollision(player, ground)) player.yVel = -7;
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
            pressed = pressed.filter(a => ![-1, "KeyP", "KeyE", "KeyN"].includes(a));
            if (debug) debug = false;
            else debug = true;
            alert("Debug mode: " + debug);
        }

        if (multiPressed(["KeyM", "KeyA", "KeyP"]) && debug) {
            pressed = pressed.filter(a => ![-1, "KeyM", "KeyA", "KeyP"].includes(a));
            let ans = prompt("MaxX:");
            let maxTmp: number;
            if (ans == null || ans == "") {
                alert("Cancelled.");
                return;
            }
            else {
                maxTmp = Number(ans);
                if (isNaN(maxTmp)) alert("Invalid number.");
                else maxX = maxTmp;
            }
            ans = prompt("MaxY:");
            if (ans == null || ans == "") {
                alert("Cancelled.");
                return;
            }
            else {
                maxTmp = Number(ans);
                if (isNaN(maxTmp)) alert("Invalid number.");
                else maxY = maxTmp;
            }
        }

        if (multiPressed(["KeyE", "KeyX", "KeyC"]) && debug) {
            pressed = pressed.filter(a => ![-1, "KeyE", "KeyX", "KeyC"].includes(a));
            execution();
        }

        if (multiPressed(["KeyS", "KeyT", "KeyA"]) && debug) {
            pressed = pressed.filter(a => ![-1, "KeyS", "KeyT", "KeyA"].includes(a));
            fighting = -330;
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
            element.innerHTML = Math.floor(frameSum / 30) + " fps";
            frameSum = 0;
        }
        frameSum += framerate;

        element = document.getElementById("cursor");
        if (element && debug) element.innerHTML = "Mapped: " + Math.round(map(cursorX, 0, maxX, 0, 960)) + ", " + Math.round(map(cursorY, 0, maxY, 0, 540)) + " - Cursor: " + cursorX + ", " + cursorY;
        else if (element) element.innerHTML = "";

        element = document.getElementById("debug");
        if (element && debug) {
            element.innerHTML = "Player: " + Math.round(100 * player.x) / 100 + ", " + Math.round(100 * player.y) / 100 + " | Health: " + health;
        }

        if (capturing) {
            if (pressed.length > 0) {
                binds[swapBind as keyof Binds] = pressed[0];
                capturing = false;
                pressed = [];
            }
        }
        player.xVel -= (player.xVel / 6) * delta;
        if (Math.abs(player.xVel) < 0.1) player.xVel = 0;
        if (player.yVel < 10 && !detectCollision(player, ground)) player.yVel += 0.2 * delta;
        if (player.yVel < -7) player.yVel = -7;
        if (Math.abs(player.yVel) < 0.1) player.yVel = 0;

        // Why is Terraria health regeneration so complicated
        // I also could have just used a simple timer, but this is more accurate to the game so idc
        if (health < 920) {
            let effectiveRegenTime: number;
            let movementModifer: number;
            if (regenTime > 3600) regenTime = 3600;
            if (regenTime <= 1800) effectiveRegenTime = Math.floor(regenTime / 300);
            else effectiveRegenTime = 6 + (Math.floor((regenTime - 1800) / 600));
            if (regenTime >= 40 && regenTime < 1800) regenTime = 1800;
            if (player.xVel == 0 && player.yVel == 0) movementModifer = 6.25;
            else movementModifer = 0.5;
            regenCounter += Math.round(0.5 * (((23 / 10 * 0.85 + 0.15) * effectiveRegenTime * movementModifer * 1.1) + 11.2)) * delta;
            regenTime += delta;
            health += Math.floor(regenCounter / 120);
            regenCounter -= Math.floor(regenCounter / 120) * 120;
            if (health > 920) health = 920;
            if (health < 0) {
                health = 0;
                gameOver = true;
                element = document.getElementById("bgm");
                if (element) {
                    // @ts-expect-error: bgm is an audio element, which has pause
                    element.pause();
                }
            }
        }

        let healthBar = getRectById("healthBar");
        if (!healthBar) throw new Error("Health bar not found. Something has gone horribly wrong.");
        healthBar.width = Math.max(map(health, 0, 920, 0, 100), 0);
        healthBar.x = canvasWidth - healthBar.width - 10;
        ctx.font = "10px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("Health: " + health + "/920", canvasWidth - 90, 25);

        startAttacks();
        progressAttacks(delta);
        immunity -= delta;
        fighting += delta;
        dashCooldown -= delta;

        requestAnimationFrame(animate);
    }
    /* 
    ^^^^ End of game loop ^^^^
    ^^^^ End of game loop ^^^^
    ^^^^ End of game loop ^^^^
    */

    function fairSpawnY(bottom: boolean, bound: number, offset: number) {
        let player = getRectById("player");
        if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
        if (!bottom) {
            if (player.y < bound) return bound + offset;
            else return player.y - offset;
        }
        else {
            if (player.y > canvasHeight - bound) return canvasHeight - bound - offset;
            else return player.y + offset;
        }
    }

    function fairSpawnX(left: boolean, bound: number, offset: number) {
        let player = getRectById("player");
        if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
        if (!left) {
            if (player.x > canvasWidth - bound) return canvasWidth - bound - offset;
            else return player.x + offset;
        }
        else {
            if (player.x < bound) return bound + offset;
            else return player.x - offset;
        }
    }

    function startAttacks() {
        if (fighting >= 0 && attackIndex <= 0) {
            attackIndex++;
            for (let i = 0; i < 10; i++) {
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(false, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(false, 140, 120), 0, 80, "1");
            }
        }
        if (fighting >= 60 && attackIndex <= 1) {
            attackIndex++;
            for (let i = 0; i < 11; i++) {
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(false, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(false, 140, 120), 0, 80, "1");
            }
        }
        if (fighting >= 120 && attackIndex <= 2) {
            attackIndex++;
            for (let i = 0; i < 10; i++) {
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(true, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(true, 140, 120), 0, 80, "1");
            }
        }
        if (fighting >= 180 && attackIndex <= 3) {
            attackIndex++;
            for (let i = 0; i < 11; i++) {
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(true, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(true, 140, 120), 0, 80, "1");
            }
        }
        if (fighting >= 240 && attackIndex <= 4) {
            attackIndex++;
            for (let i = 0; i < 5; i++) {
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 60) / 5 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 60) / 5 * i + 30, 270, 80, "3");
            }
        }
        if (fighting >= 300 && attackIndex <= 5) {
            attackIndex++;
            for (let i = 0; i < 6; i++) {
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 20) / 6 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 20) / 6 * i + 30, 270, 80, "3");
            }
        }
        if (fighting >= 360 && attackIndex <= 6) {
            attackIndex++;
            for (let i = 0; i < 5; i++) {
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 60) / 5 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 60) / 5 * i + 30, 270, 80, "3");
            }
        }
        if (fighting >= 420 && attackIndex <= 7) {
            attackIndex++;
            for (let i = 0; i < 6; i++) {
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 20) / 6 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 20) / 6 * i + 30, 270, 80, "3");
            }
        }
        if (fighting >= 480 && attackIndex <= 8) {
            attackIndex++;
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(false, 200, 180), 6, 50, 0);
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(true, 200, 180), 6, 50, 0);
        }
        if (fighting >= 540 && attackIndex <= 9) {
            attackIndex++;
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(false, 200, 180), 6, 50, 0);
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(true, 200, 180), 6, 50, 0);
        }
        if (fighting >= 600 && attackIndex <= 10) {
            attackIndex++;
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(false, 200, 180), 8, 50, 0);
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(false, 200, 180), 8, 50, 0);
        }
        if (fighting >= 660 && attackIndex <= 11) {
            attackIndex++;
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(true, 200, 180), 8, 50, 0);
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(true, 200, 180), 8, 50, 0);
        }
        if (fighting >= 720 && attackIndex <= 12) {
            attackIndex++;
            const player = getRectById("player");
            if (!player) throw new Error("Player not found. Something has gone horribly wrong.");
            animData.circles.push({
                id: nextFreeNumericId("circle"),
                class: "projectileTelegraph",
                x: player.x,
                y: player.y,
                radius: 30,
                color: "white",
                lineColor: "white",
                lineWidth: 0,
                length: 1,
                xVel: 0,
                yVel: 0,
                animation: "static",
                meta: {
                    projectileID: "4",
                    age: 0,
                    alpha: 0.5
                }
            });
            const x = player.x + player.width / 2;
            const y = player.y + player.height / 2;
            setTimeout(() => { radialBurst(x, y, 16, 50, 4); }, 750);
        }
    }

    function progressAttacks(delta: number) {
        let projectiles: Shape[] = ((getCirclesByClass("projectileHitbox") as Shape[]) || [])
            .concat((getCirclesByClass("projectileTelegraph") as Shape[]) || [])
            .concat((getRectsByClass("projectileHitbox") as Shape[]) || [])
            .concat((getRectsByClass("projectileTelegraph") as Shape[]) || [])
            .concat((getAdvancedPolygonsByClass("projectileHitbox") as Shape[]) || [])
            .concat((getAdvancedPolygonsByClass("projectileTelegraph") as Shape[]) || []);
        if (projectiles.length > 0) {
            projectiles.forEach(projectile => {
                if (projectile.meta.age == undefined) projectile.meta.age = 0;
                projectile.meta.age += delta;
                if (projectile.meta.projectileID == undefined) throw new Error("Projectile has no ID. Something has gone horribly wrong.");
                switch (projectile.meta.projectileID) {
                    case "0":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph") projectile.yVel = -30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else animData[(shapeOf(projectile) + "s") as keyof animData] = animData[(shapeOf(projectile) + "s") as keyof animData].filter(i => i != projectile);
                        }
                        break;
                    case "1":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph") projectile.yVel = 30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else animData[(shapeOf(projectile) + "s") as keyof animData] = animData[(shapeOf(projectile) + "s") as keyof animData].filter(i => i != projectile);
                        }
                        break;
                    case "2":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph") projectile.xVel = -30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else animData[(shapeOf(projectile) + "s") as keyof animData] = animData[(shapeOf(projectile) + "s") as keyof animData].filter(i => i != projectile);
                        }
                        break;
                    case "3":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph") projectile.xVel = 30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else animData[(shapeOf(projectile) + "s") as keyof animData] = animData[(shapeOf(projectile) + "s") as keyof animData].filter(i => i != projectile);
                        }
                        break;
                    case "4":
                        // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                        if (projectile.meta.age > 45) animData[(shapeOf(projectile) + "s") as keyof animData] = animData[(shapeOf(projectile) + "s") as keyof animData].filter(i => i != projectile);
                }
            });
        }
    }

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