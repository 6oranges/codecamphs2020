var port = process.env.PORT || 3000;
var express = require('express');
var app = express();
var cors = require('cors');
var glMatrix = require('gl-matrix');
var vec3=glMatrix.vec3;
app.use(cors());
app.use(express.static('public'));

var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
 

function collides(A,B,C,P,r){
    var temp = vec3.create();
    vec3.sub(temp,A,P);
    A=temp;
    temp = vec3.create();
    vec3.sub(temp,B,P);
    B=temp;
    temp = vec3.create();
    vec3.sub(temp,C,P);
    C=temp;
    var rr = r * r;
    var AB=vec3.create();
    var AC=vec3.create();
    var BC=vec3.create();
    var CA=vec3.create();
    vec3.sub(AB,B,A);
    vec3.sub(AC,C,A);
    vec3.sub(BC,C,B);
    vec3.sub(CA,A,C);
    
    var V = vec3.create();
    vec3.cross(V,AB,AC);
    var d = vec3.dot(A,V);
    var e = vec3.dot(V,V);
    var sep1 = d * d > rr * e;
    var aa = vec3.dot(A,A);
    var ab = vec3.dot(A,B);
    var ac = vec3.dot(A,C);
    var bb = vec3.dot(B,B);
    var bc = vec3.dot(B,C);
    var cc = vec3.dot(C,C);
    var sep2 = (aa > rr) && (ab > aa) && (ac > aa);
    var sep3 = (bb > rr) && (ab > bb) && (bc > bb);
    var sep4 = (cc > rr) && (ac > cc) && (bc > cc);
    var d1 = ab-aa;
    var d2=bc-bb;
    var d3=ac-cc;
    var e1 = vec3.dot(AB,AB);
    var e2 = vec3.dot(BC,BC);
    var e3 = vec3.dot(CA,CA);
    var t1 = vec3.create();
    var t2 = vec3.create();
    vec3.scale(t1,A,e1);
    vec3.scale(t2,AB,d1);
    var Q1 = vec3.create();
    vec3.sub(Q1,t1,t2);

    vec3.scale(t1,B,e2);
    vec3.scale(t2,BC,d2);
    var Q2 = vec3.create();
    vec3.sub(Q2,t1,t2);

    vec3.scale(t1,C,e3);
    vec3.scale(t2,CA,d3);
    var Q3 = vec3.create();
    vec3.sub(Q3,t1,t2);

    vec3.scale(t1,C,e1);
    var QC = vec3.create();
    vec3.sub(QC,t1,Q1);

    vec3.scale(t1,A,e2);
    var QA = vec3.create();
    vec3.sub(QA,t1,Q2);

    vec3.scale(t1,B,e3);
    var QB = vec3.create();
    vec3.sub(QB,t1,Q3);
    var sep5 = (vec3.dot(Q1,Q1) > rr * e1 * e1) && (vec3.dot(Q1,QC) > 0);
    var sep6 = (vec3.dot(Q2,Q2) > rr * e2 * e2) && (vec3.dot(Q2,QA) > 0);
    var sep7 = (vec3.dot(Q3,Q3) > rr * e3 * e3) && (vec3.dot(Q3,QB) > 0);
    return !(sep1 || sep2 || sep3 || sep4 || sep5 || sep6 || sep7);
}


//Start script
//SPOT FOR GAME LOGIC

 
var meshes = [];
function Obstacle(err,contents){
    console.log(err);
    var faces = [];
    var vertices = [];
    lines = contents.split("\n");
    for (var line of lines){
        params=line.split(" ");
        if (params[0]=="v"){
            vertices.push([params[1],params[2],params[3]])
        }
        if (params[0]=="f"){
            var stuff=[];
            for (var i=1;i<params.length;i++){
                stuff.push(params[i].split("/"));
            }
            for (var i=1;i<stuff.length-1;i++){
                faces.push([stuff[0][0]-1,stuff[i][0]-1,stuff[i+1][0]-1])
            }   
        }
    }
    meshes.push({faces:faces,vertices:vertices});
}
fs.readFile('public/models/corridor_short.obj', 'utf8', Obstacle);
function colliding(P,r){
    for (var mesh of meshes){
        for (var face of mesh.faces){
            if (collides(mesh.vertices[face[0]],
                mesh.vertices[face[1]],
                mesh.vertices[face[2]],
                P,r
                )){
                    return true;
                }
        }
    }
    return false;
}
var players = {};
var flags = [];
setInterval(function (){ // Update
    for (key of Object.keys(players)){
        player=players[key];
        player.x+=player.mv[0];
        player.y+=player.mv[1];
        player.z+=player.mv[2];
        if (colliding([player.x,player.y,player.z],.5)){
            console.log("aregrneiohd");
        }
    }
},15);
function sin(x){
    return Math.sin(x*Math.PI/180);
}
function cos(x){
    return Math.cos(x*Math.PI/180);
}
io.on('connection', function (socket) {
    console.log("connected client of id: ",socket.id);
    players[socket.id]={x:0,y:0,z:0,mv:[0,0,0]};
    socket.emit({players:players,flags:flags});
    socket.on('connected', function (data) {
        
    })
    socket.on('update', function(data){
        players[socket.id].mv=[0,0,0];
        var forward=[0,0,-1];
        vec3.rotateX(forward,forward,[0,0,0],data.rotation.x*Math.PI/180);
        vec3.rotateY(forward,forward,[0,0,0],data.rotation.y*Math.PI/180);
        
        var right = vec3.create();
        vec3.cross(right,forward,[0,1,0])
        var up = vec3.create();
        vec3.cross(up,right,forward);
        const s = .01;
        vec3.normalize(forward,forward);
        vec3.normalize(right,right);
        vec3.normalize(up,up);
        vec3.scale(forward,forward,s);
        vec3.scale(right,right,s);
        vec3.scale(up,up,s);
        var mv = players[socket.id].mv;
        if (data.forward){
            vec3.add(mv,mv,forward);
        }
        if (data.left){
            vec3.sub(mv,mv,right);
        }
        if (data.right){
            vec3.add(mv,mv,right);
        }
        if (data.backward){
            vec3.sub(mv,mv,forward);
        }
        if (data.up){
            vec3.add(mv,mv,up);
        }
        if (data.down){
            vec3.sub(mv,mv,up);
        }
        socket.emit('update',{players:players,flags:flags});
    })
    socket.on('disconnect',function(){
        console.log("disconnected client of id: ",socket.id);
        delete players[socket.id];
    })

})

http.listen(port, function () {
    console.log("Started on port: " + port);
})