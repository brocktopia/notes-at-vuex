<template>
  <div class="modal-mask" @click="$emit('close')">

    <div class="modal-wrapper">

      <div class="modal-container" @click.stop="function(){}">

        <div class="modal-header">
          <h3>Nearby Places</h3>
        </div>

        <div class="modal-body">
          <input v-model="place.name" placeholder="Enter a place name" @input="updatePlaceSearch(place.name)">
          <ul class="place-list">
            <li class="place" v-for="place in places" @click="$emit('select', place)">
              <img :src="place.icon" width="25" height="25"/>
              <span class="place-name">{{place.name}}</span>
            </li>
          </ul>
        </div>

        <div class="modal-footer">
          <button v-if="showMore" class="modal-optional-botton" @click="$emit('more')">
            More Results
          </button>
          <button class="modal-default-button" @click="$emit('close')">
            Cancel
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<script>
  var vm;

  module.exports = {

    data: function() {
      return {
        interval:null
      }
    },

    props:{
      places:Array,
      placeName:String,
      showMore:Boolean
    },

    computed:{
      place() {
        return {'name': this.placeName}
      }
    },

    mounted: function() {
      vm = this;
    },

    methods: {

      updatePlaceSearch: function (name) {
        //console.log('PlacesDialog.updatePlaceSearch() placeName ['+name+']');
        if (vm.interval) {
          clearTimeout(vm.interval);
        }
        vm.interval = setTimeout(() => {
          vm.$emit('place', name);
          vm.interval = false;
        }, 500);
      }
    }

  };
</script>

<style scoped>
  input {
    width: 100%;
  }
  ul.place-list {
    max-height: 540px;
    margin: 10px 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  li.place {
    height: 30px;
    width: 100%;
    cursor: pointer;
    font-size: smaller;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  li.place img {
    vertical-align: middle;
  }
  .modal-mask .modal-container {
    width: 460px;
    max-height: 720px;
  }
</style>