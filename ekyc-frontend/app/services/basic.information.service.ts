import axios from "axios";
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

const mockBasicInformationsData: BasicInformationsData = {
  fullNameEnglish: "Md Sajeeb Hasan",
  fullNameBangla: "মোঃ সাজীব হাসান",
  fatherNameBangla: "মোঃ আবুল হাসান",
  motherNameBangla: "মোছাঃ রোকেয়া বেগম",
  dob: "1998-05-15",
  gender: "Male",
  nidNumber: "1234567890123",
  mobile: "01712345678",
  presentAddress: "Dhaka, Bangladesh",
  email: "sajeeb@gmail.com",
  occupation: "Software Engineer",
  employer: "XYZ Technologies Ltd",
  monthlyIncome: "BDT 50,000 - 100,000",
};

export const basicInformationService = {
  async getBasicInformations(): Promise<BasicInformationsData> {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockBasicInformationsData);
      }, 1000);
    });
  },
};
