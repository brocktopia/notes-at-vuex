<template>
  <div>

    <div class="app-container" v-if="activeView === 'notebook'">

      <header>
        <h2>{{notebook.name}}</h2>
        <span class="button-bar">
          <svg class="icon" @click="deleteNotebook()"><use xlink:href="./dist/symbols.svg#delete-note"></use></svg>
          <svg class="icon" @click="editNotebook()"><use xlink:href="./dist/symbols.svg#edit-note"><title>Edit Notebook</title></use></svg>
          <svg class="icon" @click="showMap()"><use xlink:href="./dist/symbols.svg#map"></use></svg>
          <svg class="desktop-only icon" @click="addNote()"><use xlink:href="./dist/symbols.svg#add-note"></use></svg>
          <svg class="mobile-only icon" @click="addNoteMobile()"><use xlink:href="./dist/symbols.svg#add-note"></use></svg>
        </span>
      </header>

      <div class="content">
        <ul class="notebook">

          <li
            v-for="note in notes"
            :key="note._id"
            class="note-item"
            @click="noteSelect(note)"
          >
            <span class="title">{{note.name}}</span><br/>
            <span class="date">{{$moment(note.Created_date).format('ddd l h:mm:ss a')}}</span>
            <span v-if="!note.place || !note.place.name" class="geocoords">
              <svg class="icon-tiny location-icon"><use xlink:href="./dist/symbols.svg#my-location"></use></svg>
              {{(note.geocode.lat ? note.geocode.lat.toFixed(5) : 'Unknown') + ', ' + (note.geocode.lng ? note.geocode.lng.toFixed(5) : 'Unknown')}}
            </span>
            <span v-if="note.place && note.place.name" class="place">
              <svg class="icon-tiny place-icon"><use xlink:href="./dist/symbols.svg#place"></use></svg>
              {{note.place.name}}
            </span>
            <br clear="all"/>
            <span class="note">{{note.note.length > 84 ? note.note.substr(0,84) + '...' : note.note}}</span>
          </li>

        </ul>
        <div v-if="notes.length === 0" class="notebook-message">No notes in this notebook.</div>
      </div>

      <div class="navigation">
        <router-link to="/">Home</router-link>
        <router-link to="/notebooks">Notebooks</router-link>
      </div>

    </div>

    <notebook-map
      v-if="activeView === 'map'"
      :name="notebook.name"
      :notes="notes"
      v-on:close="closeNotebookMap"
      v-on:edit="editNotebook"
      v-on:delete="deleteNotebook"
      v-on:addNote="addNote"
      v-on:addNoteMobile="addNoteMobile"
      v-on:select="noteSelect"
    ></notebook-map>

    <edit-notebook-dialog
      v-if="showEditNotebook"
      @close="showEditNotebook = false"
      :mode="'edit'"
      :notebookSource="notebook"
      v-on:save="saveNotebook"
    ></edit-notebook-dialog>

    <modal-dialog
      v-if="showConfirmModal"
      @close="showConfirmModal = false"
    >
      <h3 class="warn" slot="header">Confirm Notebook Delete</h3>
      <div slot="body">Are you sure you want to delete this notebook? <span v-html="notebookDeleteMsg"></span> This can not be undone.</div>
      <div slot="footer">
        <button class="modal-optional-button" @click="cancelDelete()">
          Cancel
        </button>
        <button class="modal-default-button" @click="confirmDelete()">
          Confirm
        </button>
      </div>
    </modal-dialog>

    <modal-dialog v-if="showMessage" @close="showMessage = false">
      <h3 :class="messageClass" slot="header">{{messageTitle}}</h3>
      <div slot="body" v-html="messageBody"></div>
    </modal-dialog>

    <note-view
      v-if="activeView === 'note'"
      :note="activeNote"
      :noteCount="notes.length"
      v-on:edit="editNote"
      v-on:editmobile="editNoteMobile"
      v-on:close="closeNote"
      v-on:delete="deleteNote"
      v-on:next="nextNote"
      v-on:previous="previousNote"
    ></note-view>

    <note-edit
      v-if="activeView === 'note-edit'"
      :noteSource="activeNote"
      :mode="noteEditMode"
      v-on:save="saveNote"
      v-on:close="closeNoteNew"
      v-on:cancel="cancelNoteEdit"
    ></note-edit>

    <note-edit-mobile
      v-if="activeView === 'note-edit-mobile'"
      :noteSource="activeNote"
      :mode="noteEditMode"
      v-on:save="saveNote"
      v-on:close="closeNoteNew"
      v-on:cancel="cancelNoteEdit"
    ></note-edit-mobile>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from './ModalDialog'
  import EditNotebookDialog from './EditNotebookDialog'
  import NotebookMap from './NotebookMap'
  import NoteView from './Note'
  import NoteEdit from './NoteEdit'
  import NoteEditMobile from './NoteEditMobile'
  import { mapGetters } from 'vuex'

  var vm;
  export default {

    components: {
      NoteView, NoteEdit, NoteEditMobile, ModalDialog, EditNotebookDialog, NotebookMap
    },

    data: function () {
      return {
        notebookRouteExtra: '', // currently only used to hold reference to 'map' when user navigates down into notes
        activeView: 'notebook',
        showMessage: false,
        messageClass: 'notify',
        messageTitle: '',
        messageBody: '',
        noteEditMode: '', // edit | new
        showConfirmModal: false,
        showEditNotebook: false,
        isLoading: true,
        loadingMessage: 'Loading...' // mutable based on async task
      }
    },

    computed: {
      notebookDeleteMsg: function () { // Present note count to user on notebook delete
        let notes = vm.notes;
        return (notes.length > 0 ? '<b style="color:darkred;">All ' + (notes.length > 2 ? notes.length : '') + ' notes</b> in this notebook will be deleted. ' : '')
      },
      // Could create getters for these but leaving it to illustrate it as possibility
      notebook: function () {
        return this.$store.state.notebooks.activeNotebook
      },
      notes: function () {
        return this.$store.state.notes.notebookNotes
      },
      // Setup getters from store
      ...mapGetters('notes', ['findNotebookNote', 'activeNote'])
    },

    mounted: function () {
      //console.log('Notebook.mounted()');
      vm = this;

      // Make sure notebooks are loaded in case of deep-linking
      vm.$store.dispatch('notebooks/load')
        .then(function () {

          // Get Notebook
          vm.$store.dispatch('notebooks/getNotebook', vm.$route.params.notebook_id)
            .then(function () {

              // Get Notebook Notes
              vm.$store.dispatch('notes/getNotebookNotes', vm.$route.params.notebook_id)
                .then(function () {

                  // Check route info to see if we are deep-linked
                  if (vm.$route.params.note_id) {

                    // Deep-link to Note context
                    vm.setActiveNote(vm.$route.params.note_id);
                    if (vm.$route.name === 'notebook-note') {
                      vm.activeView = 'note';
                    } else if (vm.$route.name === 'notebook-note-edit') {
                      vm.noteEditMode = 'edit';
                      vm.activeView = 'note-edit';
                    } else if (vm.$route.name === 'notebook-note-edit-mobile') {
                      vm.noteEditMode = 'edit';
                      vm.activeView = 'note-edit-mobile';
                    }
                  }
                  else if (vm.$route.name === 'notebook-note-new') {

                    // Create New Note
                    vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id);
                    vm.noteEditMode = 'new';
                    vm.activeView = 'note-edit';
                  }
                  else if (vm.$route.name === 'notebook-note-new-mobile') {

                    // Create New Note for mobile
                    vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id);
                    vm.noteEditMode = 'new';
                    vm.activeView = 'note-edit-mobile';
                  }
                  else if (vm.$route.name === 'notebook-map') {

                    // Notebook Map
                    vm.notebookRouteExtra = '/map';
                    vm.activeView = 'map';
                  }

                  // Finished
                  vm.isLoading = false;
                })
            })
        })
        .catch(vm.handleError);
    },

    watch: {
      $route(toRoute, fromRoute) {
        //console.log('Notebook.$route() toRoute [' + toRoute.name + '] fromRoute [' + fromRoute.name + '] path [' + toRoute.path + ']');
        if (toRoute.name === 'notebook') { // notebook home
          vm.$store.dispatch('notes/clearActiveNote')
            .catch(vm.handleError);
          vm.notebookRouteExtra = '';
          vm.activeView = 'notebook';
        }
        else if (toRoute.name === 'notebook-map') { // notebook map
          vm.notebookRouteExtra = '/map';
          vm.activeView = 'map';
        }
        else if (toRoute.name === 'notebook-note') { // notebook note
          if (vm.setActiveNote(vm.$route.params.note_id)) {
            vm.activeView = 'note';
          }
        }
        else if (toRoute.name === 'notebook-note-new') { // notebook new note
          //vm.activeNote = vm.getNoteTemplate();
          vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id);
          vm.noteEditMode = 'new';
          vm.activeView = 'note-edit'
        }
        else if (toRoute.name === 'notebook-note-new-mobile') { // notebook new note for mobile
          //vm.activeNote = vm.getNoteTemplate();
          vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id);
          vm.noteEditMode = 'new';
          vm.activeView = 'note-edit-mobile'
        }
        else if (toRoute.name === 'notebook-note-edit') { // notebook edit note
          if (vm.setActiveNote(vm.$route.params.note_id)) {
            vm.noteEditMode = 'edit';
            vm.activeView = 'note-edit';
          }
        }
        else if (toRoute.name === 'notebook-note-edit-mobile') { // notebook edit note for mobile
          if (vm.setActiveNote(vm.$route.params.note_id)) {
            vm.noteEditMode = 'edit';
            vm.activeView = 'note-edit-mobile';
          }
        }
        else {
          console.warn('Notebook.$route() Unhandled route');
          console.dir(toRoute);
        }
      }
    },

    methods: {
      // Utility methods
      setActiveNote: function (note_id) {
        if (vm.activeNote._id != note_id) {
          //console.log('Notebook.setActiveNote() for ' + note_id);
          vm.$store.dispatch('notes/setActiveNote', note_id)
            .catch(vm.handleError);
        }
        // Wasn't async before--probably need to remove this functionality or make it promise-based
        return true;
      },

      // Navigation inside notebook using $router
      noteSelect: function (note) {
        //console.log('Notebook.noteSelect() '+note._id);
        // Let route watcher manage change
        vm.$router.push('/notebook/' + vm.notebook._id + '/note/' + note._id);
      },
      nextNote: function () {
        //console.log('Notebook.nextNote()');
        vm.$store.dispatch('notes/nextNote');
        vm.$router.push('/notebook/' + vm.notebook._id + '/note/' + vm.activeNote._id);
      },
      previousNote: function () {
        //console.log('Notebook.previousNote()');
        vm.$store.dispatch('notes/previousNote');
        vm.$router.push('/notebook/' + vm.notebook._id + '/note/' + vm.activeNote._id);
      },
      editNote: function () {
        //console.log('Notebook.editNote()');
        vm.$router.push('/notebook/' + vm.notebook._id + '/note-edit/' + vm.activeNote._id);
      },
      editNoteMobile: function () {
        //console.log('Notebook.editNoteMobile()');
        vm.$router.push('/notebook/' + vm.notebook._id + '/note-edit-mobile/' + vm.activeNote._id);
      },
      addNote: function () {
        //console.log('Notebook.addNote()');
        vm.$router.push('/notebook/' + vm.notebook._id + '/note-new');
      },
      addNoteMobile: function () {
        //console.log('Notebook.addNoteMobile()');
        vm.$router.push('/notebook/' + vm.notebook._id + '/note-new-mobile');
      },
      closeNote: function () {
        //console.log('Notebook.closeNote()');
        vm.$router.push('/notebook/' + vm.notebook._id + vm.notebookRouteExtra);
      },
      closeNoteNew: function () {
        //console.log('Notebook.closeNoteNew()');
        vm.$router.push('/notebook/' + vm.notebook._id + vm.notebookRouteExtra);
      },
      cancelNoteEdit: function () {
        //console.log('Notebook.cancelNoteEdit()');
        vm.$router.push('/notebook/' + vm.notebook._id + '/note/' + vm.activeNote._id);
      },
      showMap: function () {
        //console.log('Notebook.showMap()');
        vm.$router.push('/notebook/' + vm.notebook._id + '/map');
      },
      closeNotebookMap: function () {
        //console.log('Notebook.closeNotebookMap()');
        vm.$router.push('/notebook/' + vm.notebook._id);
      },

      // Notebook methods
      editNotebook: function () {
        //console.log('Notebook.editNotebook()');
        vm.showEditNotebook = true;
      },
      saveNotebook: function (notebook) {
        //console.log('Notebook.saveNotebook()');
        vm.loadingMessage = 'Saving...';
        vm.isLoading = true;
        // this method currently not needing to create new notebook
        vm.$store.dispatch('notebooks/updateNotebook', notebook)
          .then(function () {
            vm.isLoading = false;
            vm.showEditNotebook = false;
          })
          .catch(vm.handleError);
      },
      deleteNotebook: function () {
        //console.log('Notebook.deleteNotebook()');
        vm.showConfirmModal = true;
      },
      cancelDelete: function () {
        //console.log('Notebook.cancelDelete()');
        vm.showConfirmModal = false;
      },
      confirmDelete: function () {
        //console.log('Notebook.confirmDelete()');
        vm.loadingMessage = 'Removing Notebook...';
        vm.isLoading = true;
        vm.$store.dispatch('notebooks/delete', vm.notebook._id)
          .then(function() {
            vm.showConfirmModal = false;
            vm.isLoading = false;
            vm.$router.replace('/notebooks');
          })
          .catch(vm.handleError);
      },
      // Not using this any more now that data is more stable with vuex
      updateNotes: function () {
        //console.log('Notebook.updateNotes()');
        //vm.loadingMessage = 'Updating Notebook...';
        //vm.isLoading = true;

        /*
        vm.$axios.get('/notes/'+vm.$route.params.notebook_id)
          .then(function(res) {
            if (res.data.errors) {
              console.warn('updateNotes() Errors');
              console.dir(res.data);
            } else if (res.data.length > 0) {
              vm.notebook.notes = res.data;
            } else {
              vm.notebook.notes = [];
            }
            vm.isLoading = false;
          })
          .catch(vm.handleError);
          */
      },
      saveNote: function (note) {
        //console.log('Notebook.saveNote()');
        //console.dir(note);
        vm.loadingMessage = 'Saving Note...';
        vm.isLoading = true;
        if (vm.noteEditMode === 'edit') {
          vm.$store.dispatch('notes/updateActiveNote', note)
            .then(function () {
              vm.isLoading = false;
              vm.$router.push('/notebook/' + vm.notebook._id + '/note/' + vm.activeNote._id);
            })
            .catch(vm.handleError);
        } else if (vm.noteEditMode === 'new') {
          vm.$store.dispatch('notes/saveActiveNote', note)
            .then(function () {
              vm.isLoading = false;
              vm.$router.push('/notebook/' + vm.notebook._id + '/note/' + vm.activeNote._id);
            })
            .catch(vm.handleError);
        }
      },
      deleteNote: function () {
        //console.log('Notebook.deleteNote()');
        vm.loadingMessage = 'Removing Note...';
        vm.isLoading = true;
        vm.$store.dispatch('notes/delete', vm.activeNote._id)
          .then(function () {
            vm.$router.push('/notebook/' + vm.notebook._id + vm.notebookRouteExtra);
            vm.isLoading = false;
          })
          .catch(vm.handleError);
      },
      handleError: function (err) {
        console.warn('Notebook.handleError()');
        console.dir(err);
        vm.isLoading = false;
        vm.messageClass = 'warn';
        if (err.message === 'Network Error') {
          vm.messageTitle = 'Network Error';
          vm.messageBody = 'There was a problem connecting to application services. Please try again. If the problem persist, please contact support.';
        } else if (err.message.indexOf('validation failed') != -1) {
          // show user message
          let msg = err.message,
            title = msg.substr(0, msg.indexOf(':')),
            msgBody = msg.slice(msg.indexOf(':') + 2);
          vm.messageTitle = title;
          vm.messageBody = '';
          if (msgBody.indexOf(',')) {
            msgBody.split(',').forEach(part => {
              vm.messageBody += part.slice(part.indexOf(':') + 2) + '<br/>';
            });
          } else {
            vm.messageBody += msgBody.slice(msgBody.indexOf(':') + 2);
          }
        } else {
          vm.messageTitle = 'Unknown Error';
          vm.messageBody = 'There was an unknown problem. Please try again. If the problem persist, please contact support.';
        }
        vm.showMessage = true;
      }
    }
  }
</script>

<style scoped>
  ul {
    margin: 0;
  }
  ul.notebook li {
    margin: 0;
    list-style: none;
    width: 100%;
    background-color: #ffffff;
    border-top: 1px solid #cccccc;
    border-bottom: 1px solid #999999;
    padding: 10px 20px;
    text-align: left;
    cursor: pointer;
  }
  ul.notebook li span {
    display: inline-block;
  }
  .notebook-message {
    margin: 20px;
  }
  .date, .note {
    font-size: smaller;
  }
  .title {
    margin-bottom: 8px;
  }
  .note {
    margin-top: 8px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .geocoords, .place {
    float: right;
    font-size: smaller;
    width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .geocoords {
    color: #4e7eef;
  }
  .location-icon {
    fill: #4e7eef;
  }
  .place {
    color: #666;
  }
  .place-icon {
    fill: #ed453b;
  }
</style>