//See Initial version here: http://berniepope.id.au/html/js-turtle/turtle.html
//This is adapted version for TUMO

(function() {

var turtle = undefined;
var imageCanvas, imageContext, turtleCanvas, turtleContext;
var stepByStep = false;
var steps = [];
reset();

/* ====================================  turtle API functions =====================================*/
window.setSpeed = function(pause) {
    if(window.location.hash==="#force"){
        return false;
    }
    stepByStep = true;

    var intervalID = setInterval(function () {
        var command = steps.shift();
        var cc = command[0] + "(" + command[1] + ",true)";
        eval(cc);
        if (steps.length == 0) {
            clearInterval(intervalID)
        }
    }, pause);

    //Force 
    window.addEventListener('keypress', (event) => {
        if((event.key == "f" || event.key == "ֆ")  && steps.length>0){
            clearInterval(intervalID)
            pause/=2
            intervalID = setInterval(function () {
                var command = steps.shift();
                var cc = command[0] + "(" + command[1] + ",true)";
                eval(cc);
                if (steps.length == 0) {
                    clearInterval(intervalID)
                }
            }, pause);
        }
    });


}

window.forward = function(distance, step = false) {
    if (stepByStep && !step) {
        steps.push(["forward", distance]);
    }
    else {
        distance = parseFloat(distance)
        imageContext.save();
        centerCoords(imageContext);
        imageContext.beginPath();
        var maxX = imageContext.canvas.width / 2;
        var minX = -imageContext.canvas.width / 2;
        var maxY = imageContext.canvas.height / 2;
        var minY = -imageContext.canvas.height / 2;
        var x = turtle.pos.x;
        var y = turtle.pos.y;
        while (distance > 0) {
            imageContext.moveTo(x, y);
            var cosAngle = Math.cos(turtle.angle);
            var sinAngle = Math.sin(turtle.angle)
            var newX = x + sinAngle * distance;
            var newY = y + cosAngle * distance;
            function xWrap(cutBound, otherBound) {
                var distanceToEdge = Math.abs((cutBound - x) / sinAngle);
                var edgeY = cosAngle * distanceToEdge + y;
                imageContext.lineTo(cutBound, edgeY);
                distance -= distanceToEdge;
                x = otherBound;
                y = edgeY;
            }
            function yWrap(cutBound, otherBound) {
                var distanceToEdge = Math.abs((cutBound - y) / cosAngle);
                var edgeX = sinAngle * distanceToEdge + x;
                imageContext.lineTo(edgeX, cutBound);
                distance -= distanceToEdge;
                x = edgeX;
                y = otherBound;
            }
            function noWrap() {
                imageContext.lineTo(newX, newY);
                turtle.pos.x = newX;
                turtle.pos.y = newY;
                distance = 0;
            }
            // If wrap is on, trace a part segment of the path and wrap on boundary if necessary.
            if (turtle.wrap) {
                if (insideCanvas(newX, newY, minX, maxX, minY, maxY)) {
                    noWrap();
                }
                else if (point = intersect(x, y, newX, newY, maxX, maxY, maxX, minY))
                    xWrap(maxX, minX);
                else if (point = intersect(x, y, newX, newY, minX, maxY, minX, minY))
                    xWrap(minX, maxX);
                else if (point = intersect(x, y, newX, newY, minX, maxY, maxX, maxY))
                    yWrap(maxY, minY);
                else if (point = intersect(x, y, newX, newY, minX, minY, maxX, minY))
                    yWrap(minY, maxY);
                else
                    // No wrapping to to, new turtle position is within the canvas.
                    noWrap();
            }
            else {
                noWrap();
            }
        }

        if (turtle.penDown) {
            imageContext.stroke();
        }
        imageContext.restore();
        drawIf();
    }
}

window.color = function(sr, sg, sb, step = false) {
    var r,g,b;
    if (Array.isArray(sr)) {
        r = sr[0];
        g = sr[1];
        b = sr[2];
    }
    else if (typeof (sr) === "string") {
        var tclr = new RGBColor(sr).toRGB_array();
        r = tclr[0];
        g = tclr[1];
        b = tclr[2];
    }
    else {
        r = sr;
        g = sg;
        b = sb;
    }

    if (stepByStep && !step) {
        steps.push(["color", r + "," + g + "," + b]);
    }
    else {
        colour(r, g, b);
    }

}


window.penup = function(step = false) {
    if (stepByStep && !step) {
        steps.push(["penup", ""]);
    }
    else {
        turtle.penDown = false;
    }
}

window.pendown = function(step = false) {
    if (stepByStep && !step) {
        steps.push(["pendown", ""]);
    }
    else {
        turtle.penDown = true;
    }
}

window.right = function(angle, step = false) {
    if (stepByStep && !step) {
        steps.push(["right", angle]);
    } else {
        angle = parseFloat(angle);
        turtle.angle += degToRad(angle);
        drawIf();
    }
}

window.left = function(angle, step = false) {
    if (stepByStep && !step) {
        steps.push(["left", angle]);
    } else {
        angle = parseFloat(angle);
        turtle.angle -= degToRad(angle);
        drawIf();
    }

}

window.goto = function(x, y, step = false) {
    if (stepByStep && !step) {
        steps.push(["goto", x + "," + y]);
    }
    else {
        x = parseInt(x)
        y = parseInt(y)
        turtle.pos.x = x;
        turtle.pos.y = y;
        drawIf();
    }
}

window.showGrid = function(step) {
    angle(0);
    goto(12, 10);
    write("(0,0)");
    goto(346, 11);
    write("X");
    goto(14, 344);
    write("Y");

    goto(0, 0);

    width(2);
    for (var i = 0; i < 4; i++) {
        goto(0, 0);
        forward(350);
        left(90);
    }

    width(0.5);
    for (var x = 0; x < 350; x += step) {
        goto(x, 0);
        forward(350 * 2);
    }

    for (var x = 0; x > -350; x -= step) {
        goto(x, 0);
        forward(350 * 2);
    }

    left(90);
    for (var y = 0; y < 350; y += step) {
        goto(0, y);
        forward(350 * 2);
    }
    for (var y = 0; y > -350; y -= step) {
        goto(0, y);
        forward(350 * 2);
    }

    goto(0, 0);
    angle(0);
}

window.angle = function(_angle, step = false) {
    if (stepByStep && !step) {
        steps.push(["angle", _angle]);
    }
    else {
        turtle.angle = degToRad(_angle);
        drawIf();
    }
}


window.width = function(w, step = false) {
    if (stepByStep && !step) {
        steps.push(["width", w]);
    }
    else {
        w = parseFloat(w);
        turtle.width = w;
        imageContext.lineWidth = w;
    }
}

/* ====================================  end of turtle API functions =====================================*/



/* ====================================  STRANGE turtle API functions =====================================*/

window.strangeSquare = function(side, step = 5) {
    var x1 = turtle.pos.x;
    var y1 = turtle.pos.y;
    for (var x = x1; x < x1 + side; x += step) {
        for (var y = y1; y > y1 - side; y -= step) {
            goto(x, y);
            var a = getRandomInt_h(0, 360);
            left(a);
            forward(5);
        }
    }
    angle(0);
    goto(x1, y1);
}


window.strangeGalaxy = function(radius) {
    var x1 = turtle.pos.x;
    var y1 = turtle.pos.y;
    for (var i = 0; i < 720; i++) {
        left(2);
        goto(x1, y1);
        penup();
        var a = getRandomInt_h(0, radius);
        var r = getRandomInt_h(0, 360);
        left(r);
        forward(a);
        right(r);
        pendown();
        forward(5);
    }
    angle(0);
    goto(x1, y1);
}

window.strangeCircle = function(radius) {
    var x1 = turtle.pos.x;
    var y1 = turtle.pos.y;
    for (var i = 0; i < 360; i++) {
        left(2);
        goto(x1, y1);
        penup();
        var a = getRandomInt_h(radius - radius / 10, radius);
        var r = getRandomInt_h(0, 360);
        left(r);
        forward(a);
        right(r);
        pendown();
        forward(5);
    }
    angle(0);
    goto(x1, y1);
}


window.strangeLine = function(length) {
    var l = 0;
    while (l < length) {
        var p = getRandomInt_h(0, 2);
        var h = getRandomInt_h(0, 5);
        width(h);
        forward(p);
        l += p;
    }
    width(1);
}

/* ====================================  end of STRANGE turtle API functions =====================================*/


/* ===================================   Envirement: coords, copy etc... ======================*/
var canv = document.getElementById("turtlecanvas");
var co = document.getElementById("coords");
var msg = document.getElementById("message");

function relMouseCoords(event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while (currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return { x: canvasX, y: canvasY }
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

canv.addEventListener('click', function (e) {  // use event argument
    copyTextToClipboard((canvasX - 700 / 2) + "," + (-canvasY + 700 / 2));
    msg.className = "message-show";
    setTimeout(function () {
        msg.className = "message-hide";
    }, 1000);
});

canv.addEventListener("mousemove", function (event) {
    coords = canv.relMouseCoords(event);
    canvasX = coords.x;
    canvasY = coords.y;
    co.innerHTML = "X:" + (canvasX - 700 / 2) + " Y:" + (-canvasY + 700 / 2);

});

//https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        //console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        //console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        //console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        //console.error('Async: Could not copy text: ', err);
    });
}

/* ============================== end of Envirement: coords, copy etc... ======================*/



/* ============================== HELPERS ======================*/
function initialise() {
    imageCanvas = document.getElementById("imagecanvas"); // $('#imagecanvas')[0];
    imageContext = imageCanvas.getContext('2d');
    turtleCanvas = document.getElementById("turtlecanvas"); //$('#turtlecanvas')[0];
    turtleContext = turtleCanvas.getContext('2d');


    turtle = {
        pos: {         // position in turtle coordinates
            x: 0,
            y: 0
        },
        angle: 0,      // angle in degrees in turtle space
        penDown: true, // is the turtle pen down (or up)?
        width: 1,      // width of the line drawn by the turtle
        visible: true, // is the turtle visible?
        redraw: true,  // do we redraw the image when the turtle moves?
        wrap: true,    // do we wrap the turtle on the boundaries of the canvas?
        // colour of the line drawn by the turtle
        colour: { r: 0, g: 0, b: 0, a: 1 },
    };
    imageContext.lineWidth = turtle.width;
    imageContext.strokeStyle = "black";
    imageContext.globalAlpha = 1;
    imageContext.textAlign = "center";
    imageContext.textBaseline = "middle";
    turtleContext.globalCompositeOperation = 'destination-over';
}

function drawIf() {
    if (turtle.redraw) draw();
}

function centerCoords(context) {
    var width = context.canvas.width;
    var height = context.canvas.height;
    context.translate(width / 2, height / 2);
    context.transform(1, 0, 0, -1, 0, 0);
}

function draw() {
    clearContext(turtleContext);
    if (turtle.visible) {
        var x = turtle.pos.x;
        var y = turtle.pos.y;
        var w = 10;
        var h = 15;
        turtleContext.save();
        centerCoords(turtleContext);
        turtleContext.translate(x, y);
        turtleContext.rotate(-turtle.angle);
        turtleContext.translate(-x, -y);
        turtleContext.beginPath();
        turtleContext.moveTo(x - w / 2, y);
        turtleContext.lineTo(x + w / 2, y);
        turtleContext.lineTo(x, y + h);
        turtleContext.closePath();
        turtleContext.fillStyle = "green";
        turtleContext.fill();
        turtleContext.restore();
    }
    // Make a composite of the turtle canvas and the image canvas.
    turtleContext.drawImage(imageCanvas, 0, 0, 700, 700, 0, 0, 700, 700);
}

function clear(){
    clearContext(imageContext);
    drawIf();
}

window.clear = clear

function clearContext(context) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.restore();
}

