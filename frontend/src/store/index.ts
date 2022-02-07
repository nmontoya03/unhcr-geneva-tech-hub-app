import Vuex, {
  ActionContext,
  ActionTree,
  GetterTree,
  MutationTree,
  StoreOptions,
} from "vuex";

import ConfigModule from "./ConfigModule";
import ShelterItemModule from "./ShelterItemModule";
import ShelterSustainabilityModule from "./ShelterSustainabilityModule";
import Vue from "vue";
import VuexPersistence from "vuex-persist";

// import createPersistedState from 'vuex-persist-indexeddb';

Vue.use(Vuex);

/** Root State Interface */
export interface RootState {
  /* + Loading overlay */
  loading: boolean;
  /** ProgressBar Percentage */
  progress: number;
  /** SnackBar Text */
  message?: string;
  /** Error Message */
  error?: string;
}

/** State Default value */
const state: RootState = {
  loading: false,
  progress: 0,
  message: undefined,
  error: undefined,
};

/** Getters */
const getters: GetterTree<RootState, RootState> = {
  loading: (s): boolean => s.loading,
  progress: (s): number => s.progress,
  message: (s): string | undefined => s.message,
  error: (s): string | undefined => s.error,
};

/** Mutations */
const mutations: MutationTree<RootState> = {
  /**
   * Store loading
   *
   * @param s - Vuex state
   * @param display - Payload
   */
  storeLoading(s, display: boolean) {
    s.loading = display;
  },
  /**
   * Store progress
   *
   * @param s - Vuex state
   * @param progres - Spayload
   */
  storeProgress(s, progress: number) {
    s.progress = progress;
    s.loading = true;
  },
  /**
   * Store snackbar text
   *
   * @param s - Vuex state
   * @param message - Payload
   */
  storeMessage(s, message: string) {
    s.message = message;
  },
  /**
   * Store error message
   *
   * @param s - Vuex state
   * @param error - Payload
   */
  storeError(s, error: string) {
    s.error = error;
  },
};

/** Actions */
const actions: ActionTree<RootState, RootState> = {
  /**
   * Loading overlay visibility
   *
   * @param context - Vuex Context
   * @param display - Visibility
   */
  setLoading(context: ActionContext<RootState, RootState>, display: false) {
    context.commit("storeLoading", display);
  },
  /**
   * Loading progress bar value
   *
   * @param context - Vuex Context
   * @param progress - Percentage(0~100)
   */
  setProgress(context: ActionContext<RootState, RootState>, progress: 0) {
    context.commit("storeProgress", progress);
  },
  /**
   * Set snackbar message.
   *
   * @param context - Vuex Context
   * @param message - Message text
   */
  setMessage(
    context: ActionContext<RootState, RootState>,
    message: string | undefined = undefined
  ) {
    context.commit("storeMessage", message);
  },
  /**
   * Set Error message
   *
   * @param context - Vuex Context
   * @param error - Error message etc.
   */
  setError(context: ActionContext<RootState, RootState>, error = null) {
    context.commit("storeError", error);
  },
};

/** VuexStore */
const store: StoreOptions<RootState> = {
  // https://vuex.vuejs.org/guide/strict.html#development-vs-production
  // PouchDB is modified outside
  strict: false,
  state,
  getters,
  mutations,
  actions,
  modules: {
    ConfigModule,
    ShelterSustainabilityModule,
    ShelterItemModule,
  },
  plugins: [
    new VuexPersistence({
      key: "dev_web_vuex_persistant_namespace", // change with env variable
      storage: window.localStorage,
      modules: ["ConfigModule"],
    }).plugin,
    /*
    // store as session storage
    new VuexPersistence({
      key: import.meta.env.VITE_APP_WEBSTORAGE_NAMESPACE,
      storage: window.sessionStorage,
      modules: ['SomeModule'],
    }).plugin,
    // store as Indexed DB (using vuex-persist-indexeddb)
    createPersistedState({
      key: import.meta.env.VITE_APP_WEBSTORAGE_NAMESPACE,
      paths: ['SomeLargeModule'],
    }),
    */
  ],
};

const newStore = new Vuex.Store<RootState>(store);

export default newStore;
