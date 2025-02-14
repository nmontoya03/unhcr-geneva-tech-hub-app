<template>
  <v-card flat>
    <v-card-text v-if="items">
      <v-row>
        <v-col>
          List of Grid Emission Factor from IGES (Institute for Global
          Environmental Strategies) (2023). Source:
          <a href="https://www.iges.or.jp/en/pub/list-grid-emission-factor/en"
            >https://www.iges.or.jp/en/pub/list-grid-emission-factor/en</a
          >
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-data-table dense :headers="headers" :items="items">
            <template #[`item.value`]="props">
              <span>{{ props.item.value | formatNumber }}</span>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
      <v-snackbar v-model="snack" :timeout="3000" :color="snackColor">
        {{ snackText }}

        <template #action="{ attrs }">
          <v-btn v-bind="attrs" text @click="snack = false"> Close </v-btn>
        </template>
      </v-snackbar>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { IgesItem } from "@/store/GhgReferenceIgesGridModule";
import { Component, Vue } from "vue-property-decorator";
import { mapGetters } from "vuex";

@Component({
  computed: {
    ...mapGetters("GhgReferenceIgesGridModule", ["items"]),
    ...mapGetters(["referenceDataDrawer"]),
  },
})
export default class IgesGrid extends Vue {
  items!: IgesItem[];
  snack = false;
  snackColor = "";
  snackText = "";
  max25chars = (v: string): boolean | string =>
    v.length <= 25 || "Input too long!";
  pagination = {};

  public get headers(): HeaderInterface[] {
    return [
      {
        text: "Country",
        align: "start",
        sortable: false,
        value: "name",
      },
      {
        text: "Combined Margin Grid Emission Factor (tCO2/MWh)",
        value: "value",
        width: "400px",
        align: "center",
      },
    ];
  }

  save(): void {
    this.snack = true;
    this.snackColor = "success";
    this.snackText = "Data saved";
  }
  cancel(): void {
    this.snack = true;
    this.snackColor = "error";
    this.snackText = "Canceled";
  }
  open(): void {
    this.snack = true;
    this.snackColor = "info";
    this.snackText = "Dialog opened";
  }
  close(): void {
    console.log("Dialog closed");
  }
}

interface HeaderInterface {
  text: string;
  align?: string;
  sortable?: boolean;
  value: string;
  width?: string;
}
</script>

<style></style>
