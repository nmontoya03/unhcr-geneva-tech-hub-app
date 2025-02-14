<template>
  <main class="green-house-gaz__list" :style="computedGridTemplate">
    <v-sheet class="country-list overflow-y-auto">
      <v-container fluid>
        <v-row>
          <v-col class="country-list__actions d-flex justify-end align-center">
            <v-btn
              class="float-right"
              color="primary"
              :disabled="!$can('create')"
              text
              @click="addSurvey"
            >
              <v-icon left>$mdiPlusBox</v-icon>
              New assessment
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col justify="center">
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
    <div class="separator"></div>
    <div class="map-countries">
      <territory-map :coordinates="coordinates" @click:item="openSite" />
    </div>
    <new-survey-dialog :open.sync="siteDialog" />
  </main>
</template>

<script lang="ts">
import TerritoryMap from "@/components/commons/TerritoryMap.vue";
import NewSurveyDialog from "@/components/green_house_gaz/NewSurveyDialog.vue";
import { Site } from "@/store/GhgInterface.vue";
import { Component, Vue } from "vue-property-decorator";
import { mapActions, mapGetters } from "vuex";

@Component({
  computed: {
    ...mapGetters("GhgModule", ["sites"]),
  },
  methods: {
    ...mapActions("GhgModule", [
      "syncDB",
      "closeDB",
      "getCountries",
      "getSites",
    ]),
  },
  components: {
    TerritoryMap,
    NewSurveyDialog,
  },
})
/** ProjectList */
export default class ProjectList extends Vue {
  syncDB!: () => null;
  closeDB!: () => Promise<null>;
  getCountries!: () => Promise<null>;
  getSites!: () => Promise<null>;

  siteDialog = false;

  sites!: Site[];

  public get coordinates(): (number | undefined | Site)[][] {
    return this.sites
      .filter((site: Site) => site.lat !== undefined)
      .map((site: Site): (number | undefined | Site)[] => [
        site.lat ?? 0,
        site.lon ?? 0,
        undefined,
        site,
      ]);
  }

  mounted(): void {
    this.syncDB();
    this.getCountries();
    this.getSites();
  }

  destroyed(): void {
    this.closeDB();
  }

  get computedGridTemplate(): string {
    return "{ grid-template-columns: 50% 25px 50%; }";
  }

  public openSite(item: Site): void {
    if (item?.country_code) {
      let hash = "";
      if (this.$route.hash !== `#${item?.country_code}`) {
        hash = item?.country_code;
      }
      this.$router.push({ hash });
    }
  }

  public addSurvey(): void {
    this.siteDialog = true;
  }
}
</script>

<style lang="scss" scoped>
.green-house-gaz__list {
  $header_height: 64px;
  display: grid;
  grid-template-rows: calc(100vh - #{$header_height});
  grid-template-columns: 50% 25px 50%;
  grid-template-areas: "a b c";

  flex: 1 1 auto;
}

.country-list {
  grid-area: a;
}

.country-list__actions {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.country-list-header__title {
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
}

.country-list-header__tools {
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
}

.separator {
  grid-area: b;
  background-color: #e9ebec;
  cursor: col-resize;
  margin-left: 10px;
  margin-right: 10px;
}

.map-countries {
  grid-area: c;
  z-index: 1;
}
</style>
