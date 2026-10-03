/**
 * Authoritative Kenyan County -> Sub-County -> Location/Area Hierarchy
 * Calibrated for agricultural and urban logistics across Kenya.
 */

export const KENYA_LOCATION_DATA: Record<string, Record<string, string[]>> = {
  "Nairobi": {
    "Kasarani": ["Mwiki", "Clay City", "Njiru", "Kasarani Central", "Hunters", "Santon", "Clay Works", "Season", "Maternity"],
    "Roysambu": ["Roysambu", "Zimmerman", "Kahawa West", "Githurai 44", "Garden Estate", "Lumumba Drive", "Mirema"],
    "Ruaraka": ["Babadogo", "Utalii", "Mathare North", "Lucky Summer", "Korogocho"],
    "Westlands": ["Parklands", "Kitisuru", "Kangemi", "Mountain View", "Highridge", "Rhapta Road", "Westlands CBD"],
    "Dagoretti North": ["Kilimani", "Kawangware", "Gatina", "Kileleshwa", "Lavington", "Riara"],
    "Dagoretti South": ["Waithaka", "Riruta", "Uthiru", "Mutu-ini", "Ng'ando"],
    "Lang'ata": ["Karen", "Nairobi West", "South C", "Mugumo-ini", "Nyayo Highrise", "Dam Estate"],
    "Kibra": ["Laini Saba", "Lindi", "Makina", "Woodley", "Sarang'ombe"],
    "Embakasi East": ["Utawala", "Embakasi", "Mihango", "Lower Savanna", "Upper Savanna"],
    "Embakasi West": ["Umoja 1", "Umoja 2", "Mowlem", "Kariobangi South", "Innercore"],
    "Embakasi Central": ["Kayole North", "Kayole Central", "Kayole South", "Komarock", "Matopeni"],
    "Embakasi South": ["Imara Daima", "Kwa Njenga", "Kwa Reuben", "Pipeline", "Kware"],
    "Embakasi North": ["Kariobangi North", "Dandora Area 1", "Dandora Area 2", "Dandora Area 3", "Dandora Area 4"],
    "Makadara": ["Maringo", "Hamza", "Viwandani", "Harambee", "Makongeni", "Buruburu"],
    "Kamukunji": ["Eastleigh North", "Eastleigh South", "Pumwani", "Airbase", "California"],
    "Starehe": ["CBD", "Ngara", "Pangani", "Ziwani", "Kariokor", "Landimawe", "South B"],
    "Mathare": ["Huruma", "Ngei", "Mabatini", "Mlango Kubwa", "Kiamaiko"]
  },
  "Kiambu": {
    "Ruiru": ["Kimbo", "Kahawa Sukari", "Kahawa Wendani", "Membley", "Mugutha", "Toll", "Ruiru Town", "Kenyatta Road"],
    "Thika": ["Thika Town", "Makongeni", "Ngoingwa", "Section 9", "Landless", "Kite", "Kenyatta Highway"],
    "Juja": ["Juja Town", "Kalimoni", "Juja Farm", "Mirimaini", "High Point", "Gachororo"],
    "Kiambu Town": ["Kiambu CBD", "Ndumberi", "Riabai", "Ting'ang'a", "Kirigiti"],
    "Kikuyu": ["Kikuyu Town", "Kinoo", "Sigona", "Karai", "Nachu", "Ondire"],
    "Limuru": ["Limuru Town", "Rironi", "Ngecha", "Tigoni", "Bibirioni"],
    "Kabete": ["Uthiru", "Wangige", "Lower Kabete", "Gitaru", "Nyathuna"],
    "Githunguri": ["Githunguri Town", "Ikinu", "Kagwe", "Komothai", "Ngewa"],
    "Gatundu South": ["Gatundu Town", "Kiganjo", "Kiamwangi", "Ndendaru"],
    "Gatundu North": ["Kamwangi", "Mang'u", "Gituamba", "Chania"],
    "Lari": ["Kijabe", "Kimende", "Kinale", "Nyanduma"]
  },
  "Nakuru": {
    "Nakuru East": ["CBD", "Section 58", "Free Area", "Flamingo", "Menengai", "Naka"],
    "Nakuru West": ["Kaptembwo", "Shabab", "London", "Barut", "Rhoda"],
    "Naivasha": ["Naivasha Town", "Karagita", "Mai Mahiu", "Kinungi", "Kayole Naivasha", "Hells Gate"],
    "Gilgil": ["Gilgil Town", "Elementaita", "Kariandusi", "Langalanga"],
    "Molo": ["Molo Town", "Elburgon", "Mariashoni", "Sachangwan"],
    "Njoro": ["Njoro Town", "Egerton", "Mauche", "Lare", "Kihingo"],
    "Rongai": ["Rongai Town", "Kampi ya Moto", "Visoi", "Menengai West"],
    "Subukia": ["Subukia Town", "Waseges", "Kabazi"],
    "Bahati": ["Bahati Center", "Kiamaina", "Lanet"]
  },
  "Machakos": {
    "Mavoko": ["Syokimau", "Mlolongo", "Athi River Town", "Katani", "Sabaki", "Kinanie", "Daystar"],
    "Machakos Town": ["Machakos CBD", "Muvuti", "Mutituni", "Katoloni", "Lukenya", "Kiima Kimwe"],
    "Kangundo": ["Kangundo Town", "Matungulu", "Tala", "Kalandini", "Kanzalu"],
    "Matungulu": ["Tala", "Nguluni", "Sengani", "Koma Rock"],
    "Kathiani": ["Kathiani Town", "Mitaboni", "Kaewa", "Iveti"],
    "Yatta": ["Matuu", "Kithimani", "Ikombe", "Ndalani"],
    "Mwala": ["Makutano", "Mbiuni", "Masii", "Kibauni"]
  },
  "Uasin Gishu": {
    "Turbo": ["Eldoret CBD", "Huruma", "Maili Nne", "Kamukunji", "Kapsoya", "Junction"],
    "Ainabkoi": ["Kapsoya", "Kaptagat", "Ainabkoi Town", "Illula"],
    "Kapseret": ["Langas", "Simat", "Ngeria", "Airport Area", "Lemook"],
    "Kesses": ["Moi University", "Cheptiret", "Tulwet", "Racecourse"],
    "Moiben": ["Moiben Town", "Karuna", "Sergoit", "Kimumu"],
    "Soy": ["Soy Town", "Ziwa", "Eldoret North", "Kipsomba"]
  },
  "Kajiado": {
    "Kajiado North": ["Ngong", "Ongata Rongai", "Kiserian", "Matasia", "Nkoroi", "Oloolua"],
    "Kajiado East": ["Kitengela", "Isinya", "Kaputiei North", "Kisaju", "Oloosirkon"],
    "Kajiado Central": ["Kajiado Town", "Dalalekutuk", "Matapato", "Purko"],
    "Kajiado West": ["Magadi", "Ewuaso", "Mosiro", "Keekonyokie"],
    "Kajiado South": ["Loitokitok", "Rombo", "Kimana", "Entonet"]
  },
  "Mombasa": {
    "Mvita": ["Mombasa CBD", "Old Town", "Ganjoni", "Majengo", "Tudor", "Kizingo"],
    "Nyali": ["Nyali Beach", "Kongowea", "Frere Town", "Links Road", "Cinemax", "Maweni"],
    "Kisauni": ["Bamburi", "Mwandoni", "Magogoni", "Mtopanga", "Utange", "Vescon"],
    "Likoni": ["Likoni Ferry", "Shelly Beach", "Mtongwe", "Bofu", "Timbwani"],
    "Changamwe": ["Changamwe", "Port Reitz", "Chaani", "Airport Road", "Kipevu"],
    "Jomvu": ["Mikindani", "Jomvu Kuu", "Miritini", "Aldina"]
  },
  "Kisumu": {
    "Kisumu Central": ["Kisumu CBD", "Milimani", "Kondele", "Migosi", "Nyalenda", "Robert Ouko"],
    "Kisumu East": ["Kajulu", "Kolwa East", "Kolwa Central", "Manyatta", "Riat"],
    "Kisumu West": ["Kisian", "Ojolla", "South West Kisumu", "Maseno"],
    "Nyando": ["Ahero", "Awasi", "Kabonyo", "Kakola"],
    "Muhoroni": ["Muhoroni Town", "Koru", "Chemelil", "Miwani"]
  },
  "Meru": {
    "Imenti North": ["Meru CBD", "Makutano", "Kaaga", "Gakoromone", "Ntima", "Gitimbine"],
    "Imenti South": ["Nkubu", "Igoji", "Mitunguu", "Abogeta"],
    "Imenti Central": ["Githongo", "Abothuguchi", "Kariene", "Kiagu"],
    "Buuri": ["Timau", "Ruarera", "Kibirichia", "Kiirua"],
    "Tigania East": ["Mikinduri", "Kiguchwa", "Muthara"],
    "Tigania West": ["Uringu", "Mbeu", "Akithi"]
  },
  "Nyeri": {
    "Nyeri Town": ["Nyeri CBD", "Skuta", "King'ong'o", "Kamakwa", "Ruring'u", "Gatitu"],
    "Tetu": ["Wamagana", "Ihururu", "Aguthi", "Thigingi"],
    "Mathira": ["Karatina Town", "Magutu", "Iria-ini", "Kirimukuyu", "Kibingoti"],
    "Othaya": ["Othaya Town", "Chinga", "Mahiga", "Iriaini"],
    "Mukurweini": ["Mukurweini Town", "Gikondi", "Rugi"],
    "Kieni": ["Mweiga", "Naro Moru", "Gakawa", "Endarasha"]
  },
  "Murang'a": {
    "Kiharu": ["Murang'a Town", "Mbiri", "Mugoiri", "Gaturi", "Muriranjas"],
    "Maragua": ["Maragua Town", "Saba Saba", "Kambiti", "Ichagaki", "Gakoigo"],
    "Kandara": ["Kandara Town", "Muruka", "Kagunduini", "Gaichanjiru"],
    "Gatanga": ["Gatanga", "Kakuzi", "Mugumo-ini", "Kihumbu-ini"],
    "Kigumo": ["Kigumo Town", "Kangari", "Kinyona"]
  },
  "Trans Nzoia": {
    "Kiminini": ["Kiminini Town", "Waitaluk", "Sirende", "Hospital Area"],
    "Cherangany": ["Makutano", "Motosiet", "Sitatunga", "Kachibora"],
    "Saboti": ["Kitale CBD", "Tuwani", "Matisi", "Mitume", "Kibomet"],
    "Kwanza": ["Kwanza Town", "Keiyo", "Kapomboi"],
    "Endebess": ["Endebess Town", "Matumbei", "Chepchoina"]
  },
  "Bungoma": {
    "Kanduyi": ["Bungoma CBD", "Khalaba", "Musikoma", "Kibabii"],
    "Webuye West": ["Webuye Town", "Misikhu", "Sitikho"],
    "Kimilili": ["Kimilili Town", "Kibingei", "Maeni"],
    "Sirisia": ["Sirisia Town", "Namwwamba", "Lwandanyi"]
  },
  "Kakamega": {
    "Lurambi": ["Kakamega CBD", "Shirere", "Mahiakalo", "Sheywe"],
    "Malava": ["Malava Town", "Chemuche", "South Kabras"],
    "Mumias West": ["Mumias Town", "Etenje", "Musamba"],
    "Shinyalu": ["Shinyalu Town", "Isukha", "Murhanda"]
  },
  "Kericho": {
    "Ainamoi": ["Kericho CBD", "Kapkugerwet", "Ainamoi Town"],
    "Belgut": ["Kabianga", "Cheptororiet", "Waldai"],
    "Bureti": ["Litein", "Cheborge", "Kisiara"]
  }
};

