export const SITE_CONTACT = {
  company: "NOR Spedition ApS",
  email: "contact@norspedition.dk",
  cvr: "46 42 72 62",
  website: "https://www.norspedition.dk",
  offices: [
    {
      id: "hirtshals",
      cityDa: "Hirtshals",
      cityEn: "Hirtshals",
      lines: ["Vodbindervej 2", "9850 Hirtshals", "Danmark"],
    },
    {
      id: "copenhagen",
      cityDa: "København",
      cityEn: "Copenhagen",
      lines: ["Eskildsgade 14.2", "1657 København V", "Danmark"],
    },
  ],
  partners: [
    {
      name: "Viktor Mejlvang",
      role: "Partner & speditør",
      phone: "+45 20 34 17 52",
      phoneTel: "+4520341752",
      email: "vm@norspedition.dk",
    },
    {
      name: "Victor Vendelbo",
      role: "Partner & speditør",
      phone: "+45 20 97 65 61",
      phoneTel: "+4520976561",
      email: "vv@norspedition.dk",
    },
    {
      name: "Mathias Bruse Kristensen",
      role: "Partner & speditør",
      phone: "+45 20 96 79 63",
      phoneTel: "+4520967963",
      email: "mbk@norspedition.dk",
    },
  ],
} as const;
