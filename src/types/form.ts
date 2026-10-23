export type FieldType =
  // 1. Campos de Texto y Entrada Básica
  | 'text'
  | 'textarea'
  | 'number'
  // 2. Campos de Selección y Opciones
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'switch'
  // 3. Campos de Fecha, Hora y Formato Avanzado
  | 'date'
  | 'time'
  | 'datetime'
  // 4. Campos de Validación Específica
  | 'email'
  | 'phone'
  | 'password'
  | 'url'
  // 5. Campos de Calificación y Escalas
  | 'rating'
  | 'matrix_radio'
  | 'matrix_checkbox'
  // 6. Campos Especiales y de Sistema
  | 'file'
  | 'signature'
  | 'hidden'
  | 'captcha';

export interface Field {
  id: string;
  form_id: string;
  label: string;
  type: FieldType;
  is_required: boolean;
  options?: string[]; // for 'select', 'radio', 'checkbox'
  matrix_rows?: string[]; // for 'matrix_radio', 'matrix_checkbox'
  matrix_cols?: string[]; // for 'matrix_radio', 'matrix_checkbox'
  rating_max?: number; // 5 or 10, default 5
  placeholder?: string;
  default_value?: string; // for 'hidden'
  allowed_file_types?: string; // for 'file'
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
  role?: 'admin' | 'advisor';
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