export const ALL_KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot"
];

export function getSubCountiesForCounty(county: string): string[] {
  const data = KENYA_LOCATION_DATA[county];
  if (data) {
    return Object.keys(data).sort((a, b) => a.localeCompare(b));
  }
  return [
    `${county} Central`,
    `${county} East`,
    `${county} North`,
    `${county} South`,
    `${county} Town`,
    `${county} West`
  ].sort((a, b) => a.localeCompare(b));
}

export function getLocationsForSubCounty(county: string, subCounty: string): string[] {
  const countyData = KENYA_LOCATION_DATA[county];
  if (countyData && countyData[subCounty]) {
    return [...countyData[subCounty]].sort((a, b) => a.localeCompare(b));
  }
  return [
    `${subCounty} Center`,
    `${subCounty} Junction`,
    `${subCounty} Market`,
    `${subCounty} Stage`,
    "Other / Custom Area"
  ];
}

/**
 * Authoritative mapping of Kenyan Counties to their Major Commercial Towns & Delivery Hubs
 */
export const KENYA_COUNTY_TOWNS: Record<string, string[]> = {
  "Baringo": ["Kabarnet", "Eldama Ravine", "Marigat", "Mogotio", "Kabartonjo", "Chemolingot", "Timboroa"],
  "Bomet": ["Bomet Town", "Sotik", "Silibwet", "Mogogosiek", "Mulot", "Longisa", "Sigor"],
  "Bungoma": ["Bungoma Town", "Webuye", "Kimilili", "Chwele", "Sirisia", "Malakisi", "Tongaren", "Kanduyi"],
  "Busia": ["Busia Town", "Malaba", "Nambale", "Port Victoria", "Bumala", "Funyula", "Alupe"],
  "Elgeyo-Marakwet": ["Iten", "Kapsowar", "Tambach", "Chepkorio", "Bugar", "Flax"],
  "Embu": ["Embu Town", "Runyenjes", "Siakago", "Manyatta", "Ishiara", "Kiritiri"],
  "Garissa": ["Garissa Town", "Modogashe", "Dadaab", "Masalani", "Bura East", "Hulugho"],
  "Homa Bay": ["Homa Bay Town", "Mbita", "Oyugis", "Kendu Bay", "Ndhiwa", "Rodi Kopany", "Sindo"],
  "Isiolo": ["Isiolo Town", "Garbatulla", "Merti", "Oldonyiro", "Kinna"],
  "Kajiado": ["Kitengela", "Ngong", "Ongata Rongai", "Kiserian", "Kajiado Town", "Loitokitok", "Isinya", "Namanga", "Bissil"],
  "Kakamega": ["Kakamega Town", "Mumias", "Malava", "Butere", "Lumakanda", "Shinyalu", "Khwisero", "Matunda"],
  "Kericho": ["Kericho Town", "Litein", "Kipkelion", "Londiani", "Kapsoit", "Chepseon", "Kabianga"],
  "Kiambu": ["Thika", "Ruiru", "Kikuyu", "Kiambu Town", "Limuru", "Juja", "Kabete", "Githunguri", "Karuri", "Gatundu", "Kimende"],
  "Kilifi": ["Kilifi Town", "Malindi", "Mtwapa", "Watamu", "Mariakani", "Kaloleni", "Vipingo", "Mazeras"],
  "Kirinyaga": ["Kerugoya", "Kutus", "Sagana", "Wang'uru (Mwea)", "Kagio", "Baricho", "Kianyaga"],
  "Kisii": ["Kisii Town", "Ogembo", "Suneka", "Keroka", "Nyacheki", "Tabaka", "Keumbu"],
  "Kisumu": ["Kisumu CBD", "Maseno", "Ahero", "Muhoroni", "Kombewa", "Sondu", "Kisian"],
  "Kitui": ["Kitui Town", "Mwingi", "Mutomo", "Kwa Vonza", "Kabati", "Migwani", "Ikutha"],
  "Kwale": ["Diani / Ukunda", "Kwale Town", "Msambweni", "Lunga Lunga", "Kinango", "Shimoni", "Tiwi"],
  "Laikipia": ["Nanyuki", "Nyahururu", "Rumuruti", "Doldol", "Kinamba", "Ol Jabet"],
  "Lamu": ["Lamu Town", "Mpeketoni", "Mokowe", "Witu", "Hindi", "Shela"],
  "Machakos": ["Machakos Town", "Athi River / Mavoko", "Mlolongo", "Syokimau", "Tala", "Kangundo", "Matuu", "Masii", "Kathiani"],
  "Makueni": ["Wote", "Emali", "Kibwezi", "Makindu", "Mtito Andei", "Sultan Hamud", "Salama"],
  "Mandera": ["Mandera Town", "Elwak", "Rhamu", "Takaba", "Lafey", "Banisa"],
  "Marsabit": ["Marsabit Town", "Moyale", "Laisamis", "North Horr", "Sololo", "Loiyangalani"],
  "Meru": ["Meru Town", "Nkubu", "Maua", "Timau", "Makutano", "Kianjai", "Mikinduri", "Igoji"],
  "Migori": ["Migori Town", "Rongo", "Isebania", "Kehancha", "Awendo", "Suna", "Muhuru Bay"],
  "Mombasa": ["Mombasa CBD", "Nyali", "Bamburi", "Changamwe", "Likoni", "Mtwapa Border", "Port Reitz", "Kisauni", "Tudor", "Mikindani"],
  "Murang'a": ["Murang'a Town", "Kenol / Makuyu", "Maragua", "Kangema", "Kirwara", "Saba Saba", "Kigumo"],
  "Nairobi": ["Nairobi CBD", "Westlands", "Kasarani", "Eastleigh", "Karen", "Embakasi", "Roysambu", "Lang'ata", "South C", "South B", "Kilimani", "Ruaraka", "Ngara", "Utawala", "Githurai 44", "Dagoretti"],
  "Nakuru": ["Nakuru CBD", "Naivasha", "Gilgil", "Molo", "Njoro", "Rongai", "Mai Mahiu", "Bahati", "Subukia", "Salgaa", "Elburgon"],
  "Nandi": ["Kapsabet", "Nandi Hills", "Mosoriot", "Kobujoi", "Serem", "Maraba", "Chepterit"],
  "Narok": ["Narok Town", "Kilgoris", "Nairagie Enkare", "Ololulung'a", "Emurua Dikirr", "Ntulele"],
  "Nyamira": ["Nyamira Town", "Nyansiongo", "Keroka North", "Chepilat", "Kebirigo", "Manga"],
  "Nyandarua": ["Ol Kalou", "Engineer", "Mairo Inya", "Njabini", "Ndunyu Njeru", "Miharati"],
  "Nyeri": ["Nyeri Town", "Karatina", "Othaya", "Mukurwe-ini", "Mweiga", "Naro Moru", "Endarasha"],
  "Samburu": ["Maralal", "Baragoi", "Wamba", "Archers Post", "Kisima", "South Horr"],
  "Siaya": ["Siaya Town", "Bondo", "Ugunja", "Yala", "Usenge", "Sega", "Akala"],
  "Taita-Taveta": ["Voi", "Wundanyi", "Taveta", "Mwatate", "Maungu"],
  "Tana River": ["Hola", "Garsen", "Madogo", "Bura", "Kipini"],
  "Tharaka-Nithi": ["Chuka", "Marimanti", "Chogoria", "Kathwana", "Kibugua"],
  "Trans Nzoia": ["Kitale (CBD / Main)", "Kiminini", "Endebess", "Kachibora", "Sibanga", "Maili Saba", "Kwanza", "Saboti", "Matisi"],
  "Turkana": ["Lodwar", "Kakuma", "Lokichogio", "Lokichar", "Kalokol", "Kainuk"],
  "Uasin Gishu": ["Eldoret (CBD / Main)", "Turbo", "Burnt Forest", "Moi's Bridge", "Ziwa", "Kesses", "Kapsoya", "Maili Tisa", "Ainabkoi", "Langas"],
  "Vihiga": ["Mbale", "Chavakali", "Luanda", "Serem", "Majengo", "Hamisi", "Kaimosi"],
  "Wajir": ["Wajir Town", "Habaswein", "Tarbaj", "Bute", "Griftu", "Eldas"],
  "West Pokot": ["Kapenguria", "Makutano", "Chepareria", "Ortum", "Sigor", "Alale"]
};

export function getMajorTownsForCounty(county: string): string[] {
  const towns = KENYA_COUNTY_TOWNS[county];
  if (towns && towns.length > 0) {
    return [...towns];
  }
  return [`${county} Town / CBD`, `${county} Center`, `${county} Market`];
}
