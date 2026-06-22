import { withTransaction } from "../../../utils/withTransaction.js";
import { boRepository, type BOPreferencesDBInput } from "./bo.repository.js";


export const boService = {
  async updateBoPreferences(userId: string, preferences: BOPreferencesDBInput) {
    return await withTransaction(async (client) => {
      
      // 1. Commit preferences to SQL structures
      await boRepository.updateApplicationPreferences(userId, preferences, client);
      
      // 2. Drive onboarding pipeline stepper forward
      await boRepository.advanceStepToBoDone(userId, client);

      return {
        currentStep: "bo_done" as const
      };
    });
  }
};