type TitleValuePair = {
  title: string;
  value: string;
};

function toTitleValuePair(nameValue: {
  name: string;
  value: string;
}): TitleValuePair {
  return {
    title: nameValue.name,
    value: nameValue.value,
  };
}

// https://gist.github.com/mshafrir/2646763
export const PROVINCES_US: TitleValuePair[] = [
  {
    name: "Alabama",
    value: "AL",
  },
  {
    name: "Alaska",
    value: "AK",
  },
  {
    name: "American Samoa",
    value: "AS",
  },
  {
    name: "Arizona",
    value: "AZ",
  },
  {
    name: "Arkansas",
    value: "AR",
  },
  {
    name: "California",
    value: "CA",
  },
  {
    name: "Colorado",
    value: "CO",
  },
  {
    name: "Connecticut",
    value: "CT",
  },
  {
    name: "Delaware",
    value: "DE",
  },
  {
    name: "District Of Columbia",
    value: "DC",
  },
  {
    name: "Federated States Of Micronesia",
    value: "FM",
  },
  {
    name: "Florida",
    value: "FL",
  },
  {
    name: "Georgia",
    value: "GA",
  },
  {
    name: "Guam",
    value: "GU",
  },
  {
    name: "Hawaii",
    value: "HI",
  },
  {
    name: "Idaho",
    value: "ID",
  },
  {
    name: "Illinois",
    value: "IL",
  },
  {
    name: "Indiana",
    value: "IN",
  },
  {
    name: "Iowa",
    value: "IA",
  },
  {
    name: "Kansas",
    value: "KS",
  },
  {
    name: "Kentucky",
    value: "KY",
  },
  {
    name: "Louisiana",
    value: "LA",
  },
  {
    name: "Maine",
    value: "ME",
  },
  {
    name: "Marshall Islands",
    value: "MH",
  },
  {
    name: "Maryland",
    value: "MD",
  },
  {
    name: "Massachusetts",
    value: "MA",
  },
  {
    name: "Michigan",
    value: "MI",
  },
  {
    name: "Minnesota",
    value: "MN",
  },
  {
    name: "Mississippi",
    value: "MS",
  },
  {
    name: "Missouri",
    value: "MO",
  },
  {
    name: "Montana",
    value: "MT",
  },
  {
    name: "Nebraska",
    value: "NE",
  },
  {
    name: "Nevada",
    value: "NV",
  },
  {
    name: "New Hampshire",
    value: "NH",
  },
  {
    name: "New Jersey",
    value: "NJ",
  },
  {
    name: "New Mexico",
    value: "NM",
  },
  {
    name: "New York",
    value: "NY",
  },
  {
    name: "North Carolina",
    value: "NC",
  },
  {
    name: "North Dakota",
    value: "ND",
  },
  {
    name: "Northern Mariana Islands",
    value: "MP",
  },
  {
    name: "Ohio",
    value: "OH",
  },
  {
    name: "Oklahoma",
    value: "OK",
  },
  {
    name: "Oregon",
    value: "OR",
  },
  {
    name: "Palau",
    value: "PW",
  },
  {
    name: "Pennsylvania",
    value: "PA",
  },
  {
    name: "Puerto Rico",
    value: "PR",
  },
  {
    name: "Rhode Island",
    value: "RI",
  },
  {
    name: "South Carolina",
    value: "SC",
  },
  {
    name: "South Dakota",
    value: "SD",
  },
  {
    name: "Tennessee",
    value: "TN",
  },
  {
    name: "Texas",
    value: "TX",
  },
  {
    name: "Utah",
    value: "UT",
  },
  {
    name: "Vermont",
    value: "VT",
  },
  {
    name: "Virgin Islands",
    value: "VI",
  },
  {
    name: "Virginia",
    value: "VA",
  },
  {
    name: "Washington",
    value: "WA",
  },
  {
    name: "West Virginia",
    value: "WV",
  },
  {
    name: "Wisconsin",
    value: "WI",
  },
  {
    name: "Wyoming",
    value: "WY",
  },
].map(toTitleValuePair);

