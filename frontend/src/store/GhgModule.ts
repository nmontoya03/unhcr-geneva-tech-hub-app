/** Config store */
import { Country, GreenHouseGaz, Site } from "@/store/GhgInterface.vue";
import { SyncDatabase } from "@/utils/couchdb";
import {
  ActionContext,
  ActionTree,
  GetterTree,
  Module,
  MutationTree,
} from "vuex";
import { RootState } from ".";
import { updateMetaFieldsForUpdate } from "./documentUtils";
import { IgesItem } from "./GhgReferenceIgesGridModule";
import { ReferenceItemInterface } from "./GhgReferenceModule";
import { CouchUser } from "./UserModule";

const MSG_DB_DOES_NOT_EXIST = "Please, init your database";
const MSG_USER_NOT_PRESENT = "Could not find user information";

interface ProjectsState {
  projects: GreenHouseGaz[];
  project: GreenHouseGaz;
  projectLoading: boolean;
  countries: Array<Country>;
  sites: Site[];
  localCouch: SyncDatabase<GreenHouseGaz> | null;
}

const DB_NAME = "ghg_projects";

function generateState(): ProjectsState {
  return {
    projects: [],
    project: {} as GreenHouseGaz,
    projectLoading: false,
    countries: [],
    sites: [],
    localCouch: null,
  };
}

function generateNewProject(
  newGhg: GreenHouseGaz,
  user: CouchUser
): GreenHouseGaz {
  if (!user.name) {
    // generate error
    throw new Error("User name does not exist");
  } else {
    return {
      ...newGhg,
      users: [user],
      created_by: user.name,
    };
  }
}
/** Getters */
const getters: GetterTree<ProjectsState, RootState> = {
  projects: (s): Array<GreenHouseGaz> => s.projects,
  project: (s): GreenHouseGaz | null => s.project,
  projectLoading: (s): boolean | null => s.projectLoading,
  project_REF_GRD: (
    _state,
    getters,
    _rootState,
    rootGetters
  ): ReferenceItemInterface | null => {
    const ghgMapRef = rootGetters["GhgReferenceModule/ghgMapRef"];
    const iges_grid = rootGetters["GhgReferenceIgesGridModule/items"];
    if (!ghgMapRef || !iges_grid) {
      throw new Error("GhgMapRef or igesGrid is not defined");
    }
    const REF_GRD = ghgMapRef.REF_GRD;
    const iges_grid_match = iges_grid.find(
      (el: IgesItem) => el._id === getters.project.country_code
    );
    REF_GRD.value = iges_grid_match?.value ?? REF_GRD.value; // find REF_GRD per country

    return REF_GRD;
  },
  sites: (s): Array<Site> => s.sites,
  countries: (s): Array<Country> => s.countries,
};

/** Mutations */
const mutations: MutationTree<ProjectsState> = {
  INIT_DB(state) {
    state.localCouch = new SyncDatabase(DB_NAME);
  },
  CLOSE_DB(state) {
    state.localCouch?.cancel();
  },
  SET_PROJECTS(state, value) {
    state.projects = value;
  },
  SET_PROJECT(state, value) {
    state.project = value;
  },
  SET_PROJECT_LOADING(state, value) {
    state.projectLoading = value;
  },
  SET_COUNTRIES(state, countries) {
    state.countries = countries;
  },
  SET_SITES(state, sites) {
    if (sites && sites[0] && sites[0].value) {
      state.sites = sites[0].value;
    } else {
      state.sites = [];
    }
  },
  ADD_DOC(state, value) {
    state.projects.push(value);
  },
  REMOVE_DOC(state, value) {
    const indexToRemove = state.projects.findIndex((el) => el._id === value);
    state.projects.splice(indexToRemove, 1);
  },
};

function getGenericCountries(
  queryParams: CouchQuery = {
    reduce: true,
    group: true,
    skip: 0,
    limit: 1000,
  },
  COMMIT_NAME = "SET_COUNTRIES"
) {
  return function getCountries(
    context: ActionContext<ProjectsState, RootState>
  ) {
    const db = context.state.localCouch?.remoteDB;
    if (!db) {
      throw new Error(MSG_DB_DOES_NOT_EXIST);
    }
    db?.query("project/countries_with_info", queryParams).then(function (
      result
    ) {
      if (result?.rows) {
        const countries = result.rows.filter((item) => item !== null);
        context.commit(COMMIT_NAME, countries);
        return countries;
      }
      throw new Error("undefined 'project/countries_with_info' response");
    });
  };
}

