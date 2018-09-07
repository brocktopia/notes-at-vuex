
export default {

  namespaced: true,

  state: {
    all:[],
    activeNotebook:{}
  },

  getters: {},

  actions: {
    load({commit, state}) {
      //console.log('store.actions.notebooks.getNotebooks()');
      // check to see if notebooks have been loaded already
      if(state.all.length > 0) {
        console.log('store.actions.notebooks.getNotebooks() notebooks already loaded');
        return true;
      } else {
        return this.$axios.get('/notebooks')
          .then(function(res) {
            if (res.data && res.data.length > 0) {
              commit('setNotebooks', res.data);
            } else {
              commit('setNotebooks', []);
            }
          })
      }
    },
    // Not being used anywhere yet
    reloadNotebooks({commit}) {
      //console.log('store.actions.notebooks.reloadNotebooks()');
      this.$axios.get('/notebooks')
        .then(function(res) {
          if (res.data && res.data.length > 0) {
            commit('setNotebooks', res.data);
          } else {
            commit('setNotebooks', []);
          }
        })
    },
    getNotebook({commit, state, dispatch}, id) {
      //console.log('store.actions.notebooks.getNotebook() ['+id+']');
      if (state.all.length === 0) {
        console.warn('store.actions.notebooks.getNotebook() no notebooks loaded yet');
        // notebooks haven't loaded yet
        dispatch('getNotebooks');
        return
      }
      let notebook = state.all.find(notebook => notebook._id == id);
      if (notebook) {
        commit('setNotebook', notebook);
      } else {
        throw({message: 'Did not find notebook ['+id+'] in all[]'});
      }
    },
    addNotebook({commit, state}, notebook) {
      //console.log('store.actions.notebooks.addNotebook()');
      //console.dir(notebook);
      this.$axios.post('/notebooks/', notebook)
        .then(function(res) {
          if (res.data._id) {
            commit('addNotebook', res.data);
          }
        })
    },
    updateNotebook({commit, state}, notebook) {
      //console.log('store.actions.notebooks.updateNotebook()');
      //console.dir(notebook);
      return this.$axios.put('/notebook/' + notebook._id, notebook)
        .then(function(res) {
          if (res.data._id) {
            commit('updateNotebook', res.data);
          }
        })
    },
    delete({commit}, notebook_id) {
      //console.log('store.actions.notebooks.delete() ['+notebook_id+']');
      this.$axios.delete('/notebook/' + notebook_id)
        .then(function (res) {
          if (res.data.success) {
            commit('delete', notebook_id);
          } else {
            throw({message:'Failed to delete notebook by id ['+notebook_id+']'})
          }
        })
    }
  },

  mutations: {
    setNotebooks(state, notebooks) {
      //console.log('store.mutations.notebooks.setNotebooks()');
      state.all = notebooks;
    },
    setNotebook(state, notebook) {
      //console.log('store.mutations.notebooks.setNotebook()');
      //console.dir(notebook);
      state.activeNotebook = notebook;
    },
    addNotebook(state, notebook) {
      //console.log('store.mutations.notebooks.addNotebook()');
      state.all.unshift(notebook);
    },
    updateNotebook(state, notebook) {
      //console.log('store.mutations.notebooks.addNotebook()');
      Object.assign(state.activeNotebook, notebook);
    },
    delete(state, notebook_id) {
      //console.log('store.mutations.notebooks.delete()');
      let i = state.all.findIndex(n => n._id == notebook_id);
      //console.log('store.mutations.notes.notebooks() note id ['+notebook_id+'] at index ['+i+']');
      if (i > -1) {
        state.all.splice(i, 1);
      } else {
        throw({message:'Could not find notebook by id ['+notebook_id+']'})
      }
    }
  }

}