import { FieldProps, formFieldName } from "./field";

export const CountryField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  return (
    <select name={id} onChange={onChange}>
      {Object.entries(countries).map(([code, data]) => (
        <option key={code} value={code}>
          {toFlagEmoji(code)} {data.name}
        </option>
      ))}
    </select>
  );
};

// TODO: use images instead (flag emojis don't work in windows)
function toFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// TODO: pull this from a library
const countries = {
  ID: { name: "Indonesia", phoneCode: "62" },
  MY: { name: "Malaysia", phoneCode: "60" },
  PH: { name: "Philippines", phoneCode: "63" },
  SG: { name: "Singapore", phoneCode: "65" },
  TH: { name: "Thailand", phoneCode: "66" },
  VN: { name: "Vietnam", phoneCode: "84" },
};
