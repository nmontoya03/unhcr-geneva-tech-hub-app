<template>
  <div>
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5"
          >Confirm deletion of this assessment?</v-card-title
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="deleteItemConfirm"
            >OK</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDuplicate" max-width="500px">
      <v-card>
        <v-card-title class="text-h5"
          >Confirm duplication of this assessment?</v-card-title
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="duplicateItemConfirm"
            >OK</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogToggleReference" max-width="500px">
      <v-card>
        <v-card-title class="text-h5"
          >Confirm that you want to&nbsp;
          <span v-if="editedItem.reference">unset</span>
          <span v-else>set</span> this assessment as reference?</v-card-title
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="toggleItemAsReferenceConfirm"
            >OK</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-data-table
      :headers="headersSurvey"
      :items="localProject.surveys"
      sort-by="created_at"
      hide-default-footer
      :items-per-page="-1"
      :item-class="rowClasses"
      :loading="projectLoading"
      @click:row="handleClick"
    >
      <template #[`item.created_at`]="{ item }">
        {{ item.created_at | formatDate }}
      </template>
      <template #[`item.updated_at`]="{ item }">
        {{ item.updated_at | formatDate }}
      </template>
      <template #[`item.actions`]="{ item }">
        <div class="survey-list__actions">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                v-if="
                  $can('edit', {
                    users: localProject.users,
                  })
                "
                v-bind="attrs"
                icon
                class="better-click"
                small
                v-on="on"
                @click.stop="() => duplicateItem(item)"
              >
                <v-icon small class="better-click"> $mdiContentCopy </v-icon>
              </v-btn>
            </template>
            <span>Duplicate</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                v-if="$can('delete', localProject)"
                v-bind="attrs"
                icon
                small
                class="better-click"
                v-on="on"
                @click.stop="() => deleteItem(item)"
              >
                <v-icon small class="better-click"> $mdiDelete </v-icon>
              </v-btn>
            </template>
            <span>Delete</span>
          </v-tooltip>
          <!-- show reference only as admin ? -->
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                v-if="$can('admin', localProject)"
                v-bind="attrs"
                class="better-click"
                small
                icon
                v-on="on"
                @click.stop="() => toggleItemReferenceStatus(item)"
              >
                <v-icon v-if="item.reference" small class="better-click">
                  $mdiOctagram
                </v-icon>
                <v-icon v-else small class="better-click">
                  $mdiOctagramOutline
                </v-icon>
              </v-btn>
              <span v-else v-bind="attrs" v-on="on">
                <v-icon v-if="item.reference" small> $mdiOctagram </v-icon>
              </span>
            </template>
            <div v-if="$can('admin', localProject)">
              <span v-if="!item.reference">Set as reference</span>
              <span v-else>Unset as reference</span>
            </div>
            <div v-else>
              <span v-if="item.reference">Reference</span>
            </div>
          </v-tooltip>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { getNewName, updateMetaFields } from "@/store/documentUtils";
import { GreenHouseGaz, Survey } from "@/store/GhgInterface.vue";
import { CouchUser } from "@/store/UserModule";
import { SyncDatabase } from "@/utils/couchdb";
import { cloneDeep } from "lodash";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { mapActions, mapGetters } from "vuex";

@Component({
  computed: {
    ...mapGetters("GhgModule", ["project", "projectLoading"]),
    ...mapGetters("UserModule", ["user"]),
  },
  methods: {
    ...mapActions("GhgModule", [
      "updateDoc",
      "getDoc",
      "getSites",
      "removeDoc",
      "syncDB",
      "hasDB",
      "closeDB",
    ]),
  },
})
/** ProjectItem */
export default class ProjectItem extends Vue {
  @Prop(String)
  readonly site: string | undefined;
  @Prop(String)
  readonly countryCode: string | undefined;

  syncDB!: () => null;
  hasDB!: () => Promise<SyncDatabase<GreenHouseGaz> | null>;
  getDoc!: (id: string) => null;
  removeDoc!: (id: string) => Promise<void>;
  closeDB!: () => null;
  project!: GreenHouseGaz;
  projectLoading!: boolean;
  updateDoc!: (doc: GreenHouseGaz) => Promise<void>;
  getSites!: () => Promise<null>;

  localProject = {} as GreenHouseGaz;
  user!: CouchUser;

  headersSurvey = [
    { text: "Description", value: "name" },
    { text: "Created", value: "created_at" },
    { text: "Updated", value: "updated_at" },
    {
      text: "Actions",
      value: "actions",
      sortable: false,
      align: "end",
      width: "200px",
    },
  ];

  dialog = false;
  dialogDelete = false;
  dialogDuplicate = false;
  dialogToggleReference = false;
  editedIndex = -1;
  private newDefaultItem(): Survey {
    return {
      name: "",
      created_at: new Date().toISOString(),
    } as Survey;
  }
  editedItem = this.newDefaultItem();

  public rowClasses(): string {
    return "site-row-pointer";
  }

  handleClick(item: Survey): void {
    if (
      !this.localProject._id ||
      !this.localProject.country_code ||
      !item._id
    ) {
      if (!this.localProject._id) {
        throw new Error("site _id non existing");
      }
      if (!this.localProject.country_code) {
        throw new Error("site country_code non existing");
      }
      if (!item._id) {
        throw new Error("assessment _id non existing");
      }
    }
    this.$router.push({
      name: "GreenHouseGazItemSurveyId",
      params: {
        country: encodeURIComponent(this.localProject.country_code),
        site: encodeURIComponent(this.localProject._id),
        surveyId: encodeURIComponent(item._id),
      },
      query: {
        category: "Info",
      },
    });
  }

