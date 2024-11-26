//math equation here
//http://mathworld.wolfram.com/images/eps-gif/HeartCurves_801.gif

setInterval(function(){
    drawHeart();
},100)


function drawHeart(){
    for(var i=0; i<360; i++){
        let t = degToRad(i+90);
        let r = (Math.sin(t) * Math.sqrt(Math.abs(Math.cos(t))))/(Math.sin(t)+7/5);
        r-=2*Math.sin(t);
        r+=2;
        polarPoint(r*100,i,1,174);
    }
}

function polarPoint(rad,t,startX,startY){
    goto(startX,startY)
    width(10)
    angle(t)
    penup()
    forward(rad)
    pendown()
    getRandomColor()
    forward(40)
}


function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    var r = getRandomNum(0, 255);
    var g = getRandomNum(0, 255);
    var b = getRandomNum(0, 255);
    color(r, g, b);
}