/** Action */
const actions: ActionTree<ProjectsState, RootState> = {
  syncDB: (context: ActionContext<ProjectsState, RootState>) => {
    context.commit("INIT_DB");
    // context.state.localCouch?.onChange(function () {
    //   context.dispatch("getCountries");
    // });
  },
  closeDB: (context: ActionContext<ProjectsState, RootState>) => {
    context.commit("CLOSE_DB");
  },
  getDB: (context: ActionContext<ProjectsState, RootState>) => {
    const db = context.state.localCouch?.remoteDB;
    if (db) {
      db?.query("project/list")
        .then(function (result) {
          context.commit(
            "SET_PROJECTS",
            result.rows.map((x) => x.value)
          );
        })
        .catch(function (err: Error) {
          console.log(err);
        });
    } else {
      throw new Error(MSG_DB_DOES_NOT_EXIST);
    }
  },
  getSites: getGenericCountries({}, "SET_SITES"),
  getCountries: getGenericCountries(),
  addDoc: (
    context: ActionContext<ProjectsState, RootState>,
    newGhg: GreenHouseGaz
  ) => {
    const user = context.rootGetters["UserModule/user"] as CouchUser;
    // context.commit("ADD_DOC", generateNewProject(newGhg, user));
    const value = generateNewProject(newGhg, user);
    const remoteDB = context.state.localCouch?.remoteDB;
    if (remoteDB) {
      delete value.isUNHCR;
      return remoteDB.post(value).then(() => {
        // set new rev
        return context.dispatch("getDoc", value._id);
      });
    }
  },
  removeDoc: (context: ActionContext<ProjectsState, RootState>, id) => {
    const remoteDB = context.state.localCouch?.remoteDB;
    if (!remoteDB) {
      throw new Error(MSG_DB_DOES_NOT_EXIST);
    }
    return remoteDB
      .get(id)
      .then(function (doc: PouchDB.Core.ExistingDocument<GreenHouseGaz>) {
        return remoteDB.put({ ...doc, _deleted: true });
      });
  },
  setDoc: (
    context: ActionContext<ProjectsState, RootState>,
    value: GreenHouseGaz
  ) => {
    const user = context.rootGetters["UserModule/user"] as CouchUser;
    if (!user) {
      throw new Error(MSG_USER_NOT_PRESENT);
    }
    const newValue = updateMetaFieldsForUpdate(value, user);
    context.commit("SET_PROJECT", newValue);
  },
  getDoc: (context: ActionContext<ProjectsState, RootState>, id) => {
    const db = context.state.localCouch?.remoteDB;
    if (db) {
      context.commit("SET_PROJECT_LOADING", true);
      return db
        .get(id)
        .then(function (result) {
          context.commit("SET_PROJECT", result);
          return result;
        })
        .catch(function (err: Error) {
          // context.dispatch("resetDoc");
          context.commit("SET_PROJECT_LOADING", false);
          err.message = `${err?.message} ${id}`;
          throw err;
        })
        .finally(() => {
          context.commit("SET_PROJECT_LOADING", false);
        });
    } else {
      context.commit("SET_PROJECT_LOADING", false);
      throw new Error(MSG_DB_DOES_NOT_EXIST);
    }
  },
  resetDoc: (context: ActionContext<ProjectsState, RootState>) => {
    context.commit("SET_PROJECT", {} as GreenHouseGaz);
    context.commit("SET_PROJECT_LOADING", false);
  },
  updateDoc: async (
    context: ActionContext<ProjectsState, RootState>,
    value
  ) => {
    const user = context.rootGetters["UserModule/user"] as CouchUser;
    if (!user) {
      throw new Error(MSG_USER_NOT_PRESENT);
    }
    const newValue = updateMetaFieldsForUpdate(value, user);
    delete newValue.isUNHCR;
    context.commit("SET_PROJECT", newValue);
    context.commit("SET_PROJECT_LOADING", true);
    const db = context.state.localCouch?.remoteDB;
    if (db) {
      return await db
        .put(newValue, { force: true })
        .then((response) => {
          // set new rev
          return context.dispatch("getDoc", response.id);
        })
        .catch((response) => {
          // because error, we need to dispatch doc again
          context.commit("SET_PROJECT_LOADING", false);
          context.dispatch("getDoc", newValue._id);
          throw response;
        })
        .finally(() => {
          context.commit("SET_PROJECT_LOADING", false);
        });
    } else {
      context.commit("SET_PROJECT_LOADING", false);
      throw new Error(MSG_DB_DOES_NOT_EXIST);
    }
  },
  updateLocalStore: async (
    context: ActionContext<ProjectsState, RootState>,
    value
  ) => {
    context.commit("SET_PROJECT", value);
  },
  hasDB: async (context: ActionContext<ProjectsState, RootState>) => {
    return context.state.localCouch?.remoteDB;
  },
};

/** VuexStore */
const GhgModule: Module<ProjectsState, RootState> = {
  namespaced: true,
  state: generateState(),
  getters,
  mutations,
  actions,
};

interface CouchQuery {
  reduce?: boolean;
  group?: boolean;
  skip?: number;
  limit?: number;
}

export default GhgModule;