  duplicateItem(item: Survey): void {
    this.editedIndex = this.localProject.surveys.indexOf(item);
    // get doc from database!
    // retrieve real document first (it's okay it's a survey)
    this.editedItem = cloneDeep(item) as Survey;
    this.dialogDuplicate = true;
  }

  async duplicateItemConfirm(): Promise<void> {
    this.editedItem = updateMetaFields(this.editedItem, this.user);
    this.editedItem.name = getNewName(this.editedItem.name);

    this.localProject.surveys.push(this.editedItem);
    await this.submitForm(this.localProject);
    await this.closeDialog();
  }

  deleteItem(item: Survey): void {
    this.editedIndex = this.localProject.surveys.indexOf(item);
    this.editedItem = Object.assign({}, item) as Survey;
    this.dialogDelete = true;
  }

  async deleteItemConfirm(): Promise<void> {
    this.localProject.surveys.splice(this.editedIndex, 1);
    // if surveys === [] empty we want to delete the project!
    if (this.localProject.surveys.length === 0 && this.localProject._id) {
      await this.removeDoc(this.localProject._id).then(() => {
        this.$store.dispatch("notifyUser", {
          type: "info",
          message: `successfuly removing site and its last assessment ${this.localProject.name}`,
        });
      });
      await this.getSites();
    } else {
      await this.submitForm(this.localProject);
      this.$store.dispatch("notifyUser", {
        type: "info",
        message: `successfuly removing site and its last assessment ${this.editedItem?.name}`,
      });
    }
    await this.closeDialog();
  }

  toggleItemReferenceStatus(item: Survey): void {
    this.editedIndex = this.localProject.surveys.indexOf(item);
    this.editedItem = Object.assign({}, item) as Survey;
    this.dialogToggleReference = true;
  }

  async toggleItemAsReferenceConfirm(): Promise<void> {
    this.editedItem.reference = !this.editedItem.reference;

    // copy
    let newProjectSurveys: Survey[] = [];
    newProjectSurveys = newProjectSurveys.concat(this.localProject.surveys);
    newProjectSurveys.forEach((item: Survey): void => {
      item.reference = undefined;
    });
    // replace
    this.localProject.surveys = newProjectSurveys;
    this.localProject.surveys.splice(this.editedIndex, 1, this.editedItem);
    await this.submitForm(this.localProject);
    await this.closeDialog();
  }

  closeDialog(): void {
    this.dialogDelete = false;
    this.dialogDuplicate = false;
    this.dialogToggleReference = false;
    this.$nextTick().then(() => {
      this.editedItem = this.newDefaultItem();
      this.editedIndex = -1;
    });
  }

  async save(): Promise<void> {
    if (this.editedIndex > -1) {
      Object.assign(
        this.localProject.surveys[this.editedIndex],
        this.editedItem
      );
    } else {
      this.localProject.surveys.push(this.editedItem);
    }
    const created_id = this.editedItem._id;
    await this.submitForm(this.localProject);
    // TODO: should check unicity of name
    if (this.$route.name !== "GreenHouseGazItemSurveyId") {
      await this.$router.push({
        name: "GreenHouseGazItemSurveyId",
        params: { surveyId: encodeURIComponent(created_id) },
      });
    }
  }

  public get formTitle(): string {
    return this.editedIndex === -1 ? "New assessment" : "Edit assessment";
  }

  public async submitForm(value: GreenHouseGaz): Promise<void> {
    if (value.name !== "") {
      await this.updateDoc(value);
    } else {
      throw new Error("please fill the new Name");
    }
  }

  public setLocalShelter(project: GreenHouseGaz): void {
    this.localProject = project ? cloneDeep(project) : ({} as GreenHouseGaz);
  }

  public syncLocalShelter(): void {
    // init function
    this.setLocalShelter(this.project);

    this.$store.subscribe((mutation) => {
      const shouldUpdate = ["GhgModule/SET_PROJECT"];
      if (shouldUpdate.includes(mutation.type)) {
        this.setLocalShelter(mutation.payload);
      }
    });
  }

  // watch site and trigger retrieve
  @Watch("site", { immediate: true })
  onSiteChange(newValue: string): void {
    this.hasDB().then((db: SyncDatabase<GreenHouseGaz> | null) => {
      if (db && newValue) {
        this.getDoc(newValue);
      }
    });
  }

  mounted(): void {
    this.syncDB();
    this.syncLocalShelter();
    if (this.site) {
      this.getDoc(this.site);
    }
  }
  destroyed(): void {
    this.closeDB();
  }
}
</script>

<style lang="scss" scoped>
.survey-list__actions {
  display: grid;
  justify-content: flex-end;
  align-items: center;
  grid-template-columns: repeat(3, 22px);
}

::v-deep .site-row-pointer {
  cursor: pointer;
  outline: none;
}
.better-click {
  // so to increase clickable zone
  // display: block;
  // padding: 1em;
  // margin: -1em;

  align-items: center;
  display: flex;
}
</style>
