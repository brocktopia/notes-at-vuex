<template>
  <div class="app-container">

    <header>
      <h2>{{activeNote.name}}</h2>
      <span class="button-bar">
        <svg class="icon" @click="deleteNote()"><use xlink:href="./dist/symbols.svg#delete-note"></use></svg>
        <svg class="desktop-only icon" @click="editNote()"><use xlink:href="./dist/symbols.svg#edit-note"></use></svg>
        <svg class="mobile-only icon" @click="editNoteMobile()"><use xlink:href="./dist/symbols.svg#edit-note"></use></svg>
        <svg v-if="showNoteMap" class="icon" @click="showNote()"><use xlink:href="./dist/symbols.svg#note"></use></svg>
        <svg v-if="showNoteMap === false" class="icon" @click="showMap()"><use xlink:href="./dist/symbols.svg#map"></use></svg>
        <svg class="icon" @click="closeNote()"><use xlink:href="./dist/symbols.svg#close-note"></use></svg>
      </span>
    </header>

    <div v-if="!showNoteMap" class="content">

      <div class="date">{{$moment(activeNote.date).format('LLLL')}}</div>

      <div class="geocoords" v-if="!!activeNote.place && !!activeNote.place.name">
        <img :src="activeNote.place.icon" class="icon-tiny" />
        <span id="placeName">{{activeNote.place.name}}</span>
        <a :href="activeNote.place.url" target="_blank" style="display: inline-block; vertical-align: middle;">
          <svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#launch"></use></svg>
        </a>
      </div>

      <div class="geocoords" v-if="!!activeNote.geocode">
        <a @click="showMap()">
          <svg class="icon-tiny" style="vertical-align: text-bottom;"><use xlink:href="./dist/symbols.svg#my-location"></use></svg>
          {{activeNote.geocode.lat +', '+activeNote.geocode.lng}}
        </a>
      </div>
      <p class="note">{{activeNote.note}}</p>
    </div>

    <gmap-map
      v-if="showNoteMap"
      class="content"
      ref="NoteMap"
      :center="{'lat':geoLat,'lng':geoLon}"
      :zoom="15"
    >
      <gmap-marker
        ref="myMarker"
        :position="google && new google.maps.LatLng(geoLat, geoLon)"
      />
    </gmap-map>

    <div class="navigation">
      <a @click="closeNote()">Back to Notebook</a>
      <a v-if="notebookNoteCount > 1" style="float:right;" @click="nextNote()">Next &gt;</a>
      <a v-if="notebookNoteCount > 1" style="float:right;" @click="previousNote()">&lt; Previous</a>
    </div>

    <!-- Dynamically loaded content -->

    <modal-dialog v-if="showConfirmModal" @close="showConfirmModal = false">
      <h3 slot="header">Confirm Delete</h3>
      <div slot="body">Are you sure you want to delete this note? This can not be undone.</div>
      <div slot="footer">
        <button class="modal-optional-button" @click="cancelDelete()">
          Cancel
        </button>
        <button class="modal-default-button" @click="confirmDelete()">
          Confirm
        </button>
      </div>
    </modal-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from './ModalDialog'
  import {gmapApi, GmapMap} from 'vue2-google-maps'
  import { mapGetters } from 'vuex'

  var vm,
   closeRoute;
  export default {

    components: {
      ModalDialog
    },

    computed: {
      google: gmapApi,
      geoLat: function () {
        return vm.activeNote.geocode.lat || 0;
      },
      geoLon: function () {
        return vm.activeNote.geocode.lng || 0;
      },
      // Setup getters from store
      ...mapGetters('notes', ['activeNote','notebookNoteCount'])
    },

    data() {
      return {
        showConfirmModal: false,
        isLoading: true,
        loadingMessage:'Loading...',
        showNoteMap:false,
        closeRoute:''
      }
    },

    watch: {
      $route(toRoute, fromRoute) {
        //console.log('Note.watch.$route() toRoute [' + toRoute.name + '] fromRoute [' + fromRoute.name + '] path [' + toRoute.path + ']');
        if (toRoute.name === 'note-map') { // show map
          vm.showNoteMap = true;
        } else if (toRoute.name === 'note') { // hide map
          vm.showNoteMap = false;
        }
      }
    },

    beforeRouteEnter(toRoute, fromRoute, next) {
      if (!closeRoute && fromRoute.name) {
        //console.log('Note.beforeRouteEnter() get data path on fromRoute [' + fromRoute.name + ']');
        if (!fromRoute.name.includes('note-') && fromRoute.name != 'note') {
          closeRoute = fromRoute.fullPath;
        }
      } else if (fromRoute.name && fromRoute.name.includes('notebook')) {
        //console.log('Note.beforeRouteEnter() update closeRoute [' + fromRoute.name + ']');
        closeRoute = fromRoute.fullPath;
      }
      next();
    },

    mounted() {
      //console.log(`Note.mounted() closeRoute [${closeRoute}]`);
      vm = this;
      if (!closeRoute) { // Note must be deep-linked
        //console.log('Note.mounted() deeplinked');
        vm.$store.dispatch('notes/getNote', vm.$route.params.note_id)
          .then(function() {
            vm.isLoading = false;
            if (vm.$route.name === 'note-map') {
              vm.showNoteMap = true;
            }
            closeRoute = '/notebook/' + vm.activeNote.notebook;
          })
          .catch(vm.handleError);
      } else {
        if (vm.$route.name === 'note-map') {
          vm.showNoteMap = true;
        }
        vm.isLoading = false;
      }
    },

    methods: {
      editNote() {
        //console.log('Note.editNote()');
        vm.$router.push('/note-edit/' + vm.activeNote._id);
      },
      editNoteMobile() {
        //console.log('Note.editNoteMobile()');
        vm.$router.push('/note-edit/' + vm.activeNote._id);
      },
      closeNote() {
        //console.log(`Note.closeNote() [${closeRoute}]`);
        vm.$router.push(closeRoute);
      },
      nextNote() {
        //console.log('Note.nextNote()');
        vm.$store.dispatch('notes/nextNote')
          .then(function() {
            vm.$router.push('/note/' + vm.activeNote._id + (vm.showNoteMap ? '/map/' : ''));
          })
          .catch(vm.handleError)
      },
      previousNote() {
        //console.log('Note.previousNote()');
        vm.$store.dispatch('notes/previousNote')
          .then(function() {
            vm.$router.push('/note/' + vm.activeNote._id + (vm.showNoteMap ? '/map/' : ''));
          })
          .catch(vm.handleError)
      },
      deleteNote() {
        //console.log('Note.deleteNote()');
        vm.showConfirmModal = true;
      },
      cancelDelete() {
        //console.log('Note.cancelDelete()');
        vm.showConfirmModal = false;
      },
      confirmDelete() {
        //console.log('Note.confirmDelete()');
        vm.loadingMessage = 'Removing Note...';
        vm.isLoading = true;
        let notebook_id = vm.activeNote.notebook;
        vm.$store.dispatch('notes/delete', vm.activeNote._id)
          .then(function () {
            vm.$router.push('/notebook/' + notebook_id);
            vm.isLoading = false;
          })
          .catch(vm.handleError);
      },
      showMap() {
        //console.log('Note.showMap() lat ['+vm.geoLat+'] lng ['+vm.geoLon+']');
        vm.$router.push('/note/'+vm.activeNote._id+'/map');
      },
      showNote() {
        //console.log('Note.showNote()');
        vm.$router.push('/note/'+vm.activeNote._id);
      },
      handleError(err) {
        console.warn('Note.handleError()');
        console.dir(err);
      }
    }

  }
</script>

<style scoped>
  .content {
    padding: 20px;
  }
  .content > div {
    margin: 10px 0;
  }
  .geocoords img {
    vertical-align: middle;
  }
  .note {
    white-space: pre-wrap;
  }
  a svg {
    fill: #42b983;
  }
  .navigation a {
    display: inline-block;
  }
</style>