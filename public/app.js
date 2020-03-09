"use strict";

Vue.config.ignoredElements = [
    'a-scene',
    'a-entity',
    'a-camera',
    'a-box',
    'a-assets',
    'a-asset-item'
]

Vue.component('vue-player', {
    props: ['index', 'player'],
    template: `
        <a-entity geometry="primitive: sphere; segmentsWidth: 4; segmentsHeight: 4; radius: 0.5;" :position="player.p[0] + ' ' + player.p[1] + ' ' + player.p[2]"></a-entity>`,
})
Vue.component('vue-flag', {
  props: ['index', 'flag'],
  template: `
      <a-entity  material="color: red" geometry="primitive: sphere; segmentsWidth: 4; segmentsHeight: 4; radius: 0.5;" :position="flag.p[0] + ' ' + flag.p[1] + ' ' + flag.p[2]"></a-entity>`,
})
var app = new Vue({
    el: '#app',
    data: {
      players: {},
      flags:{}
  },
  methods: {
      
  },
  created: function() {
      
  }
})
var vec3=glMatrix.vec3;
var socket = io.connect(location.href);
var camera = document.getElementById("camera");
var offset = document.getElementById("offset");

var info = {};
function Controls(labels){
  let pressed={};
  for (let i=0;i<labels.length;i++){
    pressed[labels[i]]=new Set();
  }
  return {
    press(label,how){
      pressed[label].add(how);
    },
    release(label,how){
      pressed[label].delete(how);
    },
    releaseAll(how){
      for (let l of Object.keys(pressed)){
        pressed[l].delete(how);
      }
    },
    state(label,how,s){
      if(s){
        this.press(label,how);
      }
      else{
        this.release(label,how);
      }
    },
    is(label){
      return pressed[label].size>0;
    },
    all(){
      let x={};
      for (let l of Object.keys(pressed)){
        x[l]=this.is(l);
      }
      return x;
    }
  }
}
let myControls=Controls([
  "backward",
  "forward",
  "left",
  "right",
  "up",
  "down"
]);
function updateGamepad(){
  var gamepad = navigator.getGamepads()[0];
  if (gamepad) {
    myControls.releaseAll("gamepad");
    myControls.state("backward","gamepad",gamepad.buttons[0].pressed);
    myControls.state("forward","gamepad",gamepad.buttons[1].pressed);

    myControls.state("backward","gamepad",gamepad.buttons[0].pressed);
    myControls.state("backward","gamepad",gamepad.buttons[0].pressed);

    if (gamepad.axes[0] == -1) {
      myControls.press("left","gamepad");
    } else if (gamepad.axes[0] == 1) {
      myControls.press("right","gamepad");
    }

    if (gamepad.axes[1] == -1) {
      myControls.press("up","gamepad");
    } else if (gamepad.axes[1] == 1) {
      myControls.press("down","gamepad");
    }
  }
}
// Update
setInterval(function (){
  info.rotation=camera.getAttribute("rotation");
  updateGamepad();
  info.controls=myControls.all();
  socket.emit('update',info);
},15)
function s(v){
  return {x:v[0],y:v[1],z:v[2]};
}
function setVof(att,elem,v){
  var d=elem.getAttribute(att);
  d.x=v[0];
  d.y=v[1];
  d.z=v[2];
}
var agreha=false;
var position = {x:0,y:0,z:0};
socket.on('update',obj=>{
  var id=socket.id;
  app.players=obj.players;
  app.flags=obj.flags;
  /*if (!agreha){
    agreha=true;
    flags=obj.flags;
    flagP.innerHTML="";
    for (var flag of Object.keys(flags)){
      var c = document.createElement("a-box");
      flagP.appendChild(c);
      c.setAttribute("position",s(flags[flag].p));
      c.setAttribute("color","#F0F");
      
    }
  }*/
  var cp=obj.players[id];
  offset.getAttribute("position").x=cp.p[0];
  offset.getAttribute("position").y=cp.p[1];
  offset.getAttribute("position").z=cp.p[2];
  var n = vec3.create();
  vec3.negate(n,cp.p);
  vec3.normalize(n,n);
  var t = Math.atan2(n[2],Math.sqrt(n[1]**2+n[0]**2));
  //document.getElementById("offset").setAttribute("rotation",{x:t*180/Math.PI,y:0,z:-Math.atan2(n[0],Math.cos(t))*180/Math.PI});
})

document.addEventListener('keydown',e=>{
  if (e.code=="KeyW"){
    myControls.press("forward","keyboard");
  }
  if (e.code=="KeyS"){
    myControls.press("backward","keyboard");
  }
  if (e.code=="Space"){
    myControls.press("up","keyboard");
  }
  if (e.code=="ShiftLeft"){
    myControls.press("down","keyboard");
  }
  if (e.code=="KeyA"){
    myControls.press("left","keyboard");
  }
  if (e.code=="KeyD"){
    myControls.press("right","keyboard");
  }
})
document.addEventListener('keyup',e=>{
  if (e.code=="KeyW"){
    myControls.release("forward","keyboard");
  }
  if (e.code=="KeyS"){
    myControls.release("backward","keyboard");
  }
  if (e.code=="Space"){
    myControls.release("up","keyboard");
  }
  if (e.code=="ShiftLeft"){
    myControls.release("down","keyboard");
  }
  if (e.code=="KeyA"){
    myControls.release("left","keyboard");
  }
  if (e.code=="KeyD"){
    myControls.release("right","keyboard");
  }
})


