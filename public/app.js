Vue.config.ignoredElements = [
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

socket = io.connect('http://localhost:3000');

socket.emit('connected', "Hi");