function reset() {
    initialise();
    clear();
    draw();
}


function insideCanvas(x, y, minX, maxX, minY, maxY) {
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var d = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    var ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / d;
    var ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / d;

    if (d == 0) {
        return undefined;
    }
    else if (ua < 0.01 || ua > 0.99 || ub < 0 || ub > 1) {
        return undefined;
    }
    else {
        return { x: x1 + ua * (x2 - x1), y: y1 + ua * (y2 - y1) }
    }
}

function wrap(bool) {
    turtle.wrap = bool;
}

function hideTurtle() {
    turtle.visible = false;
    drawIf();
}

function showTurtle() {
    turtle.visible = true;
    drawIf();
}

function redrawOnMove(bool) {
    turtle.redraw = bool;
}



window.degToRad=function (deg) {
    return deg / 180 * Math.PI;
}

window.radToDeg = function(deg) {
    return deg * 180 / Math.PI;
}


window.write = function(msg) {
    imageContext.save();
    centerCoords(imageContext);
    imageContext.translate(turtle.pos.x, turtle.pos.y);
    imageContext.transform(1, 0, 0, -1, 0, 0);
    imageContext.translate(-turtle.pos.x, -turtle.pos.y);
    imageContext.fillText(msg, turtle.pos.x, turtle.pos.y);
    imageContext.restore();
    drawIf();
}

