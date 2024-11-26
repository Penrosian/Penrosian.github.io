
//http://jwilson.coe.uga.edu/EMAT6680Fa08/Radford/Assignment11/Assignment11.html

let r1 = 0, r2=0, r3=0, r4=0;
color("#031101")
width(800)
forward(2000)

for(var i=0; i<360; i+=0.2){
    let t = degToRad(i);

    r1 = Math.sin(9*t) + 1;
    r2 = 0.5*Math.sin(25*t) + 1.3;
    //r3 = Math.cos(19*t) + 1;
    //r4 = 1.2* Math.sin(18*t);
    r1 = 140*r1;
    r2 = 140*r2;
    //r3 = 100*r3;
    //r4 = 100*r4;

    color("green");
    polarPoint(r1,i,0,0);

    color("red");
    polarPoint(r2,i,0,0);

}

function polarPoint(rad,t,startX,startY){
    goto(startX,startY)
    width(2)
    angle(t)
    penup()
    forward(rad)
    pendown()
    forward(2)
}