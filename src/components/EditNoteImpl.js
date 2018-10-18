import PlacesDialog from './PlacesDialog'
import ModalDialog from './ModalDialog'
import {GmapMap, GmapMarker} from 'vue2-google-maps'
import { mapGetters } from 'vuex'

let vm,
  closeRoute;
export default {

  components: {
    PlacesDialog, ModalDialog
  },

  data() {
    return {
      isLoading: true,
      loadingMessage: 'Loading...',
      google:null,
      activeView: 'edit-name',
      mode:'',
      places:[],
      placeName:'',
      note:{name:'',note:'',geocode:{lat:0,lng:0}}, // need enough default values for template
      placesService: null,
      showPlacesDialog: false,
      showMoreButton: false,
      pagination: null,
      showMessage: false,
      messageClass: 'notify',
      messageTitle: '',
      messageBody: ''
    }
  },

  computed: {
    location() {
      return { lat: vm.note.geocode.lat, lng: vm.note.geocode.lng }
    },
    geoLat() {
      if (!this.note) return 0;
      return this.note.geocode.lat || 0;
    },
    geoLon() {
      if (!this.note) return 0;
      return this.note.geocode.lng || 0;
    },
    // Setup getters from store
    ...mapGetters('notes', ['activeNote','notebookNoteCount'])
  },

  beforeRouteEnter(toRoute, fromRoute, next) {
    //console.log('EditNoteImpl.beforeRouteEnter()');
    if (fromRoute.name) {
      closeRoute = fromRoute.fullPath;
    }
    next();
  },

  mounted() {
    //console.log(`EditNoteImpl.mounted()`);
    vm = this;
    // Check route to determine if note is new
    if (vm.$route.name === 'note-new' || vm.$route.name === 'note-new-mobile') {
      vm.mode = 'new'
    } else {
      vm.mode = 'edit'
    }
    // Check for deep-linking
    if (vm.mode === 'new') {
      if (!vm.activeNote.notebook) { // Deep-linked note-new
        //console.log(`EditNoteImpl.mounted() new note deep-linked`);
        // pull notebook_id out of route
        vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id)
          .then(() => {
            Object.assign(vm.note, vm.activeNote);
            vm.isLoading = false;
          })
          .catch(vm.handleError);
      } else {
        Object.assign(vm.note, vm.activeNote);
        vm.isLoading = false;
      }
    } else if (vm.mode === 'edit') {
        if (!vm.activeNote._id) { // Deep-linked note-edit
          //console.log(`EditNoteImpl.mounted() deep-linked`);
          vm.$store.dispatch('notes/getNote', vm.$route.params.note_id)
            .then(function() {
              // copy data from activeNote
              Object.assign(vm.note, vm.activeNote);
              vm.isLoading = false;
              if (vm.activeNote._id) {
                closeRoute = '/note/' + vm.activeNote._id;
              }
            })
            .catch(vm.handleError);
        } else {
          Object.assign(vm.note, vm.activeNote);
          vm.isLoading = false;
        }
    } else {
      console.warn('EditNoteImpl.mounted() Unable to determine context for initialization');
    }
    // get google reference
    vm.$gmapApiPromiseLazy().then((google) => {
      vm.google = google;
    });
    // get places service
    vm.$refs.NoteMap.$mapPromise.then((map) => {
      vm.placesService = new vm.google.maps.places.PlacesService(map);
    });
    // get location if this is a new note
    if (vm.mode === 'new') {
      vm.updateCoordinates();
    }
  },

  methods:{

    updateCoordinates() {
      //console.log(`EditNoteImpl.updateCoordinates()`);
      navigator.geolocation.getCurrentPosition(
        function(position) {
          //console.dir(position);
          let latlonObj = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          vm.note.geocode = latlonObj;
          // clear any loaded places
          vm.places = [];
        },
        function(err) {
          console.warn(`EditNoteImpl.updateCoordinates() ERROR(${err.code}): ${err.message}`);
        },
        {
          enableHighAccuracy: true
        }
      );
    },

    saveNote() {
      //console.log(`EditNoteImpl.saveNote()`);
      //vm.$emit('save', vm.note);
      vm.loadingMessage = 'Saving Note...';
      vm.isLoading = true;
      if (vm.mode === 'edit') {
        vm.$store.dispatch('notes/updateActiveNote', vm.note)
          .then(function () {
            vm.isLoading = false;
            if (closeRoute.includes(vm.activeNote._id)) {
              vm.$router.push(closeRoute);
            } else {
              vm.$router.push('/note/' + vm.activeNote._id);
            }
          })
          .catch(vm.handleError);
      } else if (vm.mode === 'new') {
        vm.$store.dispatch('notes/saveActiveNote', vm.note)
          .then(function () {
            vm.isLoading = false;
            vm.$router.push('/note/' + vm.activeNote._id);
          })
          .catch(vm.handleError);
      }
    },

    closeNote() {
      //console.log(`EditNoteImpl.closeNote() closeRoute [${closeRoute}]`);
      if (closeRoute) {
        vm.$router.push(closeRoute);
      } else {
        vm.$router.push('/notebook/' + vm.activeNote.notebook);
      }
    },

    hasPlace(note) { // this should probably be a computed property
      return !!(note.place && note.place.name)
    },

    findPlace() {
      //console.log(`EditNoteImpl.findPlace() place count [${this.places.length}]`);
      let options = {
        location:{
          lat:vm.geoLat,
          lng:vm.geoLon
        },
        radius:1000
      };
      if (vm.placeName) {
        options.keyword = vm.placeName;
      }
      // Check to see if places have already been loaded
      if (this.places.length > 0) {
        vm.showPlacesDialog = true;
      } else {
        // Call PlacesService
        vm.placesService.nearbySearch(options, function (res, status, pagination) {
          // this callback will create a listener for pagination
          if (status !== 'OK') return;
          vm.places ? vm.places = vm.places.concat(res) : vm.places = res;
          vm.showPlacesDialog = true;
          if (pagination.hasNextPage) {
            vm.showMoreButton = true;
            vm.pagination = pagination;
          } else {
            vm.showMoreButton = false;
            vm.pagination = null;
          }
        });
      }
    },

    moreSelected() {
      //console.log(`EditNoteImpl.moreSelected()`);
      if (vm.pagination) {
        vm.pagination.nextPage();
      }
    },

    mapMarkerMoved(marker) {
      //console.log(`EditNoteImpl.mapMarkerMoved()`);
      let latlonObj = {
        lat:  marker.latLng.lat(),
        lng: marker.latLng.lng()
      };
      vm.note.geocode = latlonObj;
      // clear any loaded places
      vm.places = [];
    },

    placesClose() {
      //console.log(`EditNoteImpl.placesClose()`);
      vm.showPlacesDialog = false;
    },

    placeSelected(place) {
      //console.log(`EditNoteImpl.placeSelected()`);
      let options = {
        placeId: place.place_id,
        fields:['name', 'url']
      };
      vm.placesService.getDetails(options, function(placeDetail, status) {
        //console.log(`EditNoteImpl.placeSelected() place details [${status}]`);
        if (status === 'OK') {
          vm.note.place = {
            name: place.name,
            icon: place.icon,
            url: placeDetail.url,
            _id: place.place_id
          };
          vm.note.geocode = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          vm.showPlacesDialog = false;
        } else {
          console.warn(`EditNoteImpl.placeSelected() Error [${status}] getting Place details`);
        }
      });
    },

    placeInputUpdated(name) {
      //console.log(`EditNoteImpl.placeInputUpdated() ${name}`);
      vm.placeName = name;
      // clear current results
      vm.places = [];
      vm.findPlace()
    },

    clearPlace() {
      //console.log(`EditNoteImpl.clearPlace()`);
      vm.$delete(vm.note, 'place');
      // needs to be empty object to save
      vm.note.place = {};
    },

    handleError(err) {
      console.warn(`Note.handleError()`);
      console.dir(err);
      if (vm.isLoading) {
        vm.isLoading = false;
        vm.messageTitle = 'Problem Saving Note';
        vm.messageBody = 'An error occurred while attempting to save this note. Make sure the note has both a name and note body text.';
        vm.showMessage = true;
      }
    }

  }
}