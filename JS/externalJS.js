function plus1(x) {
    console.log(x + 1);
}

plus1(1)
plus1(2)

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasWidth = canvas.getAttribute("width");
const canvasHeight = canvas.getAttribute("height");

console.log(canvasWidth);
console.log(canvasHeight);

function fillCircle(x, y, radius, fillColor, strokeColor, strokeWidth, arcLength){
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, arcLength * 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
}

function fillPage(fillColor){
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function fillRect(x, y, x2, y2, fillColor){
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, x2, y2);
}

function toScaledWidth(num){
    return num/100*canvasWidth;
}

function toScaledHeight(num){
    return num/100*canvasHeight;
}

fillPage("blue");
fillRect(0, toScaledHeight(75), canvasWidth, canvasHeight, "white");
// 50, 30, 20
fillCircle(toScaledWidth(50), toScaledHeight(37), canvasWidth/20, "white", "white", 0, 1);
fillCircle(toScaledWidth(50), toScaledHeight(47), canvasWidth*3/40, "white", "white", 0, 1);
fillCircle(toScaledWidth(50), canvasHeight*5/8, canvasWidth/8, "white", "white", 0, 1);

function randInt(low, high){
    return Math.floor(Math.random() * (1 + high - low)) + low;
}

console.log(randInt(-5, 5));

const button = document.getElementById("rainbowButton");

button.addEventListener("click", () => {
    document.body.style.backgroundColor = `rgb(${randInt(0,255)}, ${randInt(0,255)}, ${randInt(0,255)})`;
});