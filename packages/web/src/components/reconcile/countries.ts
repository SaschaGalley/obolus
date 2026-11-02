/**
 * Bookamat's country list (API docs, Grundlagen → Länder), in its groups and
 * names. Austria is not in it; Greece is GR, not EL as in the UID.
 */
export const COUNTRY_GROUPS: [string, [code: string, name: string][]][] = [
  ['EU', [
    ['BE', 'Belgien'], ['BG', 'Bulgarien'], ['DK', 'Dänemark'], ['DE', 'Deutschland'], ['EE', 'Estland'],
    ['FI', 'Finnland'], ['FR', 'Frankreich'], ['GR', 'Griechenland'], ['IE', 'Irland'], ['IT', 'Italien'],
    ['HR', 'Kroatien'], ['LV', 'Lettland'], ['LT', 'Litauen'], ['LU', 'Luxemburg'], ['MT', 'Malta'],
    ['NL', 'Niederlande'], ['PL', 'Polen'], ['PT', 'Portugal'], ['RO', 'Rumänien'], ['SE', 'Schweden'],
    ['SK', 'Slowakei'], ['SI', 'Slowenien'], ['ES', 'Spanien'], ['CZ', 'Tschechien'], ['HU', 'Ungarn'],
    ['GB', 'Vereinigtes Königreich (EU)'], ['CY', 'Zypern'],
  ]],
  ['Drittland mit Vorsteuer-Rückerstattung', [
    ['IS', 'Island'], ['JP', 'Japan'], ['CA', 'Kanada'], ['LI', 'Liechtenstein'], ['NO', 'Norwegen'],
    ['CH', 'Schweiz'], ['KR', 'Südkorea'], ['TR', 'Türkei'], ['XU', 'Vereinigtes Königreich'],
  ]],
  ['Drittland', [
    ['AF', 'Afghanistan'], ['AL', 'Albanien'], ['DZ', 'Algerien'], ['AD', 'Andorra'], ['AO', 'Angola'],
    ['AR', 'Argentinien'], ['AM', 'Armenien'], ['AZ', 'Aserbaidschan'], ['AU', 'Australien'], ['BH', 'Bahrain'],
    ['BD', 'Bangladesch'], ['BO', 'Bolivien'], ['BA', 'Bosnien und Herzegowina'], ['BW', 'Botsuana'],
    ['BR', 'Brasilien'], ['KY', 'Cayman-Inseln'], ['CL', 'Chile'], ['CN', 'China'], ['CR', 'Costa Rica'],
    ['CI', "Côte d'Ivoire"], ['CD', 'Demokratische Republik Kongo'], ['DO', 'Dominikanische Republik'],
    ['EC', 'Ecuador'], ['SV', 'El Salvador'], ['ER', 'Eritrea'], ['FO', 'Färöer-Inseln'], ['GM', 'Gambia'],
    ['GE', 'Georgien'], ['GH', 'Ghana'], ['GD', 'Grenada'], ['GL', 'Grönland'], ['GT', 'Guatemala'],
    ['GN', 'Guinea'], ['HN', 'Honduras'], ['HK', 'Hongkong'], ['IN', 'Indien'], ['ID', 'Indonesien'],
    ['IQ', 'Irak'], ['IR', 'Iran'], ['IL', 'Israel'], ['JM', 'Jamaika'], ['YE', 'Jemen'], ['JO', 'Jordanien'],
    ['KH', 'Kambodscha'], ['CM', 'Kamerun'], ['KZ', 'Kasachstan'], ['QA', 'Katar'], ['KE', 'Kenia'],
    ['KG', 'Kirgisistan'], ['CO', 'Kolumbien'], ['CG', 'Kongo'], ['CU', 'Kuba'], ['KW', 'Kuwait'],
    ['LA', 'Laos'], ['LB', 'Libanon'], ['LR', 'Liberia'], ['LY', 'Libyen'], ['MY', 'Malaysia'], ['ML', 'Mali'],
    ['MA', 'Marokko'], ['MK', 'Mazedonien'], ['MX', 'Mexiko'], ['MD', 'Moldawien'], ['MC', 'Monaco'],
    ['MN', 'Mongolei'], ['ME', 'Montenegro'], ['MZ', 'Mosambik'], ['MM', 'Myanmar'], ['NA', 'Namibia'],
    ['NP', 'Nepal'], ['NZ', 'Neuseeland'], ['NI', 'Nicaragua'], ['NE', 'Niger'], ['NG', 'Nigeria'],
    ['OM', 'Oman'], ['PK', 'Pakistan'], ['PA', 'Panama'], ['PY', 'Paraguay'], ['PE', 'Peru'],
    ['PH', 'Philippinen'], ['PR', 'Puerto Rico'], ['RW', 'Ruanda'], ['RU', 'Russland'], ['ZM', 'Sambia'],
    ['SM', 'San Marino'], ['SA', 'Saudi-Arabien'], ['SN', 'Senegal'], ['RS', 'Serbien'], ['ZW', 'Simbabwe'],
    ['SG', 'Singapur'], ['SO', 'Somalia'], ['LK', 'Sri Lanka'], ['SD', 'Sudan'], ['SR', 'Suriname'],
    ['SY', 'Syrien'], ['ZA', 'Südafrika'], ['SS', 'Südsudan'], ['TJ', 'Tadschikistan'], ['TW', 'Taiwan'],
    ['TZ', 'Tansania'], ['TH', 'Thailand'], ['TG', 'Togo'], ['TD', 'Tschad'], ['TN', 'Tunesien'],
    ['TM', 'Turkmenistan'], ['UG', 'Uganda'], ['UA', 'Ukraine'], ['UY', 'Uruguay'], ['UZ', 'Usbekistan'],
    ['VE', 'Venezuela'], ['AE', 'Vereinigte Arabische Emirate'], ['US', 'Vereinigte Staaten von Amerika'],
    ['VN', 'Vietnam'], ['BY', 'Weißrussland'], ['CF', 'Zentralafrikanische Republik'], ['EG', 'Ägypten'],
    ['ET', 'Äthiopien'],
  ]],
];
