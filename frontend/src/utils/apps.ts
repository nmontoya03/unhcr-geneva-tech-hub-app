export const ghg = {
  title: "GHG assessment",
  to: "GreenHouseGaz",
  logoImg: "/app_logo/ghg.png",
  description:
    "This tool is tailored to refugee camps and settlements for calculating greenhouse gas emissions associated with energy, material and transport uses",
};

export const shelter = {
  title: "Shelter sustainability",
  to: "ShelterSustainability",
  logoImg: "/app_logo/shelter.png",
  link: "https://enacit4r-cdn.epfl.ch/unhcr-geneva-tech-hub-app/2022-04-11/houses_new.pdf",
  linkName: "A technical and environmental comparative overview of common shelter typologies found in settlements across UNHCR operations",
  description:
    "A tool supporting comparative assessments of environmental \
      impacts, technical performance, habitability and affordability of \
      shelter designs used in humanitarian relief operations.",
};
export const energy = {
  title: "Energy planning",
  to: "energy",
  logoIcon: "mdi-flash",
  description:
    "The best technology options for reliable and sustainable energy needs for different shelters based on available local options.",
};

export default [shelter, ghg, energy] as {
  title: string;
  to: string;
  logoImg?: string;
  logoIcon?: string;
  description?: string;
}[];
