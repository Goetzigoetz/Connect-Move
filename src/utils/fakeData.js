const COMMUNES = ["Cocody", "Youpougon", "Adjamé", "Abobo", "Koumassi"];
const LISTINGS = [
  {
    id: 1,
    title: "Appartement meublé au RDC",
    loc: "Riviéra Golf, Abidjan",
    images: [
      "https://toutsimplementdeco.com/wp-content/uploads/2019/08/12-decoration-appartement-haussmannien-chambre-lumineuse-bleu-fonc%C3%A9-gris-touche-metal.jpg",
    ],
  },
  {
    id: 2,
    title: "2 chambres salon Yopougon",
    loc: "Riviéra Golf, Abidjan",
    images: [
      "https://i.pinimg.com/originals/18/89/1a/18891a1ea492f8b48bd342f8fadfb823.jpg",
    ],
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    text: "Votre réservation a bien été confirmé(e), vous pouvez retrouver toutes les informations dans l'onglet Voyages",
    isNew: true,
    createdAt: "Jeu. 23",
  },
  {
    id: 2,
    text: "Votre avis compte énormement pour nous, pour nous laisser un commentaire, rendez-vous sur votre profil",
    isNew: false,
    createdAt: "Lun. 20",
  },
];

const TRANSACTIONS = [
  {
    id: 1,
    listingId: "4jtBiHPf9XQh3POxAwBO",
    amount: "15000",
    type: "+",
    createdAt: "2023-11-26T14:09:13+01:00",
  },
  {
    id: 2,
    listingId: "4jtBiHPf9XQh3POxAwBO",
    amount: "15000",
    type: "-",
    createdAt: "2023-11-26T14:09:13+01:00",
  },
];

export { LISTINGS, COMMUNES, NOTIFICATIONS, TRANSACTIONS };
