export const ghg = {
  title: "GHG Emission Calculator",
  to: "GreenHouseGaz",
  logoIcon: "$vuetify.icon.ghg",
  description:
    "This tool is tailored to refugee camps and settlements for calculating greenhouse gas emissions associated with energy, material and transport uses.<br/>The GHG Emission Calculator only considers Scope 1 and 2 emissions at this stage. The calculations are estimations. For solar in particular, it is assumed that the addition of solar panels will add zero emissions.",
};

export const shelter = {
  title: "Shelter and Sustainability",
  to: "ShelterSustainability",
  logoIcon: "$vuetify.icon.shelter",
  link: "https://enacit4r-cdn.epfl.ch/unhcr-geneva-tech-hub-app/2023-03-10/Shelter.Sustainability.Manual.pdf",
  linkName:
    "A technical and environmental comparative overview of common shelter typologies found in settlements across UNHCR operations",
  description:
    "A tool supporting comparative assessments of environmental \
      impacts, technical performance, habitability and affordability of \
      shelter designs used in humanitarian relief operations.",
};
export default [shelter, ghg] as {
  title: string;
  to: string;
  logoIcon: string;
  description?: string;
}[];
