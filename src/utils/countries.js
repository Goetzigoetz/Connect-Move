const COUNTRIES = [
  {
    name: "France",
    code: "FR",
    flagUrl: "https://flagcdn.com/w320/fr.png",
  },
  {
    name: "Angleterre",
    code: "GB",
    flagUrl: "https://flagcdn.com/w320/gb.png",
  },
  {
    name: "Suisse",
    code: "CH",
    flagUrl: "https://flagcdn.com/w320/ch.png",
  },
  {
    name: "Belgique",
    code: "BE",
    flagUrl: "https://flagcdn.com/w320/be.png",
  },
  {
    name: "Afghanistan",
    code: "AF",
    flagUrl: "https://flagcdn.com/w320/af.png",
  },
  {
    name: "Afrique du Sud",
    code: "ZA",
    flagUrl: "https://flagcdn.com/w320/za.png",
  },
  {
    name: "Albanie",
    code: "AL",
    flagUrl: "https://flagcdn.com/w320/al.png",
  },
  {
    name: "Algérie",
    code: "DZ",
    flagUrl: "https://flagcdn.com/w320/dz.png",
  },
  {
    name: "Allemagne",
    code: "DE",
    flagUrl: "https://flagcdn.com/w320/de.png",
  },
  {
    name: "Andorre",
    code: "AD",
    flagUrl: "https://flagcdn.com/w320/ad.png",
  },
  {
    name: "Angola",
    code: "AO",
    flagUrl: "https://flagcdn.com/w320/ao.png",
  },
  {
    name: "Anguilla",
    code: "AI",
    flagUrl: "https://flagcdn.com/w320/ai.png",
  },
  {
    name: "Antigua-et-Barbuda",
    code: "AG",
    flagUrl: "https://flagcdn.com/w320/ag.png",
  },
  {
    name: "Arabie saoudite",
    code: "SA",
    flagUrl: "https://flagcdn.com/w320/sa.png",
  },
  {
    name: "Argentine",
    code: "AR",
    flagUrl: "https://flagcdn.com/w320/ar.png",
  },
  {
    name: "Arménie",
    code: "AM",
    flagUrl: "https://flagcdn.com/w320/am.png",
  },
  {
    name: "Australie",
    code: "AU",
    flagUrl: "https://flagcdn.com/w320/au.png",
  },
  {
    name: "Autriche",
    code: "AT",
    flagUrl: "https://flagcdn.com/w320/at.png",
  },
  {
    name: "Azerbaïdjan",
    code: "AZ",
    flagUrl: "https://flagcdn.com/w320/az.png",
  },
  {
    name: "Bahamas",
    code: "BS",
    flagUrl: "https://flagcdn.com/w320/bs.png",
  },
  {
    name: "Bahreïn",
    code: "BH",
    flagUrl: "https://flagcdn.com/w320/bh.png",
  },
  {
    name: "Bangladesh",
    code: "BD",
    flagUrl: "https://flagcdn.com/w320/bd.png",
  },
  {
    name: "Barbade",
    code: "BB",
    flagUrl: "https://flagcdn.com/w320/bb.png",
  },

  {
    name: "Belize",
    code: "BZ",
    flagUrl: "https://flagcdn.com/w320/bz.png",
  },
  {
    name: "Bénin",
    code: "BJ",
    flagUrl: "https://flagcdn.com/w320/bj.png",
  },
  {
    name: "Bermudes",
    code: "BM",
    flagUrl: "https://flagcdn.com/w320/bm.png",
  },
  {
    name: "Bhoutan",
    code: "BT",
    flagUrl: "https://flagcdn.com/w320/bt.png",
  },
  {
    name: "Biélorussie",
    code: "BY",
    flagUrl: "https://flagcdn.com/w320/by.png",
  },
  {
    name: "Birmanie",
    code: "MM",
    flagUrl: "https://flagcdn.com/w320/mm.png",
  },
  {
    name: "Bolivie",
    code: "BO",
    flagUrl: "https://flagcdn.com/w320/bo.png",
  },
  {
    name: "Bosnie-Herzégovine",
    code: "BA",
    flagUrl: "https://flagcdn.com/w320/ba.png",
  },
  {
    name: "Botswana",
    code: "BW",
    flagUrl: "https://flagcdn.com/w320/bw.png",
  },
  {
    name: "Brésil",
    code: "BR",
    flagUrl: "https://flagcdn.com/w320/br.png",
  },
  {
    name: "Brunéi",
    code: "BN",
    flagUrl: "https://flagcdn.com/w320/bn.png",
  },
  {
    name: "Bulgarie",
    code: "BG",
    flagUrl: "https://flagcdn.com/w320/bg.png",
  },
  {
    name: "Burkina Faso",
    code: "BF",
    flagUrl: "https://flagcdn.com/w320/bf.png",
  },
  {
    name: "Cambodge",
    code: "KH",
    flagUrl: "https://flagcdn.com/w320/kh.png",
  },
  {
    name: "Cameroun",
    code: "CM",
    flagUrl: "https://flagcdn.com/w320/cm.png",
  },
  {
    name: "Canada",
    code: "CA",
    flagUrl: "https://flagcdn.com/w320/ca.png",
  },
  {
    name: "Cap-Vert",
    code: "CV",
    flagUrl: "https://flagcdn.com/w320/cv.png",
  },
  {
    name: "Chili",
    code: "CL",
    flagUrl: "https://flagcdn.com/w320/cl.png",
  },
  {
    name: "Chine",
    code: "CN",
    flagUrl: "https://flagcdn.com/w320/cn.png",
  },
  {
    name: "Chypre",
    code: "CY",
    flagUrl: "https://flagcdn.com/w320/cy.png",
  },
  {
    name: "Colombie",
    code: "CO",
    flagUrl: "https://flagcdn.com/w320/co.png",
  },
  {
    name: "Comores",
    code: "KM",
    flagUrl: "https://flagcdn.com/w320/km.png",
  },
  {
    name: "Congo (RDC)",
    code: "CD",
    flagUrl: "https://flagcdn.com/w320/cd.png",
  },
  {
    name: "Congo (RC)",
    code: "CG",
    flagUrl: "https://flagcdn.com/w320/cg.png",
  },
  {
    name: "Corée du Nord",
    code: "KP",
    flagUrl: "https://flagcdn.com/w320/kp.png",
  },
  {
    name: "Corée du Sud",
    code: "KR",
    flagUrl: "https://flagcdn.com/w320/kr.png",
  },
  {
    name: "Costa Rica",
    code: "CR",
    flagUrl: "https://flagcdn.com/w320/cr.png",
  },
  {
    name: "Côte d'Ivoire",
    code: "CI",
    flagUrl: "https://flagcdn.com/w320/ci.png",
  },
  {
    name: "Croatie",
    code: "HR",
    flagUrl: "https://flagcdn.com/w320/hr.png",
  },
  {
    name: "Cuba",
    code: "CU",
    flagUrl: "https://flagcdn.com/w320/cu.png",
  },
  {
    name: "Danemark",
    code: "DK",
    flagUrl: "https://flagcdn.com/w320/dk.png",
  },
  {
    name: "Djibouti",
    code: "DJ",
    flagUrl: "https://flagcdn.com/w320/dj.png",
  },
  {
    name: "Dominique",
    code: "DM",
    flagUrl: "https://flagcdn.com/w320/dm.png",
  },
  {
    name: "Égypte",
    code: "EG",
    flagUrl: "https://flagcdn.com/w320/eg.png",
  },
  {
    name: "Émirats arabes unis",
    code: "AE",
    flagUrl: "https://flagcdn.com/w320/ae.png",
  },
  {
    name: "Équateur",
    code: "EC",
    flagUrl: "https://flagcdn.com/w320/ec.png",
  },
  {
    name: "Espagne",
    code: "ES",
    flagUrl: "https://flagcdn.com/w320/es.png",
  },
  {
    name: "Estonie",
    code: "EE",
    flagUrl: "https://flagcdn.com/w320/ee.png",
  },
  {
    name: "Eswatini",
    code: "SZ",
    flagUrl: "https://flagcdn.com/w320/sz.png",
  },
  {
    name: "États-Unis",
    code: "US",
    flagUrl: "https://flagcdn.com/w320/us.png",
  },
  {
    name: "Fidji",
    code: "FJ",
    flagUrl: "https://flagcdn.com/w320/fj.png",
  },
  {
    name: "Finlande",
    code: "FI",
    flagUrl: "https://flagcdn.com/w320/fi.png",
  },

  {
    name: "Gabon",
    code: "GA",
    flagUrl: "https://flagcdn.com/w320/ga.png",
  },
  {
    name: "Gambie",
    code: "GM",
    flagUrl: "https://flagcdn.com/w320/gm.png",
  },
  {
    name: "Géorgie",
    code: "GE",
    flagUrl: "https://flagcdn.com/w320/ge.png",
  },
  {
    name: "Ghana",
    code: "GH",
    flagUrl: "https://flagcdn.com/w320/gh.png",
  },
  {
    name: "Grèce",
    code: "GR",
    flagUrl: "https://flagcdn.com/w320/gr.png",
  },
  {
    name: "Grenade",
    code: "GD",
    flagUrl: "https://flagcdn.com/w320/gd.png",
  },
  {
    name: "Guatemala",
    code: "GT",
    flagUrl: "https://flagcdn.com/w320/gt.png",
  },
  {
    name: "Guinée-Bissau",
    code: "GW",
    flagUrl: "https://flagcdn.com/w320/gw.png",
  },
  {
    name: "Guyane",
    code: "GY",
    flagUrl: "https://flagcdn.com/w320/gy.png",
  },
  {
    name: "Honduras",
    code: "HN",
    flagUrl: "https://flagcdn.com/w320/hn.png",
  },
  {
    name: "Hong Kong",
    code: "HK",
    flagUrl: "https://flagcdn.com/w320/hk.png",
  },
  {
    name: "Hongrie",
    code: "HU",
    flagUrl: "https://flagcdn.com/w320/hu.png",
  },
  {
    name: "Îles Caïmans",
    code: "KY",
    flagUrl: "https://flagcdn.com/w320/ky.png",
  },
  {
    name: "Îles Salomon",
    code: "SB",
    flagUrl: "https://flagcdn.com/w320/sb.png",
  },
  {
    name: "Îles Turques-et-Caïques",
    code: "TC",
    flagUrl: "https://flagcdn.com/w320/tc.png",
  },
  {
    name: "Îles Vierges britanniques",
    code: "VG",
    flagUrl: "https://flagcdn.com/w320/vg.png",
  },
  {
    name: "Inde",
    code: "IN",
    flagUrl: "https://flagcdn.com/w320/in.png",
  },
  {
    name: "Indonésie",
    code: "ID",
    flagUrl: "https://flagcdn.com/w320/id.png",
  },
  {
    name: "Irak",
    code: "IQ",
    flagUrl: "https://flagcdn.com/w320/iq.png",
  },
  {
    name: "Irlande",
    code: "IE",
    flagUrl: "https://flagcdn.com/w320/ie.png",
  },
  {
    name: "Islande",
    code: "IS",
    flagUrl: "https://flagcdn.com/w320/is.png",
  },
  {
    name: "Israël",
    code: "IL",
    flagUrl: "https://flagcdn.com/w320/il.png",
  },
  {
    name: "Italie",
    code: "IT",
    flagUrl: "https://flagcdn.com/w320/it.png",
  },
  {
    name: "Jamaïque",
    code: "JM",
    flagUrl: "https://flagcdn.com/w320/jm.png",
  },
  {
    name: "Japon",
    code: "JP",
    flagUrl: "https://flagcdn.com/w320/jp.png",
  },
  {
    name: "Jordanie",
    code: "JO",
    flagUrl: "https://flagcdn.com/w320/jo.png",
  },
  {
    name: "Kazakhstan",
    code: "KZ",
    flagUrl: "https://flagcdn.com/w320/kz.png",
  },
  {
    name: "Kenya",
    code: "KE",
    flagUrl: "https://flagcdn.com/w320/ke.png",
  },
  {
    name: "Kirghizistan",
    code: "KG",
    flagUrl: "https://flagcdn.com/w320/kg.png",
  },
  {
    name: "Kosovo",
    code: "XK",
    flagUrl: "https://flagcdn.com/w320/xk.png",
  },
  {
    name: "Koweït",
    code: "KW",
    flagUrl: "https://flagcdn.com/w320/kw.png",
  },
  {
    name: "Laos",
    code: "LA",
    flagUrl: "https://flagcdn.com/w320/la.png",
  },
  {
    name: "Lettonie",
    code: "LV",
    flagUrl: "https://flagcdn.com/w320/lv.png",
  },
  {
    name: "Liban",
    code: "LB",
    flagUrl: "https://flagcdn.com/w320/lb.png",
  },
  {
    name: "Libéria",
    code: "LR",
    flagUrl: "https://flagcdn.com/w320/lr.png",
  },
  {
    name: "Libye",
    code: "LY",
    flagUrl: "https://flagcdn.com/w320/ly.png",
  },
  {
    name: "Lituanie",
    code: "LT",
    flagUrl: "https://flagcdn.com/w320/lt.png",
  },
  {
    name: "Luxembourg",
    code: "LU",
    flagUrl: "https://flagcdn.com/w320/lu.png",
  },
  {
    name: "Macao",
    code: "MO",
    flagUrl: "https://flagcdn.com/w320/mo.png",
  },
  {
    name: "Macédoine du Nord",
    code: "MK",
    flagUrl: "https://flagcdn.com/w320/mk.png",
  },
  {
    name: "Madagascar",
    code: "MG",
    flagUrl: "https://flagcdn.com/w320/mg.png",
  },
  {
    name: "Malaisie",
    code: "MY",
    flagUrl: "https://flagcdn.com/w320/my.png",
  },
  {
    name: "Malawi",
    code: "MW",
    flagUrl: "https://flagcdn.com/w320/mw.png",
  },
  {
    name: "Maldives",
    code: "MV",
    flagUrl: "https://flagcdn.com/w320/mv.png",
  },
  {
    name: "Mali",
    code: "ML",
    flagUrl: "https://flagcdn.com/w320/ml.png",
  },
  {
    name: "Malte",
    code: "MT",
    flagUrl: "https://flagcdn.com/w320/mt.png",
  },
  {
    name: "Maroc",
    code: "MA",
    flagUrl: "https://flagcdn.com/w320/ma.png",
  },
  {
    name: "Maurice",
    code: "MU",
    flagUrl: "https://flagcdn.com/w320/mu.png",
  },
  {
    name: "Mauritanie",
    code: "MR",
    flagUrl: "https://flagcdn.com/w320/mr.png",
  },
  {
    name: "Mexique",
    code: "MX",
    flagUrl: "https://flagcdn.com/w320/mx.png",
  },
  {
    name: "Micronésie",
    code: "FM",
    flagUrl: "https://flagcdn.com/w320/fm.png",
  },
  {
    name: "Moldavie",
    code: "MD",
    flagUrl: "https://flagcdn.com/w320/md.png",
  },
  {
    name: "Mongolie",
    code: "MN",
    flagUrl: "https://flagcdn.com/w320/mn.png",
  },
  {
    name: "Monténégro",
    code: "ME",
    flagUrl: "https://flagcdn.com/w320/me.png",
  },
  {
    name: "Montserrat",
    code: "MS",
    flagUrl: "https://flagcdn.com/w320/ms.png",
  },
  {
    name: "Mozambique",
    code: "MZ",
    flagUrl: "https://flagcdn.com/w320/mz.png",
  },
  {
    name: "Namibie",
    code: "NA",
    flagUrl: "https://flagcdn.com/w320/na.png",
  },
  {
    name: "Nauru",
    code: "NR",
    flagUrl: "https://flagcdn.com/w320/nr.png",
  },
  {
    name: "Nicaragua",
    code: "NI",
    flagUrl: "https://flagcdn.com/w320/ni.png",
  },
  {
    name: "Niger",
    code: "NE",
    flagUrl: "https://flagcdn.com/w320/ne.png",
  },
  {
    name: "Norvège",
    code: "NO",
    flagUrl: "https://flagcdn.com/w320/no.png",
  },
  {
    name: "Nouvelle-Zélande",
    code: "NZ",
    flagUrl: "https://flagcdn.com/w320/nz.png",
  },
  {
    name: "Oman",
    code: "OM",
    flagUrl: "https://flagcdn.com/w320/om.png",
  },
  {
    name: "Ouganda",
    code: "UG",
    flagUrl: "https://flagcdn.com/w320/ug.png",
  },
  {
    name: "Ouzbékistan",
    code: "UZ",
    flagUrl: "https://flagcdn.com/w320/uz.png",
  },
  {
    name: "Pakistan",
    code: "PK",
    flagUrl: "https://flagcdn.com/w320/pk.png",
  },
  {
    name: "Palaos",
    code: "PW",
    flagUrl: "https://flagcdn.com/w320/pw.png",
  },
  {
    name: "Panama",
    code: "PA",
    flagUrl: "https://flagcdn.com/w320/pa.png",
  },
  {
    name: "Papouasie-Nouvelle-Guinée",
    code: "PG",
    flagUrl: "https://flagcdn.com/w320/pg.png",
  },
  {
    name: "Paraguay",
    code: "PY",
    flagUrl: "https://flagcdn.com/w320/py.png",
  },
  {
    name: "Pays-Bas",
    code: "NL",
    flagUrl: "https://flagcdn.com/w320/nl.png",
  },
  {
    name: "Pérou",
    code: "PE",
    flagUrl: "https://flagcdn.com/w320/pe.png",
  },
  {
    name: "Philippines",
    code: "PH",
    flagUrl: "https://flagcdn.com/w320/ph.png",
  },
  {
    name: "Pologne",
    code: "PL",
    flagUrl: "https://flagcdn.com/w320/pl.png",
  },
  {
    name: "Portugal",
    code: "PT",
    flagUrl: "https://flagcdn.com/w320/pt.png",
  },
  {
    name: "Qatar",
    code: "QA",
    flagUrl: "https://flagcdn.com/w320/qa.png",
  },
  {
    name: "République démocratique du Congo",
    code: "CD",
    flagUrl: "https://flagcdn.com/w320/cd.png",
  },
  {
    name: "République dominicaine",
    code: "DO",
    flagUrl: "https://flagcdn.com/w320/do.png",
  },
  {
    name: "République du Congo",
    code: "CG",
    flagUrl: "https://flagcdn.com/w320/cg.png",
  },
  {
    name: "République tchèque",
    code: "CZ",
    flagUrl: "https://flagcdn.com/w320/cz.png",
  },
  {
    name: "Roumanie",
    code: "RO",
    flagUrl: "https://flagcdn.com/w320/ro.png",
  },

  {
    name: "Russie",
    code: "RU",
    flagUrl: "https://flagcdn.com/w320/ru.png",
  },
  {
    name: "Rwanda",
    code: "RW",
    flagUrl: "https://flagcdn.com/w320/rw.png",
  },
  {
    name: "Saint-Christophe-et-Niévès",
    code: "KN",
    flagUrl: "https://flagcdn.com/w320/kn.png",
  },
  {
    name: "Saint-Vincent-et-les-Grenadines",
    code: "VC",
    flagUrl: "https://flagcdn.com/w320/vc.png",
  },
  {
    name: "Sainte-Lucie",
    code: "LC",
    flagUrl: "https://flagcdn.com/w320/lc.png",
  },
  {
    name: "Salvador",
    code: "SV",
    flagUrl: "https://flagcdn.com/w320/sv.png",
  },
  {
    name: "Sao Tomé-et-Principe",
    code: "ST",
    flagUrl: "https://flagcdn.com/w320/st.png",
  },
  {
    name: "Sénégal",
    code: "SN",
    flagUrl: "https://flagcdn.com/w320/sn.png",
  },
  {
    name: "Serbie",
    code: "RS",
    flagUrl: "https://flagcdn.com/w320/rs.png",
  },
  {
    name: "Seychelles",
    code: "SC",
    flagUrl: "https://flagcdn.com/w320/sc.png",
  },
  {
    name: "Sierra Leone",
    code: "SL",
    flagUrl: "https://flagcdn.com/w320/sl.png",
  },
  {
    name: "Singapour",
    code: "SG",
    flagUrl: "https://flagcdn.com/w320/sg.png",
  },
  {
    name: "Slovaquie",
    code: "SK",
    flagUrl: "https://flagcdn.com/w320/sk.png",
  },
  {
    name: "Slovénie",
    code: "SI",
    flagUrl: "https://flagcdn.com/w320/si.png",
  },
  {
    name: "Sri Lanka",
    code: "LK",
    flagUrl: "https://flagcdn.com/w320/lk.png",
  },
  {
    name: "Suède",
    code: "SE",
    flagUrl: "https://flagcdn.com/w320/se.png",
  },

  {
    name: "Tadjikistan",
    code: "TJ",
    flagUrl: "https://flagcdn.com/w320/tj.png",
  },
  {
    name: "Taïwan",
    code: "TW",
    flagUrl: "https://flagcdn.com/w320/tw.png",
  },
  {
    name: "Tanzanie",
    code: "TZ",
    flagUrl: "https://flagcdn.com/w320/tz.png",
  },
  {
    name: "Tchad",
    code: "TD",
    flagUrl: "https://flagcdn.com/w320/td.png",
  },
  {
    name: "Thaïlande",
    code: "TH",
    flagUrl: "https://flagcdn.com/w320/th.png",
  },
  {
    name: "Tonga",
    code: "TO",
    flagUrl: "https://flagcdn.com/w320/to.png",
  },
  {
    name: "Trinité-et-Tobago",
    code: "TT",
    flagUrl: "https://flagcdn.com/w320/tt.png",
  },
  {
    name: "Tunisie",
    code: "TN",
    flagUrl: "https://flagcdn.com/w320/tn.png",
  },
  {
    name: "Turkménistan",
    code: "TM",
    flagUrl: "https://flagcdn.com/w320/tm.png",
  },
  {
    name: "Turquie",
    code: "TR",
    flagUrl: "https://flagcdn.com/w320/tr.png",
  },
  {
    name: "Ukraine",
    code: "UA",
    flagUrl: "https://flagcdn.com/w320/ua.png",
  },
  {
    name: "Uruguay",
    code: "UY",
    flagUrl: "https://flagcdn.com/w320/uy.png",
  },
  {
    name: "Vanuatu",
    code: "VU",
    flagUrl: "https://flagcdn.com/w320/vu.png",
  },
  {
    name: "Venezuela",
    code: "VE",
    flagUrl: "https://flagcdn.com/w320/ve.png",
  },
  {
    name: "Vietnam",
    code: "VN",
    flagUrl: "https://flagcdn.com/w320/vn.png",
  },
  {
    name: "Yémen",
    code: "YE",
    flagUrl: "https://flagcdn.com/w320/ye.png",
  },
  {
    name: "Zimbabwe",
    code: "ZW",
    flagUrl: "https://flagcdn.com/w320/zw.png",
  },
];
export { COUNTRIES };
