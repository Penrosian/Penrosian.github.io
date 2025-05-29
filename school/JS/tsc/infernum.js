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
    function fillPolygon(vertexes, fillColor, strokeColor, strokeWidth) {
        ctx.beginPath();
        vertexes.forEach(function (vertex, index) {
            if (index == 0)
                ctx.moveTo(vertex.x, vertex.y);
            else
                ctx.lineTo(vertex.x, vertex.y);
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
    function map(value, x1, y1, x2, y2) {
        return (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    }
    function getColorCounter() {
        var colors = ["red", "green", "blue", "yellow", "purple", "orange", "pink", "cyan"];
        var color = colors[colorCounter % colors.length];
        colorCounter++;
        return color;
    }
    function vertexesToEdges(vertexes) {
        var edges = [];
        vertexes.forEach(function (vertex, index) {
            if (index == vertexes.length - 1)
                edges.push({ x: vertexes[0].x - vertex.x, y: vertexes[0].y - vertex.y });
            else
                edges.push({ x: vertexes[index + 1].x - vertex.x, y: vertexes[index + 1].y - vertex.y });
        });
        return edges;
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
            rect1Rotated.topRight,
            rect1Rotated.bottomRight,
            rect1Rotated.bottomLeft,
            rect1Rotated.topLeft
        ];
        var rect1Edges = vertexesToEdges(rect1Points);
        var rect2Points = [
            rect2Rotated.topRight,
            rect2Rotated.bottomRight,
            rect2Rotated.bottomLeft,
            rect2Rotated.topLeft
        ];
        var rect2Edges = vertexesToEdges(rect2Points);
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
    function detectRectPolygonCollision(polygon, rect) {
        var rectRotatedPoints = rotatedSquare(rect);
        var rectPoints = [
            rectRotatedPoints.topRight,
            rectRotatedPoints.bottomRight,
            rectRotatedPoints.bottomLeft,
            rectRotatedPoints.topLeft
        ];
        var rectEdges = vertexesToEdges(rectPoints);
        var rectPolygon = { vertex: rectPoints, edge: rectEdges };
        var rotatedVertexes = [];
        polygon.vertexes.forEach(function (vertex) {
            var rotatedVertex = evalPoints(polygon.center.x, polygon.center.y, vertex.x, vertex.y, polygon.meta.rotation || 0);
            rotatedVertexes.push(rotatedVertex);
        });
        return sat({ vertex: rotatedVertexes, edge: vertexesToEdges(rotatedVertexes) }, rectPolygon);
    }
    function detectPolygonCollision(polygon1, polygon2) {
        var rotatedVertexes1 = [];
        polygon1.vertexes.forEach(function (vertex) {
            var rotatedVertex = evalPoints(polygon1.center.x, polygon1.center.y, vertex.x, vertex.y, polygon1.meta.rotation || 0);
            rotatedVertexes1.push(rotatedVertex);
        });
        var rotatedVertexes2 = [];
        polygon2.vertexes.forEach(function (vertex) {
            var rotatedVertex = evalPoints(polygon2.center.x, polygon2.center.y, vertex.x, vertex.y, polygon2.meta.rotation || 0);
            rotatedVertexes2.push(rotatedVertex);
        });
        var polygon1Edges = vertexesToEdges(rotatedVertexes1);
        var polygon2Edges = vertexesToEdges(rotatedVertexes2);
        return sat({ vertex: rotatedVertexes1, edge: polygon1Edges }, { vertex: rotatedVertexes2, edge: polygon2Edges });
    }
    function detectCollision(shape1, shape2) {
        if (isCircle(shape1) && isCircle(shape2))
            return detectCircleCollision(shape1, shape2);
        else if (isCircle(shape1) && isRect(shape2))
            return detectCircleRectCollision(shape1, shape2);
        else if (isRect(shape1) && isCircle(shape2))
            return detectCircleRectCollision(shape2, shape1);
        else if (isRect(shape1) && isRect(shape2))
            return detectRectangleCollision(shape1, shape2);
        else if (isAdvancedPolygon(shape1) && isAdvancedPolygon(shape2))
            return detectPolygonCollision(shape1, shape2);
        else if (isAdvancedPolygon(shape1) && isRect(shape2))
            return detectRectPolygonCollision(shape1, shape2);
        else if (isRect(shape1) && isAdvancedPolygon(shape2))
            return detectRectPolygonCollision(shape2, shape1);
        else
            throw new Error("Unsupported collision type. " + JSON.stringify(shape1) + ", " + JSON.stringify(shape2));
    }
    // Projectiles
    function lightSword(x, y, rotation, damage, projectileID) {
        var sword = {
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
        var telegraph = {
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
        var player = getRectById("player");
        if (!player)
            throw new Error("Player not found. Something has gone horribly wrong.");
        for (var i = 0; i < 40; i++) {
            lightSword(i * (canvasWidth / 40), player.y + 60, 180, 10000, "0");
            lightSword(i * (canvasWidth / 40), player.y - 60, 0, 10000, "1");
        }
    }
    function lightBall(x, y, radius, damage, projectileID) {
        var ball = {
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
    function radialBurst(x, y, count, damage, rotation) {
        if (count < 1)
            throw new Error("Count must be at least 1.");
        var angleStep = 360 / count;
        var telegraphID = nextFreeNumericId("projectile");
        for (var i = 0; i < count; i++) {
            var angle = i * angleStep + rotation - 90; // Telegraph angles were offset by 90 degrees and I don't know why
            var telegraphX = x;
            var telegraphY = y;
            var telegraph = {
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
        setTimeout(function () {
            var telegraphs = getProjectilePartsById(telegraphID);
            if (telegraphs)
                animData.rects = animData.rects.filter(function (a) { return !telegraphs.includes(a); });
            for (var i = 0; i < count; i++) {
                var projectileID = nextFreeNumericId("projectile");
                var angle = i * angleStep + rotation;
                var vector = { x: Math.cos(angle * Math.PI / 180) * 20, y: Math.sin(angle * Math.PI / 180) * 20 };
                var xVel = vector.x;
                var yVel = vector.y;
                lightBall(x, y, 5, damage, projectileID);
                var balls = getProjectilePartsById(projectileID);
                if (!balls)
                    throw new Error("Projectile not found after creation.");
                var ball = balls[0];
                if (ball) {
                    ball.xVel = xVel;
                    ball.yVel = yVel;
                }
            }
        }, 750);
    }
    function verticalDeathRay(x, width, damage, projectileID, color) {
        if (color === void 0) { color = getColorCounter(); }
        var ground = getRectById("ground");
        if (!ground)
            throw new Error("Ground not found. Something has gone horribly wrong.");
        var telegraphID = nextFreeNumericId("projectile");
        var telegraph = {
            id: nextFreeNumericId("rect"),
            class: "projectileTelegraph",
            x: x,
            y: 0,
            width: width,
            height: canvasHeight - ground.height,
            color: "white",
            animation: "static",
            xVel: 0,
            yVel: 0,
            meta: {
                projectileID: telegraphID,
                alpha: 0.5
            }
        };
        var deathRay = {
            id: nextFreeNumericId("rect"),
            class: "projectileHitbox",
            x: x,
            y: 0,
            width: width,
            height: canvasHeight - ground.height,
            color: color,
            animation: "static",
            xVel: 0,
            yVel: 0,
            meta: {
                damage: damage,
                projectileID: projectileID
            }
        };
        animData.rects.push(telegraph);
        setTimeout(function () {
            animData.rects.push(deathRay);
            var telegraphs = getProjectilePartsById(telegraphID);
            if (!telegraphs)
                throw new Error("Telegraph not found after creation.");
            var telegraph = telegraphs[0];
            animData.rects = animData.rects.filter(function (a) { return a != telegraph; });
        }, 750);
    }
    function horizontalDeathRay(y, height, damage, projectileID, color) {
        if (color === void 0) { color = getColorCounter(); }
        var telegraphID = nextFreeNumericId("projectile");
        var telegraph = {
            id: nextFreeNumericId("rect"),
            class: "projectileTelegraph",
            x: 0,
            y: y,
            width: canvasWidth,
            height: height,
            color: "white",
            animation: "static",
            xVel: 0,
            yVel: 0,
            meta: {
                projectileID: telegraphID,
                alpha: 0.5
            }
        };
        var deathRay = {
            id: nextFreeNumericId("rect"),
            class: "projectileHitbox",
            x: 0,
            y: y,
            width: canvasWidth,
            height: height,
            color: color,
            animation: "static",
            xVel: 0,
            yVel: 0,
            meta: {
                damage: damage,
                projectileID: projectileID
            }
        };
        animData.rects.push(telegraph);
        setTimeout(function () {
            animData.rects.push(deathRay);
            var telegraphs = getProjectilePartsById(telegraphID);
            if (!telegraphs)
                throw new Error("Telegraph not found after creation.");
            var telegraph = telegraphs[0];
            animData.rects = animData.rects.filter(function (a) { return a != telegraph; });
        }, 750);
    }
    function theSun(x, y, damage, projectileID) {
        var spawnTelegraphID = nextFreeNumericId("projectile");
        var spawnTelegraph = {
            id: nextFreeNumericId("circle"),
            class: "projecitleTelegraph",
            x: x,
            y: y,
            radius: 120,
            color: "white",
            animation: "static",
            xVel: 0,
            yVel: 0,
            length: 1,
            lineColor: "white",
            lineWidth: 0,
            meta: {
                projectileID: spawnTelegraphID,
                alpha: 0.5
            }
        };
        var sunID = nextFreeNumericId("circle");
        var sun = {
            id: sunID,
            class: "projectileHitbox",
            x: x,
            y: y,
            radius: 0,
            color: "orange",
            animation: "static",
            xVel: 0,
            yVel: 0,
            length: 1,
            lineColor: "white",
            lineWidth: 0,
            meta: {
                projectileID: projectileID,
                damage: damage
            }
        };
        animData.circles.push(spawnTelegraph);
        setTimeout(function () {
            animData.circles.push(sun);
            var sun2 = getCircleById(sunID);
            if (!sun2)
                throw new Error("Sun not found after creation.");
            var spawnTelegraphs = getProjectilePartsById(spawnTelegraphID);
            if (!spawnTelegraphs)
                throw new Error("Telegraph not found after creation.");
            var spawnTelegraph = spawnTelegraphs[0];
            animData.circles = animData.circles.filter(function (a) { return a != spawnTelegraph; });
            intervalCounters["icSunSpawn"] = 0;
            intervalCounters["idSunSpawn"] = setInterval(function () {
                intervalCounters["icSunSpawn"]++;
                sun2.radius = map(intervalCounters["icSunSpawn"], 0, 250, 0, 120);
                if (intervalCounters["icSunSpawn"] >= 250)
                    clearInterval(intervalCounters["idSunSpawn"]);
            }, 1);
            intervalCounters["icSunRay"] = 0;
            intervalCounters["idSunRay"] = setInterval(function () {
                intervalCounters["icSunRay"]++;
                if (intervalCounters["icSunRay"] % 2 == 0)
                    verticalDeathRay(sun2.x - 60, 120, 100, "5", "#FFE135");
                else
                    horizontalDeathRay(sun2.y - 60, 120, 100, "5", "#FFE135");
                radialBurst(sun2.x, sun2.y, 24, 100, intervalCounters["icSunRay"] * 3.75);
                setTimeout(function () { radialBurst(sun2.x, sun2.y, 24, 100, intervalCounters["icSunRay"] * 3.75); }, 100);
                setTimeout(function () { radialBurst(sun2.x, sun2.y, 24, 100, intervalCounters["icSunRay"] * 3.75); }, 200);
                if (intervalCounters["icSunRay"] >= 4) {
                    clearInterval(intervalCounters["idSunRay"]);
                    var deathTelegraphID_1 = nextFreeNumericId("projectile");
                    setTimeout(function () {
                        intervalCounters["icSunDeath"] = 0;
                        intervalCounters["idSunDeath"] = setInterval(function () {
                            intervalCounters["icSunDeath"]++;
                            if (intervalCounters["icSunDeath"] == 1) {
                                var deathTelegraph = {
                                    id: nextFreeNumericId("circle"),
                                    class: "projectileTelegraph",
                                    x: sun2.x,
                                    y: sun2.y,
                                    radius: 480,
                                    color: "white",
                                    animation: "static",
                                    xVel: 0,
                                    yVel: 0,
                                    length: 1,
                                    lineColor: "white",
                                    lineWidth: 0,
                                    meta: {
                                        projectileID: deathTelegraphID_1,
                                        alpha: 0.5
                                    }
                                };
                                animData.circles.push(deathTelegraph);
                            }
                            else if (intervalCounters["icSunDeath"] == 250) {
                                var deathTelegraphs = getProjectilePartsById(deathTelegraphID_1);
                                if (!deathTelegraphs)
                                    throw new Error("Death telegraph not found after creation.");
                                var deathTelegraph_1 = deathTelegraphs[0];
                                animData.circles = animData.circles.filter(function (a) { return a != deathTelegraph_1; });
                            }
                            else if (intervalCounters["icSunDeath"] >= 250 && intervalCounters["icSunDeath"] < 500)
                                sun2.radius = map(intervalCounters["icSunDeath"], 250, 499, 120, 480);
                            else if (intervalCounters["icSunDeath"] >= 500 && intervalCounters["icSunDeath"] < 750)
                                sun2.radius = map(intervalCounters["icSunDeath"], 500, 749, 480, 0);
                            else if (intervalCounters["icSunDeath"] >= 750) {
                                clearInterval(intervalCounters["idSunDeath"]);
                                animData.circles = animData.circles.filter(function (a) { return a != sun2; });
                            }
                        }, 1);
                    }, 1000);
                }
            }, 1000);
        }, 1000);
    }
    function darkBomb(x, y, vector, count, fcount) {
        var telegraphID = nextFreeNumericId("projectile");
        var telegraph = {
            id: nextFreeNumericId("rect"),
            class: "projectileTelegraph",
            x: x - 60,
            y: y - 60,
            width: 120,
            height: 1500,
            animation: "static",
            xVel: 0,
            yVel: 0,
            color: "white",
            meta: {
                rotationCenter: { x: x, y: y },
                alpha: 0.5,
                rotation: Math.atan(vector.x / -vector.y) * 180 / Math.PI,
                projectileID: telegraphID
            }
        };
        vector = normalizeVector(vector.x, vector.y, 20);
        var blackHole = {
            id: nextFreeNumericId("circle"),
            class: "projectileHitbox",
            x: x,
            y: y,
            radius: 60,
            length: 1,
            animation: "custom",
            xVel: vector.x,
            yVel: vector.y,
            color: "black",
            lineColor: "white",
            lineWidth: 5,
            meta: {
                damage: 100,
                projectileID: "darkBomb"
            }
        };
        animData.rects.push(telegraph);
        setTimeout(function () {
            animData.circles.push(blackHole);
            var telegraphs = getProjectilePartsById(telegraphID);
            if (!telegraphs)
                throw new Error("Telegraph not found after creation.");
            var telegraph = telegraphs[0];
            animData.rects = animData.rects.filter(function (a) { return a != telegraph; });
            intervalCounters["idDarkBomb"] = setInterval(function () {
                var darkBomb = getCircleById(blackHole.id);
                if (!darkBomb) {
                    console.log("boom");
                    console.log(intervalCounters["exDarkBomb"]);
                    clearInterval(intervalCounters["idDarkBomb"]);
                    for (var i = 0; i < fcount; i++) {
                        setTimeout(function () {
                            console.log("radial burst");
                            radialBurst(intervalCounters["exDarkBomb"].x, intervalCounters["exDarkBomb"].y, count, 100, 0);
                        }, i * 100);
                    }
                    var explosionID = nextFreeNumericId("projectile");
                    var explosion_1 = {
                        id: nextFreeNumericId("circle"),
                        class: "projectileHitbox",
                        x: intervalCounters["exDarkBomb"].x,
                        y: intervalCounters["exDarkBomb"].y,
                        radius: 0,
                        length: 1,
                        animation: "static",
                        xVel: 0,
                        yVel: 0,
                        color: "purple",
                        lineColor: "white",
                        lineWidth: 0,
                        meta: {
                            damage: 100,
                            projectileID: explosionID
                        }
                    };
                    animData.circles.push(explosion_1);
                    intervalCounters["icDarkExplosion"] = 0;
                    intervalCounters["idDarkExplosion"] = setInterval(function () {
                        intervalCounters["icDarkExplosion"]++;
                        if (intervalCounters["icDarkExplosion"] < 125)
                            explosion_1.radius = map(intervalCounters["icDarkExplosion"], 0, 124, 0, 120);
                        else if (intervalCounters["icDarkExplosion"] < 250)
                            explosion_1.radius = map(intervalCounters["icDarkExplosion"], 125, 249, 120, 0);
                        else if (intervalCounters["icDarkExplosion"] >= 250) {
                            clearInterval(intervalCounters["idDarkExplosion"]);
                            animData.circles = animData.circles.filter(function (a) { return a != explosion_1; });
                        }
                    }, 2);
                }
            }, 1);
        }, 500);
    }
    function flashbang() {
        var flashbangID = nextFreeNumericId("rect");
        animData.rects.push({
            id: flashbangID,
            class: "flashbang",
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            color: "black",
            animation: "static",
            xVel: 0,
            yVel: 0,
            meta: {
                noDraw: true,
                postDraw: true,
                alpha: 1
            }
        });
        intervalCounters["icFlashbang"] = 0;
        intervalCounters["idFlashbang"] = setInterval(function () {
            intervalCounters["icFlashbang"]++;
            var flashbang = getRectById(flashbangID);
            if (!flashbang) {
                throw new Error("Flashbang not found after creation.");
            }
            if (intervalCounters["icFlashbang"] < 500)
                flashbang.meta["alpha"] = map(intervalCounters["icFlashbang"], 0, 500, 1, 0.5);
            else {
                clearInterval(intervalCounters["idFlashbang"]);
                animData.rects = animData.rects.filter(function (a) { return a.id != flashbangID; });
            }
        }, 4);
    }
    function normalizeVector(x, y, targetMagnitude) {
        var magnitude = Math.sqrt(x * x + y * y);
        if (magnitude == 0)
            return { x: 0, y: 0 };
        return { x: (x / magnitude) * targetMagnitude, y: (y / magnitude) * targetMagnitude };
    }
    ;
    var animData = {
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
    var stars = [{
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
    stars.forEach(function (star) { return animData.rects.push(star); });
    var binds = {
        left: "KeyA",
        right: "KeyD",
        jump: "Space",
        dash: "ShiftLeft"
    };
    var pressed = [];
    var health = 920;
    var immunity = 0;
    var gameStatus = ".........";
    var element;
    var debug = false;
    var fighting = -3030;
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
    var attackIndex = 0;
    var regenTime = 0;
    var regenCounter = 0;
    var gameOver = false;
    var gameOverTime = 0;
    var colorCounter = 0;
    var intervalCounters = {};
    // Expose variables to the global scope for debugging
    window.animData = animData;
    window.debug = debug;
    window.gameStatus = gameStatus;
    window.health = health;
    window.immunity = immunity;
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
    window.getAdvancedPolygonById = getAdvancedPolygonById;
    window.getAdvancedPolygonsByClass = getAdvancedPolygonsByClass;
    window.getProjectilePartsById = getProjectilePartsById;
    window.lightSword = lightSword;
    window.execution = execution;
    window.lightBall = lightBall;
    window.radialBurst = radialBurst;
    window.normalizeVector = normalizeVector;
    window.movePolygon = movePolygon;
    window.isRect = isRect;
    window.isCircle = isCircle;
    window.isAdvancedPolygon = isAdvancedPolygon;
    window.shapeOf = shapeOf;
    window.fillPolygon = fillPolygon;
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
    function getAdvancedPolygonById(id) {
        var returns = false;
        animData.advancedPolygons.forEach(function (advancedPolygon) { if (advancedPolygon.id == id)
            returns = advancedPolygon; });
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
    function getAdvancedPolygonsByClass(className) {
        var returns = [];
        animData.advancedPolygons.forEach(function (advancedPolygon) { if (advancedPolygon.class == className)
            returns.push(advancedPolygon); });
        if (returns.length == 0)
            return false;
        return returns;
    }
    function getProjectilePartsById(id) {
        var returns = [];
        animData.rects.forEach(function (rect) { if (rect.meta.projectileID == id)
            returns.push(rect); });
        animData.circles.forEach(function (circle) { if (circle.meta.projectileID == id)
            returns.push(circle); });
        animData.advancedPolygons.forEach(function (advancedPolygon) { if (advancedPolygon.meta.projectileID == id)
            returns.push(advancedPolygon); });
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
            if (shape == "advancedPolygon" && !getAdvancedPolygonById(x))
                return x;
            if (shape == "projectile" && !getProjectilePartsById(x))
                return x;
        }
    }
    function movePolygon(polygon, x, y) {
        polygon.vertexes.forEach(function (vertex) {
            vertex.x += x;
            vertex.y += y;
        });
        polygon.center.x += x;
        polygon.center.y += y;
    }
    function isRect(shape) {
        return shape.width != undefined;
    }
    function isCircle(shape) {
        return shape.radius != undefined;
    }
    function isAdvancedPolygon(shape) {
        return shape.vertexes != undefined;
    }
    function shapeOf(shape) {
        if (isRect(shape))
            return "rect";
        else if (isCircle(shape))
            return "circle";
        else
            return "advancedPolygon";
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
                element.play().then(function () { }, function () { return alert("Please enable autoplay for this site. This game features music-sync, so precise audio timing is required."); });
            }
            ;
        }
        frame++;
        var delta = (timestamp - lastFrameTime) / 16.75;
        lastFrameTime = timestamp;
        framerate = 1000 / (delta * (50 / 3));
        if (fighting > 0)
            gameStatus = "Survive";
        if (gameOver) {
            gameOverTime += delta;
            var player_1 = getRectById("player");
            if (!player_1)
                throw new Error("Player not found. Something has gone horribly wrong.");
            if (gameOverTime > 60)
                fillPage("black");
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
                animData.rects = animData.rects.filter(function (a) { return a.class == "player" || a.class == "ground" || a.class == "healthBarBackground" || a.class == "healthBar" || a.class == "star"; });
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
        var postDraws = [];
        var _loop_1 = function (i) {
            var rect = animData.rects[i];
            ctx.save();
            if (rect.meta["rotation"] != undefined) {
                var translateX = rect.meta["rotationCenter"] ? rect.meta["rotationCenter"].x : rect.x + rect.width / 2;
                var translateY = rect.meta["rotationCenter"] ? rect.meta["rotationCenter"].y : rect.y + rect.height / 2;
                ctx.translate(translateX, translateY);
                ctx.rotate(rect.meta["rotation"] * Math.PI / 180);
                ctx.translate(-translateX, -translateY);
            }
            ctx.globalAlpha = rect.meta["alpha"] != undefined ? rect.meta["alpha"] : 1;
            if (!rect.meta["noDraw"])
                fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
            if (rect.meta["postDraw"])
                postDraws.push(rect);
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
                    animData.rects = animData.rects.filter(function (i) { return i != rect; });
            }
        };
        for (var i = 0; i < animData.rects.length; i++) {
            _loop_1(i);
        }
        var _loop_2 = function (i) {
            var circle = animData.circles[i];
            ctx.save();
            if (circle.meta["rotation"] != undefined) {
                var translateX = circle.meta["rotationCenter"] ? circle.meta["rotationCenter"].x : circle.x;
                var translateY = circle.meta["rotationCenter"] ? circle.meta["rotationCenter"].y : circle.y;
                ctx.translate(translateX, translateY);
                ctx.rotate(circle.meta["rotation"] * Math.PI / 180);
                ctx.translate(-translateX, -translateY);
            }
            ctx.globalAlpha = circle.meta["alpha"] != undefined ? circle.meta["alpha"] : 1;
            if (!circle.meta["noDraw"])
                fillCircle(circle.x, circle.y, circle.radius, circle.color, circle.lineColor, circle.lineWidth, circle.length);
            if (circle.meta["postDraw"])
                postDraws.push(circle);
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
        var _loop_3 = function (i) {
            var polygon = animData.advancedPolygons[i];
            ctx.save();
            if (polygon.meta["rotation"] != undefined) {
                ctx.translate(polygon.center.x, polygon.center.y);
                ctx.rotate(polygon.meta["rotation"] * Math.PI / 180);
                ctx.translate(-polygon.center.x, -polygon.center.y);
            }
            ctx.globalAlpha = polygon.meta["alpha"] != undefined ? polygon.meta["alpha"] : 1;
            if (!polygon.meta["noDraw"])
                fillPolygon(polygon.vertexes, polygon.color, polygon.lineColor, polygon.lineWidth);
            if (polygon.meta["postDraw"])
                postDraws.push(polygon);
            ctx.restore();
            // Different animation styles move in different ways
            if (polygon.animation == "bounce") {
                polygon.vertexes.forEach(function (vertex) {
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
                polygon.vertexes.forEach(function (vertex) {
                    if (vertex.x > canvasWidth)
                        movePolygon(polygon, canvasWidth - vertex.x, 0);
                    if (vertex.x < 0)
                        movePolygon(polygon, -vertex.x, 0);
                    if (vertex.y > canvasHeight)
                        movePolygon(polygon, 0, canvasHeight - vertex.y);
                    if (vertex.y < 0)
                        movePolygon(polygon, 0, -vertex.y);
                });
            }
            if (polygon.animation == "exitKill") {
                var counter_1 = 0;
                polygon.vertexes.forEach(function (vertex) { if (vertex.x > canvasWidth || vertex.x < 0 || vertex.y > canvasHeight || vertex.y < 0)
                    counter_1++; });
                if (counter_1 >= polygon.vertexes.length)
                    animData.advancedPolygons = animData.advancedPolygons.filter(function (i) { return i != polygon; });
            }
            if (polygon.animation != "static")
                movePolygon(polygon, polygon.xVel * delta, polygon.yVel * delta);
        };
        // They are called advanced polygons for a reason
        for (var i = 0; i < animData.advancedPolygons.length; i++) {
            _loop_3(i);
        }
        postDraws.forEach(function (shape) {
            ctx.save();
            if (shapeOf(shape) == "rect") {
                var rect = shape;
                if (rect.meta["rotation"] != undefined) {
                    var translateX = rect.meta["rotationCenter"] ? rect.meta["rotationCenter"].x : rect.x + rect.width / 2;
                    var translateY = rect.meta["rotationCenter"] ? rect.meta["rotationCenter"].y : rect.y + rect.height / 2;
                    ctx.translate(translateX, translateY);
                    ctx.rotate(rect.meta["rotation"] * Math.PI / 180);
                    ctx.translate(-translateX, -translateY);
                }
                ctx.globalAlpha = rect.meta["alpha"] != undefined ? rect.meta["alpha"] : 1;
                fillRect(rect.x, rect.y, rect.width, rect.height, rect.color);
            }
            else if (shapeOf(shape) == "circle") {
                var circle = shape;
                if (circle.meta["rotation"] != undefined) {
                    var translateX = circle.meta["rotationCenter"] ? circle.meta["rotationCenter"].x : circle.x;
                    var translateY = circle.meta["rotationCenter"] ? circle.meta["rotationCenter"].y : circle.y;
                    ctx.translate(translateX, translateY);
                    ctx.rotate(circle.meta["rotation"] * Math.PI / 180);
                    ctx.translate(-translateX, -translateY);
                }
                ctx.globalAlpha = circle.meta["alpha"] != undefined ? circle.meta["alpha"] : 1;
                fillCircle(circle.x, circle.y, circle.radius, circle.color, circle.lineColor, circle.lineWidth, circle.length);
            }
            else if (shapeOf(shape) == "advancedPolygon") {
                var polygon = shape;
                if (polygon.meta["rotation"] != undefined) {
                    ctx.translate(polygon.center.x, polygon.center.y);
                    ctx.rotate(polygon.meta["rotation"] * Math.PI / 180);
                    ctx.translate(-polygon.center.x, -polygon.center.y);
                }
                ctx.globalAlpha = polygon.meta["alpha"] != undefined ? polygon.meta["alpha"] : 1;
                fillPolygon(polygon.vertexes, polygon.color, polygon.lineColor, polygon.lineWidth);
            }
            ctx.restore();
        });
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
            if (player.yVel > 0)
                player.yVel = 0;
        }
        var projectiles = (getCirclesByClass("projectileHitbox") || []).concat(getRectsByClass("projectileHitbox") || []).concat(getAdvancedPolygonsByClass("projectileHitbox") || []);
        if (projectiles.length > 0) {
            for (var i = 0; i < projectiles.length; i++) {
                var projectile = projectiles[i];
                if (detectCollision(player, projectile) && immunity <= 0) {
                    immunity = 30;
                    if (projectile.meta.damage == undefined)
                        throw new Error("Projectile has no damage value. Something has gone horribly wrong.");
                    health -= projectile.meta.damage;
                    regenTime = 0;
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
            pressed = pressed.filter(function (a) { return ![-1, "KeyP", "KeyE", "KeyN"].includes(a); });
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
        if (multiPressed(["KeyE", "KeyX", "KeyC"]) && debug) {
            pressed = pressed.filter(function (a) { return ![-1, "KeyE", "KeyX", "KeyC"].includes(a); });
            execution();
        }
        if (multiPressed(["KeyS", "KeyT", "KeyA"]) && debug) {
            pressed = pressed.filter(function (a) { return ![-1, "KeyS", "KeyT", "KeyA"].includes(a); });
            fighting = -330;
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
        element = document.getElementById("debug");
        if (element && debug) {
            element.innerHTML = "Player: " + Math.round(100 * player.x) / 100 + ", " + Math.round(100 * player.y) / 100 + " | Health: " + health;
        }
        if (capturing) {
            if (pressed.length > 0) {
                binds[swapBind] = pressed[0];
                capturing = false;
                pressed = [];
            }
        }
        player.xVel -= (player.xVel / 6) * delta;
        if (Math.abs(player.xVel) < 0.1)
            player.xVel = 0;
        if (player.yVel < 10 && !detectCollision(player, ground))
            player.yVel += 0.2 * delta;
        if (player.yVel < -7)
            player.yVel = -7;
        if (Math.abs(player.yVel) < 0.1)
            player.yVel = 0;
        // Why is Terraria health regeneration so complicated
        // I also could have just used a simple timer, but this is more accurate to the game so idc
        if (health < 920) {
            var effectiveRegenTime = void 0;
            var movementModifer = void 0;
            if (regenTime > 3600)
                regenTime = 3600;
            if (regenTime <= 1800)
                effectiveRegenTime = Math.floor(regenTime / 300);
            else
                effectiveRegenTime = 6 + (Math.floor((regenTime - 1800) / 600));
            if (regenTime >= 40 && regenTime < 1800)
                regenTime = 1800;
            if (player.xVel == 0 && player.yVel == 0)
                movementModifer = 6.25;
            else
                movementModifer = 0.5;
            regenCounter += Math.round(0.5 * (((23 / 10 * 0.85 + 0.15) * effectiveRegenTime * movementModifer * 1.1) + 11.2)) * delta;
            regenTime += delta;
            health += Math.floor(regenCounter / 120);
            regenCounter -= Math.floor(regenCounter / 120) * 120;
            if (health > 920)
                health = 920;
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
        var healthBar = getRectById("healthBar");
        if (!healthBar)
            throw new Error("Health bar not found. Something has gone horribly wrong.");
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
    function fairSpawnY(bottom, bound, offset) {
        var player = getRectById("player");
        if (!player)
            throw new Error("Player not found. Something has gone horribly wrong.");
        if (!bottom) {
            if (player.y < bound)
                return bound + offset;
            else
                return player.y - offset;
        }
        else {
            if (player.y > canvasHeight - bound)
                return canvasHeight - bound - offset;
            else
                return player.y + offset;
        }
    }
    function fairSpawnX(left, bound, offset) {
        var player = getRectById("player");
        if (!player)
            throw new Error("Player not found. Something has gone horribly wrong.");
        if (!left) {
            if (player.x > canvasWidth - bound)
                return canvasWidth - bound - offset;
            else
                return player.x + offset;
        }
        else {
            if (player.x < bound)
                return bound + offset;
            else
                return player.x - offset;
        }
    }
    function startAttacks() {
        var player = getRectById("player");
        if (!player)
            throw new Error("Player not found. Something has gone horribly wrong.");
        if (fighting >= 0 && attackIndex <= 0) {
            attackIndex++;
            for (var i = 0; i < 10; i++) {
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(false, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(false, 140, 120), 0, 80, "1");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 60 && attackIndex <= 1) {
            attackIndex++;
            for (var i = 0; i < 11; i++) {
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(false, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(false, 140, 120), 0, 80, "1");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 120 && attackIndex <= 2) {
            attackIndex++;
            for (var i = 0; i < 10; i++) {
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(true, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 60) / 10 * i + 30, fairSpawnY(true, 140, 120), 0, 80, "1");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 180 && attackIndex <= 3) {
            attackIndex++;
            for (var i = 0; i < 11; i++) {
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(true, 140, 120), 180, 80, "0");
                lightSword((canvasWidth - 20) / 11 * i + 10, fairSpawnY(true, 140, 120), 0, 80, "1");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 240 && attackIndex <= 4) {
            attackIndex++;
            for (var i = 0; i < 5; i++) {
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 60) / 5 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 60) / 5 * i + 30, 270, 80, "3");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 300 && attackIndex <= 5) {
            attackIndex++;
            for (var i = 0; i < 6; i++) {
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 20) / 6 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(false, 140, 120), (canvasHeight - 20) / 6 * i + 30, 270, 80, "3");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 360 && attackIndex <= 6) {
            attackIndex++;
            for (var i = 0; i < 5; i++) {
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 60) / 5 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 60) / 5 * i + 30, 270, 80, "3");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 420 && attackIndex <= 7) {
            attackIndex++;
            for (var i = 0; i < 6; i++) {
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 20) / 6 * i + 30, 90, 80, "2");
                lightSword(fairSpawnX(true, 140, 120), (canvasHeight - 20) / 6 * i + 30, 270, 80, "3");
            }
            lightSword(player.x + 200, player.y, 90, 80, "2");
            lightSword(player.x - 200, player.y, 270, 80, "3");
            lightSword(player.x, player.y - 200, 0, 80, "1");
            lightSword(player.x, player.y + 200, 180, 80, "0");
        }
        if (fighting >= 480 && attackIndex <= 8) {
            attackIndex++;
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(false, 200, 180), 8, 50, 0);
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(true, 200, 180), 8, 50, 0);
        }
        if (fighting >= 540 && attackIndex <= 9) {
            attackIndex++;
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(false, 200, 180), 8, 50, 0);
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(true, 200, 180), 8, 50, 0);
        }
        if (fighting >= 600 && attackIndex <= 10) {
            attackIndex++;
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(false, 200, 180), 12, 50, 0);
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(false, 200, 180), 12, 50, 0);
        }
        if (fighting >= 660 && attackIndex <= 11) {
            attackIndex++;
            radialBurst(fairSpawnX(false, 200, 180), fairSpawnY(true, 200, 180), 12, 50, 0);
            radialBurst(fairSpawnX(true, 200, 180), fairSpawnY(true, 200, 180), 12, 50, 0);
        }
        if (fighting >= 720 && attackIndex <= 12) {
            attackIndex++;
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
            var x_1 = player.x + player.width / 2;
            var y_1 = player.y + player.height / 2;
            setTimeout(function () { radialBurst(x_1, y_1, 24, 50, 4); }, 750);
        }
        if (fighting >= 840 && attackIndex <= 13) {
            attackIndex++;
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
            var x_2 = player.x + player.width / 2;
            var y_2 = player.y + player.height / 2;
            setTimeout(function () { radialBurst(x_2, y_2, 16, 50, 4); }, 750);
        }
        if (fighting >= 960 && attackIndex <= 14) {
            attackIndex++;
            verticalDeathRay(-10, canvasWidth / 5 + 20, 100, "5");
            intervalCounters["ic1"] = 0;
            intervalCounters["id1"] = setInterval(function () {
                intervalCounters["ic1"]++;
                verticalDeathRay(canvasWidth * intervalCounters["ic1"] / 5 - 10, canvasWidth / 5 + 20, 100, "5");
                if (intervalCounters["ic1"] == 4)
                    clearInterval(intervalCounters["id1"]);
            }, 750);
        }
        if (fighting >= 1200 && attackIndex <= 15) {
            attackIndex++;
            horizontalDeathRay(-20, canvasHeight / 2 + 40, 100, "5");
        }
        if (fighting >= 1260 && attackIndex <= 16) {
            attackIndex++;
            horizontalDeathRay(canvasHeight / 2 - 20, canvasHeight / 2 + 40, 100, "5");
        }
        if (fighting >= 1320 && attackIndex <= 17) {
            attackIndex++;
            theSun(canvasWidth / 2, canvasHeight / 2, 100, nextFreeNumericId("projectile"));
        }
        if (fighting >= 1860 && attackIndex <= 18) {
            attackIndex++;
            var telegraphID_1 = nextFreeNumericId("projectile");
            var telegraph = {
                id: nextFreeNumericId("rect"),
                class: "projectileTelegraph",
                x: canvasWidth / 2,
                y: 0,
                width: canvasWidth / 2,
                height: canvasHeight,
                color: "white",
                animation: "static",
                xVel: 0,
                yVel: 0,
                meta: {
                    projectileID: telegraphID_1,
                    alpha: 0.5
                }
            };
            animData.rects.push(telegraph);
            setTimeout(function () {
                var telegraphs = getProjectilePartsById(telegraphID_1);
                if (!telegraphs)
                    throw new Error("Telegraph not found after creation.");
                var telegraph = telegraphs[0];
                animData.rects = animData.rects.filter(function (a) { return a != telegraph; });
                verticalDeathRay(canvasWidth / 2, canvasWidth / 2, 100, "5");
                radialBurst(canvasWidth / 4, canvasHeight / 4, 6, 60, 0);
                radialBurst(canvasWidth / 4, canvasHeight * 3 / 4, 6, 60, 0);
            }, 500);
        }
        if (fighting >= 1950 && attackIndex <= 19) {
            attackIndex++;
            var telegraphID_2 = nextFreeNumericId("projectile");
            var telegraph = {
                id: nextFreeNumericId("rect"),
                class: "projectileTelegraph",
                x: 0,
                y: 0,
                width: canvasWidth / 2,
                height: canvasHeight,
                color: "white",
                animation: "static",
                xVel: 0,
                yVel: 0,
                meta: {
                    projectileID: telegraphID_2,
                    alpha: 0.5
                }
            };
            animData.rects.push(telegraph);
            setTimeout(function () {
                var telegraphs = getProjectilePartsById(telegraphID_2);
                if (!telegraphs)
                    throw new Error("Telegraph not found after creation.");
                var telegraph = telegraphs[0];
                animData.rects = animData.rects.filter(function (a) { return a != telegraph; });
                verticalDeathRay(0, canvasWidth / 2, 100, "5");
                radialBurst(canvasWidth * 3 / 4, canvasHeight / 4, 6, 60, 0);
                radialBurst(canvasWidth * 3 / 4, canvasHeight * 3 / 4, 6, 60, 0);
            }, 500);
        }
        if (fighting >= 2040 && attackIndex <= 20) {
            attackIndex++;
            darkBomb(canvasWidth, 0, { x: -1, y: 1 }, 16, 5);
        }
        if (fighting >= 2160 && attackIndex <= 21) {
            attackIndex++;
            radialBurst(canvasWidth / 2, canvasHeight / 2, 24, 80, 0);
        }
        if (fighting >= 2220 && attackIndex <= 22) {
            attackIndex++;
            radialBurst(canvasWidth / 2, canvasHeight / 2, 16, 90, 0);
        }
        if (fighting >= 2280 && attackIndex <= 23) {
            attackIndex++;
            radialBurst(canvasWidth / 2, canvasHeight / 2, 12, 100, 0);
        }
        if (fighting >= 2340 && attackIndex <= 24) {
            attackIndex++;
            radialBurst(canvasWidth / 2, canvasHeight / 2, 30, 50, 0);
        }
        if (fighting >= 2420 && attackIndex <= 25) {
            attackIndex++;
            radialBurst(canvasWidth / 2, canvasHeight / 2, 24, 60, 0);
            setTimeout(function () { flashbang(); }, 250);
        }
    }
    function progressAttacks(delta) {
        var projectiles = (getCirclesByClass("projectileHitbox") || [])
            .concat(getCirclesByClass("projectileTelegraph") || [])
            .concat(getRectsByClass("projectileHitbox") || [])
            .concat(getRectsByClass("projectileTelegraph") || [])
            .concat(getAdvancedPolygonsByClass("projectileHitbox") || [])
            .concat(getAdvancedPolygonsByClass("projectileTelegraph") || []);
        if (projectiles.length > 0) {
            projectiles.forEach(function (projectile) {
                if (projectile.meta.age == undefined)
                    projectile.meta.age = 0;
                projectile.meta.age += delta;
                if (projectile.meta.projectileID == undefined)
                    throw new Error("Projectile has no ID. Something has gone horribly wrong.");
                switch (projectile.meta.projectileID) {
                    case "0":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph")
                                projectile.yVel = -30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else
                                animData[(shapeOf(projectile) + "s")] = animData[(shapeOf(projectile) + "s")].filter(function (i) { return i != projectile; });
                        }
                        break;
                    case "1":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph")
                                projectile.yVel = 30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else
                                animData[(shapeOf(projectile) + "s")] = animData[(shapeOf(projectile) + "s")].filter(function (i) { return i != projectile; });
                        }
                        break;
                    case "2":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph")
                                projectile.xVel = -30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else
                                animData[(shapeOf(projectile) + "s")] = animData[(shapeOf(projectile) + "s")].filter(function (i) { return i != projectile; });
                        }
                        break;
                    case "3":
                        if (projectile.meta.age > 45) {
                            if (projectile.class != "projectileTelegraph")
                                projectile.xVel = 30;
                            // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                            else
                                animData[(shapeOf(projectile) + "s")] = animData[(shapeOf(projectile) + "s")].filter(function (i) { return i != projectile; });
                        }
                        break;
                    case "4":
                        // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                        if (projectile.meta.age > 45)
                            animData[(shapeOf(projectile) + "s")] = animData[(shapeOf(projectile) + "s")].filter(function (i) { return i != projectile; });
                        break;
                    case "5":
                        // @ts-expect-error: we will always be removing from the correct array for the shape of the projectile
                        if (projectile.meta.age > 15)
                            animData[(shapeOf(projectile) + "s")] = animData[(shapeOf(projectile) + "s")].filter(function (i) { return i != projectile; });
                        break;
                    case "darkBomb":
                        var ground = getRectById("ground");
                        if (!ground)
                            throw new Error("Ground not found. Something has gone horribly wrong.");
                        if (!(shapeOf(projectile) == "circle"))
                            throw new Error("This projectile type is for the dark bomb only.");
                        // @ts-expect-error: it will always be a circle
                        if (detectCollision(projectile, ground) || projectile.x > canvasWidth || projectile.x < 0 || projectile.y > canvasHeight || projectile.y < 0)
                            if (projectile.meta.age > 15) {
                                // @ts-expect-error: will always be a circle
                                intervalCounters["exDarkBomb"] = { x: map(projectile.x, 0, canvasWidth, 20, canvasWidth - 20), y: map(projectile.y, 0, canvasHeight, 20, canvasHeight - 20) };
                                animData.circles = animData.circles.filter(function (i) { return i != projectile; });
                            }
                }
            });
        }
    }
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
