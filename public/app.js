/*Vue.config.ignoredElements = [
    'a-scene',
    'a-entity',
    'a-camera',
    'a-box'
  ]
  Vue.component('vue-player', {
    props: ['index'],
    template: `
        <a-entity :position="pos"></a-entity>`,
    data () {

    },
    computed: {

      pos: function() {
        // we want rows of 5
        var xPos = this.index % 5 * this.stepSize - this.stepSize * 2
        var zPos = Math.floor(this.index / 5) * -this.stepSize -2
        return `${xPos} 0 ${zPos}`
      }
      
    }
  })
  new Vue({
    el: '#app',
    data: {
      ids: [],
      searchStr: 'chair',
      placement: null
    },
    methods: {
      findFurniture: _.debounce(function() {
        // check out 3d.io furniture documentation here: https://3d.io/docs/api/1/furniture.html
        io3d.furniture.search(this.searchStr, {limit: 300})
        .then(result => {
          if (result && result.length) {
            result = result.map(item => item.id)
            this.ids = []
            const placement = io3d.utils.uuid.generate()
            this.placement = placement
            // populate array with delay
            result.forEach((el, i) => {
              _.delay(() => {
                if (placement === this.placement) this.ids.push(el) 
              }, 25 * i)
            })
          }
        })
        .catch(console.error)
      }, 300)
    },
    created: function() {
      this.findFurniture()
    }
  })
*/
socket = io.connect('https://capturetheflags.herokuapp.com');
camera = document.getElementById("camera");
socket.emit('connected', "Hi");


var info = {}
setInterval(function (){
  info.rotation=camera.getAttribute("rotation");
  socket.emit('update',info);
},15)
var position = {x:0,y:0,z:0};
var players={};
socket.on('update',obj=>{
  var id=socket.id;
  players=obj.players;
  camera.getAttribute("position").x=players[id].x;
  camera.getAttribute("position").y=players[id].y;
  camera.getAttribute("position").z=players[id].z;
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