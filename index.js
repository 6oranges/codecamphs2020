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
    
    vec3.sub(AB,B,A);
    vec3.sub(AC,C,A);
    
    
    var V = vec3.create();
    vec3.cross(V,AB,AC);
    var d = vec3.dot(A,V);
    var e = vec3.dot(V,V);
    var sep1 = d * d > rr * e;
    if (sep1){
        return false;
    }
    var aa = vec3.dot(A,A);
    var ab = vec3.dot(A,B);
    var ac = vec3.dot(A,C);
    var bb = vec3.dot(B,B);
    var bc = vec3.dot(B,C);
    var cc = vec3.dot(C,C);
    var sep2 = (aa > rr) && (ab > aa) && (ac > aa);
    var sep3 = (bb > rr) && (ab > bb) && (bc > bb);
    var sep4 = (cc > rr) && (ac > cc) && (bc > cc);
    if (sep2||sep3||sep4){
        return false;
    }
    var BC=vec3.create();
    var CA=vec3.create();
    vec3.sub(BC,C,B);
    vec3.sub(CA,A,C);

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
    var facen=[];
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
                var f=[stuff[0][0]-1,stuff[i][0]-1,stuff[i+1][0]-1];
                faces.push(f);
                var n=vec3.create();
                var AB=vec3.create();
                var AC=vec3.create();
                vec3.sub(AB,vertices[f[1]],vertices[f[0]]);
                vec3.sub(AC,vertices[f[2]],vertices[f[0]]);
                vec3.cross(n,AB,AC);
                vec3.normalize(n,n);
                facen.push(n);
            }   
        }
    }
    meshes.push({faces:faces,vertices:vertices,facen:facen});
}
fs.readFile('public/models/map.obj', 'utf8', Obstacle);
function distPlane(mesh,fi,P){
    var AP=vec3.create();
    vec3.sub(AP,P,mesh.vertices[mesh.faces[fi][0]]);
    return vec3.dot(mesh.facen[fi],AP);
}
function colliding(P,r){
    var closest=r+1;
    var cmesh;
    var cfi;
    for (var mesh of meshes){
        for (var fi=0;fi<mesh.faces.length;fi++){
            var face=mesh.faces[fi];
            var dist = distPlane(mesh,fi,P);
            
            if (dist<=r&&dist>0){// Don't collide with triangles facing other way
                if (dist<closest){
                    if (collides(mesh.vertices[face[0]],
                    mesh.vertices[face[1]],
                    mesh.vertices[face[2]],
                    P,r
                    )){
                        closest=dist;
                        cmesh=mesh;
                        cfi=fi;
                    }
                }
            }
        }
    }
    if (closest<=r){
        return {mesh:cmesh,fi:cfi};
    }
    return false;
}
var UUID = {
    lut: [],
    generate()
    {
        var lut=this.lut;
        var d0 = Math.random()*0xffffffff|0;
        var d1 = Math.random()*0xffffffff|0;
        var d2 = Math.random()*0xffffffff|0;
        var d3 = Math.random()*0xffffffff|0;
        return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
        lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
        lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
        lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
    }
}
for (let i=0; i<256; i++) { UUID.lut[i] = (i<16?'0':'')+(i).toString(16); }
var players = {};
var flags = {};
for (var i=0;i<10;i++){
    flags[UUID.generate()]=({p:[(Math.random()-.5)*35,(Math.random()-.5)*35,(Math.random()-.5)*35]});
}

setInterval(function (){ // Update
    for (let key of Object.keys(players)){
        
        player=players[key];
        var g=vec3.clone(player.p);
        vec3.normalize(g,g);
        vec3.scale(g,g,.001);
        vec3.add(player.v,player.v,player.a);
        //vec3.add(player.v,player.v,g);
        vec3.scale(player.v,player.v,.95)
        
        
        var i=0;
        var t1 = vec3.create();
        while (i<5){
            vec3.add(player.p,player.p,player.v);
            var collision = colliding(player.p,.5); // Try to move
            if (collision){
                vec3.sub(player.p,player.p,player.v); // Restore location
                var m=collision.mesh;
                var n = m.facen[collision.fi];
                var dist = distPlane(m,collision.fi,player.p)-(.5);
                if (dist>=0){
                    vec3.normalize(t1,player.v);
                    vec3.scale(t1,t1,dist);
                    vec3.add(player.p,player.p,t1);
                    vec3.sub(player.v,player.v,t1);
                    vec3.cross(t1,player.v,n);
                    vec3.cross(t1,n,t1);
                    vec3.scale(player.v,t1,vec3.dot(t1,player.v)/vec3.dot(t1,t1));
                }
                else{
                    i=5;
                }
            }
            else{
                i=5;
            }
            i+=1;
        }
        
        for (let flag of Object.keys(flags)){
            var d=vec3.create();
            vec3.sub(d,flags[flag].p,player.p);
            var s =vec3.dot(d,d);
            if (s<1){
                io.emit('rm',flag);
                delete flags[flag];
            }
            
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
    players[socket.id]={p:[0,15,0],v:[0,0,0],a:[0,0,0],r:{x:0,y:0,z:0}};
    socket.emit({players:players,flags:flags});
    socket.on('update', function(data){

        var forward=[0,0,-1];
        vec3.rotateX(forward,forward,[0,0,0],data.rotation.x*Math.PI/180);
        vec3.rotateY(forward,forward,[0,0,0],data.rotation.y*Math.PI/180);
        vec3.rotateZ(forward,forward,[0,0,0],data.rotation.z*Math.PI/180);
        
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
        players[socket.id].a=[0,0,0];
        var a = players[socket.id].a;
        players[socket.id].r=data.rotation;
        controls=data.controls;
        if (controls.forward){
            vec3.add(a,a,forward);
        }
        if (controls.left){
            vec3.sub(a,a,right);
        }
        if (controls.right){
            vec3.add(a,a,right);
        }
        if (controls.backward){
            vec3.sub(a,a,forward);
        }
        if (controls.up){
            vec3.add(a,a,up);
        }
        if (controls.down){
            vec3.sub(a,a,up);
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