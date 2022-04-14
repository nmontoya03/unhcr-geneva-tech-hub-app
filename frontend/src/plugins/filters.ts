import { VueConstructor } from "vue";

export default {
  install(Vue: VueConstructor): void {
    Vue.filter("formatNumber", (n: number): string => {
      return Intl.NumberFormat("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(n);
    });
  },
};
