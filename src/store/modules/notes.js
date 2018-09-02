
export default {

  namespaced: true,

  state: {
    all:[],
    notebookNotes:[],
    activeNote:{}
  },

  getters: {
    findNotebookNote:(state) => (id) => {
      return state.notebookNotes.find(note => {return note._id === id})
    },
    activeNote:(state) => {
      return state.activeNote;
    }
},

  actions: {
    getNotes({commit}) {
      console.log('store.module.notes.getNotes()');
      this.$axios.get('/notes')
        .then(function(res) {
          if (res.data && res.data.length > 0) {
            commit('setNotes', res.data);
          }
        })
    },
    getNotebookNotes({commit, dispatch}, notebook_id) {
      console.log('store.actions.notes.getNotebookNotes() notebook_id ['+notebook_id+']');
      return this.$axios.get('/notes/'+notebook_id)
        .then(function(res) {
          commit('setNotebookNotes', res.data || []);
        })
    },
    setActiveNote({commit, state}, note_id) {
      console.log('store.actions.notes.setActiveNote() note ['+note_id+']');
      let note = state.notebookNotes.find(n => n._id == note_id);
      console.dir(note);
      if (note) {
        commit('setActiveNote', note);
      } else {
        throw({message:'Failed to find note by id ['+note_id+'] to set it active.'})
      }
    },
    clearActiveNote({commit}) {
      console.log('store.actions.notes.clearActiveNote()');
      return commit('setActiveNote', {});
    },
    createActiveNote({commit}, notebook_id) {
      console.log('store.actions.notes.createActiveNote()');
      let note = {
        'name':'',
        'Created_date': new Date().toISOString(),
        'geocode': {
          'lat':0,
          'lng':0
        },
        'note':'',
        'notebook': notebook_id
      };
      console.dir(note);
      return commit('setActiveNote', note);
    },
    nextNote({commit, state}) {
      console.log('store.actions.notes.nextNote()');
      let note,
        i = state.notebookNotes.findIndex(n => n._id === state.activeNote._id);
      if (!isNaN(i) && i != -1) {
        i++;
        if (state.notebookNotes[i]) {
          note = state.notebookNotes[i];
        } else {
          note = state.notebookNotes[0];
        }
        commit('setActiveNote', note);
      } else {
        throw({message:'Could note find activeNote index.'});
      }
    },
    previousNote({commit, state}) {
      console.log('store.actions.notes.previousNote()');
      let note,
        i = state.notebookNotes.findIndex(n => n._id === state.activeNote._id);
      if (!isNaN(i) && i != -1) {
        i--;
        if (i > -1) {
          note = state.notebookNotes[i];
        } else {
          note = state.notebookNotes[state.notebookNotes.length - 1];
        }
        commit('setActiveNote', note);
      } else {
        throw({message:'Could note find activeNote index.'});
      }
    },
    saveActiveNote({commit, state}, note) {
      console.log('store.actions.notes.saveActiveNote()');
      return this.$axios.post('/notes/'+state.activeNote.notebook, note)
        .then(function(res) {
          // confirm new note
          if (res.data._id) {
            commit('addNotebookNote', res.data);
            commit('updateActiveNote', res.data);
          } else {
            throw({message: 'Service call did not return a note reference'});
          }
        })
    },
    updateActiveNote({commit, state}, note) {
      console.log('store.actions.notes.saveActiveNote()');
      return this.$axios.put('/notes/note/'+state.activeNote._id, note)
        .then(function(res) {
          commit('updateActiveNote', res.data);
        })
    },
    delete({commit}, note_id) {
      return this.$axios.delete('/notes/note/'+note_id)
        .then(function(res) {
          if (res.data.success) {
            commit('delete', note_id);
          } else {
            throw({message:'Failed to delete note.'})
          }
        });
    }
  },

  mutations: {
    setNotes(state, notes) {
      state.all = notes;
    },
    setActiveNote(state, note) {
      console.log('store.mutations.notes.setActiveNote()');
      state.activeNote = note;
    },
    setNotebookNotes(state, notes) {
      console.log('store.mutations.notes.setNotebookNotes()');
      console.dir(notes);
      state.notebookNotes = notes;
    },
    addNotebookNote(state, note) {
      state.notebookNotes.unshift(note);
    },
    updateActiveNote(state, note) {
      console.log('store.mutations.notes.updateActiveNote()');
      console.dir(note);
      state.activeNote = note;
      // update in notes array
      let i = state.notebookNotes.findIndex(n => n._id == note._id);
      if (i > -1) {
        state.notebookNotes[i] = note;
      } else {
        throw({message:'Could not find note ['+note._id+'] in notebookNotes[]'})
      }
      console.log('store.mutations.notes.updateActiveNote() activeNote is active');
    },
    delete(state, note_id) {
      let i = state.notebookNotes.findIndex(n => n._id == note_id);
      console.log('store.mutations.notes.delete() note id ['+note_id+'] at index ['+i+']');
      if (i > -1) {
        state.notebookNotes.splice(i, 1);
      } else {
        throw({message:'Could not find note by id ['+note_id+']'})
      }
    }
  }

}