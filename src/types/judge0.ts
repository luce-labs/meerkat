export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
}

export interface Judge0Response {
  token: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
}

export interface Judge0Language {
  id: number;
  name: string;
  is_archived: boolean;
}
