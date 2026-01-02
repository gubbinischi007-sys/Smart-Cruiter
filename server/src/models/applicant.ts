export type ApplicantStage = 'applied' | 'shortlisted' | 'recommended' | 'hired' | 'declined' | 'withdrawn';
export type ApplicantStatus = 'active' | 'archived';

export interface Applicant {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  stage: ApplicantStage;
  status: ApplicantStatus;
  applied_at: string;
  updated_at: string;
  offer_salary?: string;
  offer_joining_date?: string;
  offer_status?: 'pending' | 'accepted' | 'rejected' | null;
  offer_notes?: string;
  offer_rules?: string;
  offer_sent_at?: string;
}

export interface CreateApplicantInput {
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
}

export interface UpdateApplicantInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  stage?: ApplicantStage;
  status?: ApplicantStatus;
  offer_salary?: string;
  offer_joining_date?: string;
  offer_status?: 'pending' | 'accepted' | 'rejected' | null;
  offer_notes?: string;
  offer_rules?: string;
  offer_sent_at?: string;
}

