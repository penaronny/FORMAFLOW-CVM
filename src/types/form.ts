export type FieldType = 'text' | 'textarea' | 'email' | 'number' | 'date' | 'select';

export interface Field {
  id: string;
  form_id: string;
  label: string;
  type: FieldType;
  is_required: boolean;
  options?: string[]; // for 'select'
  position: number;
}

export interface Form {
  id: string;
  user_id: string;
  title: string;
  description: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fields?: Field[];
  response_count?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  field_id: string;
  value: string;
}

export interface FormResponseRecord {
  id: string;
  form_id: string;
  submitted_at: string;
  answers: Record<string, string>; // field_id -> answer value
}

export interface PublicFormPayload {
  answers: Record<string, string>; // field_id -> answer value
}
