export interface PrepopulatedProfileDTO {
  applicationId: string;
  fullNameEnglish: string;
  fullNameBangla: string; // From OCR fallback if not in personal_info table
  fatherNameBangla: string;
  motherNameBangla: string;
  dob: string;
  gender: string;
  nidNumber: string;
  mobile: string;
  presentAddress: string;
  email: string;
  occupation: string;
  employer: string;
  monthlyIncome: string;
  spouseName?: string;
  postCode?: string;
  birthPlace?: string;
  bloodGroup?: string;
  
}