export interface NumberField {
  key: string;
  label: string;
  type: "number";
  default: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  help?: string;
}

export interface SelectField {
  key: string;
  label: string;
  type: "select";
  default: string;
  options: { value: string; label: string }[];
  help?: string;
}

export interface TextField {
  key: string;
  label: string;
  type: "textarea";
  default: string;
  rows?: number;
  placeholder?: string;
  help?: string;
}

export type FieldDef = NumberField | SelectField | TextField;
export type FieldValues = Record<string, number | string>;

export interface ResultItem {
  label: string;
  value: string;
  tone?: "default" | "primary" | "good" | "bad";
  hint?: string;
  /** Render value in monospace — for code, tokens and raw output. */
  mono?: boolean;
  /** Span the full results grid width — for long findings. */
  wide?: boolean;
}

export interface ContentSection {
  heading: string;
  paragraphs: string[];
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface CalculatorDef {
  slug: string;
  vertical: string;
  name: string;
  title: string;
  seoTitle: string;
  description: string;
  keywords: string[];
  fields: FieldDef[];
  compute: (v: FieldValues) => ResultItem[];
  /** What data/rates the calculator is based on — shown for transparency. */
  assumptions: string[];
  /** Outbound citations backing the numbers. */
  sources: SourceLink[];
  /** Unique narrative content rendered below the tool. */
  sections: ContentSection[];
  faq: { q: string; a: string }[];
  /** Slugs of related calculators (any vertical). */
  related: string[];
  updatedAt: string;
}