window.colour = function(r, g, b) {
    var a = 1;
    imageContext.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    turtle.colour.r = r;
    turtle.colour.g = g;
    turtle.colour.b = b;
    turtle.colour.a = a;
}

function random(low, hi) {
    return Math.floor(Math.random() * (hi - low + 1) + low);
}

function repeat(n, action) {
    for (var count = 1; count <= n; count++)
        action();
}

function animate(action, ms) {
    return setInterval(action, ms);
}

window.setFont = function setFont(font) {
    imageContext.font = font;
}


window.randomColor_h = function() {
    var r = getRandomInt_h(0, 255);
    var g = getRandomInt_h(0, 255);
    var b = getRandomInt_h(0, 255);
    color(r, g, b);
}

function getRandomInt_h(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * A class to parse color values
 * @author Stoyan Stefanov <sstoo@gmail.com>
 * @link   http://www.phpied.com/rgb-color-parser-in-javascript/
 * @license MIT license
 */
function RGBColor(color_string) {
    this.ok = false;

    // strip any leading #
    if (color_string.charAt(0) == '#') { // remove # if any
        color_string = color_string.substr(1, 6);
    }

    color_string = color_string.replace(/ /g, '');
    color_string = color_string.toLowerCase();

    var simple_colors = {
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '00ffff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000000',
        blanchedalmond: 'ffebcd',
        blue: '0000ff',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '00ffff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgreen: '006400',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dodgerblue: '1e90ff',
        feldspar: 'd19275',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'ff00ff',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred: 'cd5c5c',
        indigo: '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgrey: 'd3d3d3',
        lightgreen: '90ee90',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslateblue: '8470ff',
        lightslategray: '778899',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '00ff00',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'ff00ff',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370d8',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'd87093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        red: 'ff0000',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        violetred: 'd02090',
        wheat: 'f5deb3',
        white: 'ffffff',
        whitesmoke: 'f5f5f5',
        yellow: 'ffff00',
        yellowgreen: '9acd32'
    };
    for (var key in simple_colors) {
        if (color_string == key) {
            color_string = simple_colors[key];
        }
    }

    var color_defs = [
        {
            re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
            example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
            process: function (bits) {
                return [
                    parseInt(bits[1]),
                    parseInt(bits[2]),
                    parseInt(bits[3])
                ];
            }
        },
        {
            re: /^(\w{2})(\w{2})(\w{2})$/,
            example: ['#00ff00', '336699'],
            process: function (bits) {
                return [
                    parseInt(bits[1], 16),
                    parseInt(bits[2], 16),
                    parseInt(bits[3], 16)
                ];
            }
        },
        {
            re: /^(\w{1})(\w{1})(\w{1})$/,
            example: ['#fb0', 'f0f'],
            process: function (bits) {
                return [
                    parseInt(bits[1] + bits[1], 16),
                    parseInt(bits[2] + bits[2], 16),
                    parseInt(bits[3] + bits[3], 16)
                ];
            }
        }
    ];

    for (var i = 0; i < color_defs.length; i++) {
        var re = color_defs[i].re;
        var processor = color_defs[i].process;
        var bits = re.exec(color_string);
        if (bits) {
            channels = processor(bits);
            this.r = channels[0];
            this.g = channels[1];
            this.b = channels[2];
            this.ok = true;
        }

    }

    // validate/cleanup values
    this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
    this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
    this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);

    this.toRGB = function () {
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
    }

    this.toRGB_array = function () {
        return [this.r, this.g, this.b];
    }

    this.toHex = function () {
        var r = this.r.toString(16);
        var g = this.g.toString(16);
        var b = this.b.toString(16);
        if (r.length == 1) r = '0' + r;
        if (g.length == 1) g = '0' + g;
        if (b.length == 1) b = '0' + b;
        return '#' + r + g + b;
    }

    // help
    this.getHelpXML = function () {

        var examples = new Array();
        // add regexps
        for (var i = 0; i < color_defs.length; i++) {
            var example = color_defs[i].example;
            for (var j = 0; j < example.length; j++) {
                examples[examples.length] = example[j];
            }
        }
        // add type-in colors
        for (var sc in simple_colors) {
            examples[examples.length] = sc;
        }

        var xml = document.createElement('ul');
        xml.setAttribute('id', 'rgbcolor-examples');
        for (var i = 0; i < examples.length; i++) {
            try {
                var list_item = document.createElement('li');
                var list_color = new RGBColor(examples[i]);
                var example_div = document.createElement('div');
                example_div.style.cssText =
                    'margin: 3px; '
                    + 'border: 1px solid black; '
                    + 'background:' + list_color.toHex() + '; '
                    + 'color:' + list_color.toHex()
                    ;
                example_div.appendChild(document.createTextNode('test'));
                var list_item_value = document.createTextNode(
                    ' ' + examples[i] + ' -> ' + list_color.toRGB() + ' -> ' + list_color.toHex()
                );
                list_item.appendChild(example_div);
                list_item.appendChild(list_item_value);
                xml.appendChild(list_item);

            } catch (e) { }
        }
        return xml;

    }

}



/* ============================== end of HELPERS ======================*/


function makeLinkToDocs(){
    var element = document.getElementById("imagecanvas");
    var linkElement = document.createElement("a");
    linkElement.innerHTML = "Full documentation";
    linkElement.href = "https://hanumanum.github.io/js-turtle/"
    linkElement.target = "_blank"
    linkElement.classList.add("doc-link-small")
    element.parentNode.insertBefore(linkElement, element.nextSibling);
}

makeLinkToDocs()


})();