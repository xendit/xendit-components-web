export type Instructions = InstructionsTab[];

export type InstructionsTab = {
  title: string;
  content: (InstructionsStep | (string | InstructionsStep)[])[];
};

export type InstructionsStep =
  | {
      type: "text";
      text: FormattedString;
    }
  | {
      type: "image";
      src: string;
      height: number;
      alt?: string;
    }
  | {
      type: "bullets";
      items: FormattedString[];
    }
  | {
      type: "form";
      heading?: FormattedString;
      fields: {
        label: string;
        value: FormattedString;
      }[];
    }
  | {
      type: "table";
      headers: FormattedString[];
      rows: FormattedString[][];
    };

export type FormattedString = string;
