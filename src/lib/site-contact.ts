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
      mapQuery: "Vodbindervej 2, 9850 Hirtshals, Denmark",
      mapEmbed:
        "https://maps.google.com/maps?q=Vodbindervej+2,+9850+Hirtshals,+Denmark&z=15&output=embed",
    },
    {
      id: "copenhagen",
      cityDa: "København",
      cityEn: "Copenhagen",
      lines: ["Eskildsgade 14.2", "1657 København V", "Danmark"],
      mapQuery: "Eskildsgade 14, 1657 Copenhagen, Denmark",
      mapEmbed:
        "https://maps.google.com/maps?q=Eskildsgade+14,+1657+Copenhagen,+Denmark&z=15&output=embed",
    },
  ],
  partners: [
    {
      name: "Viktor Mejlvang",
      role: "Partner & speditør",
      phone: "+45 20 34 17 52",
      phoneTel: "+4520341752",
      email: "vm@norspedition.dk",
      photo: "/brand/team-viktor.png",
    },
    {
      name: "Victor Vendelbo",
      role: "Partner & speditør",
      phone: "+45 20 97 65 61",
      phoneTel: "+4520976561",
      email: "vv@norspedition.dk",
      photo: "/brand/team-victor.png",
    },
    {
      name: "Mathias Bruse Kristensen",
      role: "Partner & speditør",
      phone: "+45 20 96 79 63",
      phoneTel: "+4520967963",
      email: "mbk@norspedition.dk",
      photo: "/brand/team-mathias.png",
    },
  ],
} as const;
