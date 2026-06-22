import apiClient from "@/lib/api-client";

export interface BasicInformationsData {
  fullNameEnglish: string;
  fullNameBangla: string;
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
}

export const basicInformationService = {

  async getBasicInformations(): Promise<BasicInformationsData> {

    const response = await apiClient.get<{ data: BasicInformationsData }>("/basic-info");
    
    return response.data.data;
  },



  async updateBasicInformations(payload: BasicInformationsData): Promise<void> {
    await apiClient.put("/basic-info", payload);
  },


};