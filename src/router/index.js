import Vue from 'vue'
import VueRouter from 'vue-router'

// component route endpoints
import Home from '../components/Home'
import Notebooks from '../components/Notebooks'
import Notebook from '../components/Notebook'
import Note from '../components/Note'
import NoteEdit from '../components/NoteEdit'
import NoteEditMobile from '../components/NoteEditMobile'
import NavError from '../components/NavError'

Vue.use(VueRouter);

export default new VueRouter({
  routes:[
    // Home Component
    {
      path:'/',
      name:'home',
      component: Home
    }
    // Notebooks Component
    ,{
      path:'/notebooks',
      name:'notebooks',
      component: Notebooks
    },{
      path:'/notebooks/new',
      name:'notebooks-new',
      component: Notebooks
    }
    // Notebook Component
    ,{
      path:'/notebook/:notebook_id',
      name:'notebook',
      component: Notebook
    },{
      path:'/notebook/:notebook_id/note/:note_id',
      name:'notebook-note',
      component: Notebook
    },{
      path:'/notebook/:notebook_id/note-edit/:note_id',
      name:'notebook-note-edit',
      component: Notebook
    },{
      path:'/notebook/:notebook_id/note-new',
      name:'notebook-note-new',
      component: Notebook
    },{
      path:'/notebook/:notebook_id/note-new-mobile',
      name:'notebook-note-new-mobile',
      component: Notebook
    },{
      path:'/notebook/:notebook_id/note-edit-mobile/:note_id',
      name:'notebook-note-edit-mobile',
      component: Notebook
    },{
      path:'/notebook/:notebook_id/map',
      name:'notebook-map',
      component: Notebook
    }
    // Note Component
    ,{
      path:'/note/:note_id',
      name:'note',
      component: Note
    }
    ,{
      path:'/note/:note_id/map',
      name:'note-map',
      component: Note
    }
    // NoteEdit Component
    ,{
      path:'/note-edit/:note_id',
      name:'note-edit',
      component: NoteEdit
    },{
      path:'/note-new/:notebook_id',
      name:'note-new',
      component: NoteEdit
    }
    // NoteEditMobile Component
    ,{
      path:'/note-edit-mobile/:note_id',
      name:'note-edit-mobile',
      component: NoteEditMobile
    },{
      path:'/note-new-mobile/',
      name:'note-new-mobile',
      component: NoteEditMobile
    }
    // NavError Component
    ,{
      path:'*',
      name:'404',
      component: NavError
    }
  ],
  scrollBehavior (toRoute, fromRoute, savedPosition) {
    // return desired position
    //console.log('router.scrollBehavior() to ['+toRoute.name+'] from ['+fromRoute.name+'] savedPosition ['+savedPosition+']');
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})