// https://gist.github.com/pbojinov/a87adf559d2f7e81d86ae67e7bd883c7
export const PROVINCES_CA: TitleValuePair[] = [
  {
    name: "Alberta",
    value: "AB",
  },
  {
    name: "British Columbia",
    value: "BC",
  },
  {
    name: "Manitoba",
    value: "MB",
  },
  {
    name: "New Brunswick",
    value: "NB",
  },
  {
    name: "Newfoundland and Labrador",
    value: "NL",
  },
  {
    name: "Northwest Territories",
    value: "NT",
  },
  {
    name: "Nova Scotia",
    value: "NS",
  },
  {
    name: "Nunavut",
    value: "NU",
  },
  {
    name: "Ontario",
    value: "ON",
  },
  {
    name: "Prince Edward Island",
    value: "PE",
  },
  {
    name: "Quebec",
    value: "QC",
  },
  {
    name: "Saskatchewan",
    value: "SK",
  },
  {
    name: "Yukon Territory",
    value: "YT",
  },
].map(toTitleValuePair);

export const PROVINCES_GB: TitleValuePair[] = [
  { name: "Avon" },
  { name: "Bedfordshire" },
  { name: "Berkshire" },
  { name: "Buckinghamshire" },
  { name: "Cambridgeshire" },
  { name: "Cheshire" },
  { name: "Cleveland" },
  { name: "Cornwall" },
  { name: "Cumbria" },
  { name: "Derbyshire" },
  { name: "Devon" },
  { name: "Dorset" },
  { name: "Durham" },
  { name: "East Sussex" },
  { name: "Essex" },
  { name: "Gloucestershire" },
  { name: "Hampshire" },
  { name: "Herefordshire" },
  { name: "Hertfordshire" },
  { name: "Isle of Wight" },
  { name: "Kent" },
  { name: "Lancashire" },
  { name: "Leicestershire" },
  { name: "Lincolnshire" },
  { name: "London" },
  { name: "Merseyside" },
  { name: "Norfolk" },
  { name: "Northamptonshire" },
  { name: "Northumberland" },
  { name: "North Yorkshire" },
  { name: "Nottinghamshire" },
  { name: "Oxfordshire" },
  { name: "Rutland" },
  { name: "Shropshire" },
  { name: "Somerset" },
  { name: "South Yorkshire" },
  { name: "Staffordshire" },
  { name: "Suffolk" },
  { name: "Surrey" },
  { name: "Tyne and Wear" },
  { name: "Warwickshire" },
  { name: "West Midlands" },
  { name: "West Sussex" },
  { name: "West Yorkshire" },
  { name: "Wiltshire" },
  { name: "Worcestershire" },
  { name: "Clwyd" },
  { name: "Dyfed" },
  { name: "Gwent" },
  { name: "Gwynedd" },
  { name: "Mid Glamorgan" },
  { name: "Powys" },
  { name: "South Glamorgan" },
  { name: "West Glamorgan" },
  { name: "Aberdeenshire" },
  { name: "Angus" },
  { name: "Argyll" },
  { name: "Ayrshire" },
  { name: "Banffshire" },
  { name: "Berwickshire" },
  { name: "Bute" },
  { name: "Caithness" },
  { name: "Clackmannanshire" },
  { name: "Dumfriesshire" },
  { name: "Dunbartonshire" },
  { name: "East Lothian" },
  { name: "Fife" },
  { name: "Inverness-shire" },
  { name: "Kincardineshire" },
  { name: "Kinross-shire" },
  { name: "Kirkcudbrightshire" },
  { name: "Lanarkshire" },
  { name: "Midlothian" },
  { name: "Moray" },
  { name: "Nairnshire" },
  { name: "Orkney" },
  { name: "Peeblesshire" },
  { name: "Perthshire" },
  { name: "Renfrewshire" },
  { name: "Ross-shire" },
  { name: "Roxburghshire" },
  { name: "Selkirkshire" },
  { name: "Shetland" },
  { name: "Stirlingshire" },
  { name: "Sutherland" },
  { name: "West Lothian" },
  { name: "Wigtownshire" },
  { name: "Antrim" },
  { name: "Armagh" },
  { name: "Down" },
  { name: "Fermanagh" },
  { name: "Londonderry" },
  { name: "Tyrone" },
].map((province) => ({ title: province.name, value: province.name }));
