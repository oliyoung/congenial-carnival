import { createAssistantLoader } from './assistant';
import { createAthleteLoader } from './athlete';
import { createCoachLoaders } from './coach';
import { createCoachBillingLoaders } from './coachBilling';
import { createGoalLoader } from './goal';
import {
  createAthleteTrainingPlanIdsLoader,
  createGoalSessionLogIdsLoader,
  createSessionLogGoalIdsLoader,
  createTrainingPlanAssistantIdsLoader,
  createTrainingPlanGoalIdsLoader
} from './relation';
import { createSessionLogLoader } from './sessionLog';
import { createTrainingPlanLoader } from './training-plan';

export interface DataLoaders {
  // Entity loaders
  coachLoaders: ReturnType<typeof createCoachLoaders>;
  coachBillingLoaders: ReturnType<typeof createCoachBillingLoaders>;
  athleteLoader: ReturnType<typeof createAthleteLoader>;
  goalLoader: ReturnType<typeof createGoalLoader>;
  sessionLogLoader: ReturnType<typeof createSessionLogLoader>;
  trainingPlanLoader: ReturnType<typeof createTrainingPlanLoader>;
  assistantLoader: ReturnType<typeof createAssistantLoader>;

  // Relation loaders
  athleteTrainingPlanIdsLoader: ReturnType<typeof createAthleteTrainingPlanIdsLoader>;
  goalSessionLogIdsLoader: ReturnType<typeof createGoalSessionLogIdsLoader>;
  sessionLogGoalIdsLoader: ReturnType<typeof createSessionLogGoalIdsLoader>;
  trainingPlanAssistantIdsLoader: ReturnType<typeof createTrainingPlanAssistantIdsLoader>;
  trainingPlanGoalIdsLoader: ReturnType<typeof createTrainingPlanGoalIdsLoader>;
}

/**
 * Creates all DataLoaders for the GraphQL context
 * This ensures proper batching and caching for all entity and relation resolvers
 */
export function createDataLoaders(coachId: string | null): DataLoaders {
  return {
    // Entity loaders
    coachLoaders: createCoachLoaders(),
    coachBillingLoaders: createCoachBillingLoaders(),
    athleteLoader: createAthleteLoader(coachId),
    goalLoader: createGoalLoader(coachId),
    sessionLogLoader: createSessionLogLoader(coachId),
    trainingPlanLoader: createTrainingPlanLoader(coachId),
    assistantLoader: createAssistantLoader(),

    // Relation loaders
    athleteTrainingPlanIdsLoader: createAthleteTrainingPlanIdsLoader(coachId),
    goalSessionLogIdsLoader: createGoalSessionLogIdsLoader(),
    sessionLogGoalIdsLoader: createSessionLogGoalIdsLoader(),
    trainingPlanAssistantIdsLoader: createTrainingPlanAssistantIdsLoader(),
    trainingPlanGoalIdsLoader: createTrainingPlanGoalIdsLoader(),
  };
}