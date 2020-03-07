Vue.config.ignoredElements = [
    'a-scene',
    'a-entity',
    'a-camera',
    'a-box'
]
Vue.component('vue-player', {
    props: ['index', 'player'],
    template: `
        <a-entity geometry="primitive: sphere; segmentsWidth: 4; segmentsHeight: 4; radius: 1;" color="ff0000" :position="player.x + ' ' + player.y + ' ' + player.z" :io3d-player="socket.id"></a-entity>`
})
new Vue({
    el: '#app',
    data: {
      players: []
  },
  methods: {
      
    },
    created: function() {
      
    }
})

socket = io.connect(location.href);
camera = document.getElementById("camera");
socket.emit('connected', "Hi");


var info = {}
setInterval(function (){
  info.rotation=camera.getAttribute("rotation");

  var gamepad = navigator.getGamepads()[0];
  if (gamepad) {

    if (gamepad.buttons[0].pressed) {
      info.backward = true;
    } else {
      info.backward = false;
    }

    if (gamepad.buttons[1].pressed) {
      info.forward = true;
    } else {
      info.forward = false;
    }

    if (gamepad.axes[0] == -1) {
      info.left = true;
    } else if (gamepad.axes[0] == 1) {
      info.right = true;
    } else {
      info.left = false;
      info.right = false;
    }

    if (gamepad.axes[1] == -1) {
      info.up = true;
    } else if (gamepad.axes[1] == 1) {
      info.down = true;
    } else {
      info.up = false;
      info.down = false;
    }

  }

  socket.emit('update',info);
},15)
var position = {x:0,y:0,z:0};
socket.on('update',obj=>{
  var id=socket.id;
  app.players=Object.values(obj.players);
   
  camera.getAttribute("position").x=obj.players[id].x;
  camera.getAttribute("position").y=obj.players[id].y;
  camera.getAttribute("position").z=obj.players[id].z;
})

document.addEventListener('keydown',e=>{
  if (e.code=="KeyW"){
    info.forward=true;
  }
  if (e.code=="KeyS"){
    info.backward=true;
  }
  if (e.code=="Space"){
    info.up=true;
  }
  if (e.code=="LeftShift"){
    info.down=true;
  }
  if (e.code=="KeyA"){
    info.left=true;
  }
  if (e.code=="KeyD"){
    info.right=true;
  }
})
document.addEventListener('keyup',e=>{
  if (e.code=="KeyW"){
    info.forward=false;
  }
  if (e.code=="KeyS"){
    info.backward=false;
  }
  if (e.code=="Space"){
    info.up=false;
  }
  if (e.code=="LeftShift"){
    info.down=false;
  }
  if (e.code=="KeyA"){
    info.left=false;
  }
  if (e.code=="KeyD"){
    info.right=false;
  }
})


