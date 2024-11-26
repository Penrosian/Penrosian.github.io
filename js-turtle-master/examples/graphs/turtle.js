/*
forward(distance)  //գնալ առաջ (հեռավորություն)
right(angle)            //աջ (անկյուն)
left(angle) 	     //ձախ (անկյուն)	
goto(x,y) 	     //գնա (x կորդինատ, y կորդինատ)
clear() 	                  //մաքրել
penup() 	    //բարձրացնել մատիտը
pendown() 	    //իջեցնել մատիտը
reset() 	                 //սկսել սկզբից, ջնջել ամեն ինչ ....
angle(angle)	   //անկյուն	 
width(width)       //մատիտի հաստությունը(հաստություն)
colour(r,g,b) 	   //ընտրել գույն()
*/


//var edgesNumber =  prompt("input edges count");
var edgesNumber = 3;
edgesNumber = parseInt(edgesNumber);
var ang = 360 / edgesNumber;
var radius = 200;
var nodes = []; 


var x = 0; //circle center x
var y = 0; //circle center y
nodes.push([0,0]);

width(10);
//collect coordinates
for(var a = 0; a<360; a+=ang){
    goto(x,y);
    xp = Math.round(Math.cos(angToRadian(a)) * radius);
    yp = Math.round(Math.sin(angToRadian(a)) * radius);
    nodes.push([xp,yp]);
    //console.log(drawLine(x,y,xp,yp));
    //drawLine(x,y,xp,yp)
    colour(255,0,0);
    goto(xp,yp);
    forward(2);
}

colour(0,0,0);
//goto(x,y);
console.log(nodes);
//drawLine(0,0,-174,184);
var count = 2;
width(1);
for(var i=0; i<nodes.length; i++){
    for(var j=0; j<nodes.length; j++){
        console.log(nodes[i][0],nodes[i][1],nodes[j][0],nodes[j][1]);
        drawLine(nodes[i][0],nodes[i][1],nodes[j][0],nodes[j][1]);
    }
}



function angToRadian(ang){
    rad = ang*Math.PI/180;
    return rad;
}

function drawLine(x1,y1,x2,y2){
    //not working at this time, TODO:fix later
    return false;
    var x = x2-x1;
    var y = y2-y1;
    var r = Math.sqrt(x*x + y*y);
    /*
    var angleDeg = Math.ceil(Math.atan2(y, x) * 180 / Math.PI);
    */
    //https://gist.github.com/Samueleroux/f6854e8e443a210ff6958b23f2237097
    //https://gist.github.com/conorbuck/2606166
    var p12 = Math.sqrt(Math.pow((0 - x1),2) + Math.pow((0 - y1),2));
    var p13 = Math.sqrt(Math.pow((0 - x2),2) + Math.pow((0 - y2),2));
    var p23 = Math.sqrt(Math.pow((x1 - x2),2) + Math.pow((y1 - y2),2));
    var resultDegree = Math.acos(((Math.pow(p12, 2)) + (Math.pow(p13, 2)) - (Math.pow(p23, 2))) / (2 * p12 * p13)) * 180 / Math.PI;
    


    goto(x1,y1);
    angle(resultDegree);
    forward(r);
    console.log(resultDegree,r);
    
    return 1;

}