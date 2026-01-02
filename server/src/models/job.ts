export interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  type?: string; // full-time, part-time, contract, etc.
  description?: string;
  requirements?: string;
  status: 'open' | 'closed' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  title: string;
  department?: string;
  location?: string;
  type?: string;
  description?: string;
  requirements?: string;
  status?: 'open' | 'closed' | 'draft';
}

export interface UpdateJobInput {
  title?: string;
  department?: string;
  location?: string;
  type?: string;
  description?: string;
  requirements?: string;
  status?: 'open' | 'closed' | 'draft';
}

