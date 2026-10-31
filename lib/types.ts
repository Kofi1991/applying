export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  cv_path: string | null;
  cv_text: string | null;
  job_titles: string[];
  locations: string[];
  include_uk_remote: boolean;
  max_office_days: number;
  job_types: string[];
  salary_expectation: number | null;
  day_rate_expectation: number | null;
  notice_period: string | null;
  right_to_work: string | null;
  run_hour: number;
  weekdays_only: boolean;
  active: boolean;
  last_run_on: string | null;
};

/** A role as returned by the Search agent. */
export type FoundRole = {
  title: string;
  company: string;
  url: string;
  office_days: string;
  job_type: string;
  pay: string | null;
  summary: string;
};

/** A role after the Reviewer has scored it. */
export type ReviewedRole = FoundRole & {
  fit_score: number;
  fit_label: "Very suitable" | "Good match";
  fit_reason: string;
  gaps: string;
};
