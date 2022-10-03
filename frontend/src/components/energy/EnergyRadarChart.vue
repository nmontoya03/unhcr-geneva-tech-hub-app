<template>
  <v-responsive aspect-ratio="1">
    <v-chart
      ref="chart"
      autoresize
      :init-options="initOptions"
      :option="option"
    ></v-chart>
  </v-responsive>
</template>

<script lang="ts">
import { cccmColors } from "@/plugins/vuetify";
import { decodeDataUrl } from "@/utils/energy";
import { RadarChart } from "echarts/charts";
import { LegendComponent, TitleComponent } from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { EChartsOption, EChartsType } from "echarts/types/dist/shared";
import "vue-class-component/hooks";
import VChart from "vue-echarts";
import { Component, Prop, Ref, Vue } from "vue-property-decorator";

use([SVGRenderer, RadarChart, LegendComponent, TitleComponent]);

@Component({
  components: {
    VChart,
  },
})
export default class EnergyRadarChart<
  T extends Record<string, number> = Record<string, number>
> extends Vue {
  readonly initOptions = {
    renderer: "svg",
  };
  @Prop(String)
  readonly title: string | undefined;
  @Prop({
    type: Array as () => RadarItem<T>[],
    default: () => [],
  })
  readonly items!: RadarItem<T>[];
  @Prop({ type: Array as () => RadarProperty<T>[], default: () => [] })
  readonly properties!: RadarProperty<T>[];
  @Ref()
  readonly chart!: EChartsType;

  get option(): EChartsOption {
    return {
      title: {
        text: this.title,
        left: "center",
      },
      legend: {
        data: this.items.map((item) => item.name),
      },
      radar: {
        indicator: this.properties.map((property) => ({
          name: property.name,
          max: property.max,
        })),
        radius: "40%",
        axisName: {
          fontSize: 8,
        },
      },
      series: {
        type: "radar",
        data: this.items.map((item) => ({
          name: item.name,
          value: this.properties.map((property) => item.value[property.key]),
        })),
      },
      color: [cccmColors.primary, cccmColors.primary50],
    };
  }

  getSvgData(): string {
    return decodeDataUrl(this.chart.getDataURL());
  }
}

export interface RadarItem<T> {
  name: string;
  value: T;
}

export interface RadarProperty<T> {
  name: string;
  key: keyof T;
  max?: number;
}
</script>
