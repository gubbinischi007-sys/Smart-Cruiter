export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type InterviewType = 'online' | 'in-person' | 'phone';

export interface Interview {
  id: string;
  applicant_id: string;
  job_id: string;
  scheduled_at: string;
  type: InterviewType;
  meeting_link?: string;
  notes?: string;
  status: InterviewStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewInput {
  applicant_id: string;
  job_id: string;
  scheduled_at: string;
  type?: InterviewType;
  meeting_link?: string;
  notes?: string;
}

export interface UpdateInterviewInput {
  scheduled_at?: string;
  type?: InterviewType;
  meeting_link?: string;
  notes?: string;
  status?: InterviewStatus;
}

