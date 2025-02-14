<template>
  <v-card elevation="2" rounded>
    <v-card-title>
      <h3 class="baseline-title font-weight-medium">Baseline</h3>
    </v-card-title>
    <v-card-text>
      <instance-table
        :items="baseline.items"
        :results="baseline.results"
        :disabled="!baselineMode"
        :headers="headers"
        :name="name"
        @update:items="updateBaselineItems"
      />
    </v-card-text>
    <v-card-actions>
      <v-container class="d-flex flex-column" fluid>
        <v-row v-if="baseline.results.totalCO2Emission !== undefined">
          <v-col cols="6" class="d-flex justify-end">
            <instance-pie-chart
              v-if="activatePie"
              :diff-dimension="diffDimension"
              :results="baseline.results"
            />
          </v-col>
          <v-col cols="6">
            <v-row>
              <v-col class="d-flex justify-end mx-2 mb-2">
                <h3>
                  Total CO2 Emissions:
                  {{
                    baseline.results.totalCO2Emission |
                      formatNumber({
                        suffix: "tCO2e/year",
                      })
                  }}
                </h3>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="d-flex justify-end mx-2 mb-2">
                <h4>
                  These calculations are limited to Scope 1 and Scope 2 sources
                  of emissions for purposes of simplicity.
                </h4>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="d-flex justify-end mx-2 mb-2">
                <v-btn @click="toggleBaselineMode">
                  {{ baselineSwitchText }}
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import InstancePieChart from "@/components/green_house_gaz/generic/InstancePieChart.vue";
import InstanceTable from "@/components/green_house_gaz/generic/InstanceTable.vue";
import { SurveyTableHeader } from "@/components/green_house_gaz/generic/surveyTableHeader";
import {
  GenericBaseline,
  SurveyInput,
  SurveyItem,
  SurveyResult,
} from "@/store/GhgInterface.vue";
import { cloneDeep } from "lodash";
import Vue from "vue";
import "vue-class-component/hooks";
import { Component, Prop } from "vue-property-decorator";

@Component({
  components: {
    InstanceTable,
    InstancePieChart,
  },
})
export default class BaselineCard extends Vue {
  @Prop([Object, Array])
  readonly baseline!: GenericBaseline<SurveyItem, SurveyResult>;
  @Prop([Boolean])
  readonly baselineMode!: boolean;
  @Prop([String])
  readonly diffDimension!: keyof SurveyInput;
  @Prop([String])
  readonly name!: string;
  @Prop([Array])
  readonly headers!: SurveyTableHeader;
  @Prop({ type: Boolean, default: false })
  readonly activatePie!: boolean;

  public toggleBaselineMode(): void {
    this.$emit("update:baselineMode", !this.baselineMode);
  }
  public get baselineSwitchText(): string {
    return this.baselineMode ? "Save baseline" : "Edit baseline";
  }
  public updateBaselineItems(value: SurveyItem[]) {
    const newBaseline = cloneDeep(this.baseline);
    newBaseline.items = value;
    this.$emit("update:baseline", newBaseline);
  }
}
</script>

<style lang="scss" scoped>
.baseline-title {
  color: rgba(32, 135, 200, 1);
}
</style>
