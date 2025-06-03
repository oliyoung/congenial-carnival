import {
  assistantRepository,
  athleteRepository,
  goalRepository,
  sessionLogRepository,
  trainingPlanRepository
} from "@/lib/repository";
import type { Assistant, AssistantsInput, Athlete, Goal, SessionLog, TrainingPlan } from "@/lib/types";
import type { GraphQLContext } from "../route";
import { me, coach } from "./coaches";
import { whiteboards, whiteboard, play, phase } from "./whiteboards";

export default {
  // Coach queries
  me,
  coach,

  // Whiteboard queries
  whiteboards,
  whiteboard,
  play,
  phase,

  // Single entity queries - use DataLoader pattern
  trainingPlan: async (_parent: unknown, args: { id: string }, context: GraphQLContext): Promise<TrainingPlan | null> =>
    context.loaders.trainingPlan.load(args.id),

  athlete: async (_parent: unknown, args: { id: string }, context: GraphQLContext): Promise<Athlete | null> =>
    context.loaders.athlete.load(args.id),

  goal: async (_parent: unknown, args: { id: string; athleteId: string }, context: GraphQLContext): Promise<Goal | null> =>
    context.loaders.goal.load(args.id),

  sessionLog: async (_parent: unknown, args: { id: string }, context: GraphQLContext): Promise<SessionLog | null> =>
    context.loaders.sessionLog.load(args.id),

  // Collection queries - use repository instances
  trainingPlans: async (_parent: unknown, args: { athleteId: string }, context: GraphQLContext): Promise<TrainingPlan[]> =>
    trainingPlanRepository.getTrainingPlans(context?.user?.id ?? null, args.athleteId),

  assistants: async (_parent: unknown, args: { input: AssistantsInput }, context: GraphQLContext): Promise<Assistant[]> =>
    assistantRepository.getAssistants(args.input),

  athletes: async (_parent: unknown, _args: unknown, context: GraphQLContext): Promise<Athlete[]> =>
    athleteRepository.getAthletes(context?.user?.id ?? null),

  goals: async (_parent: unknown, args: { athleteId?: string }, context: GraphQLContext): Promise<Goal[]> => {
    if (args.athleteId) {
      return goalRepository.getGoalsByAthleteId(context?.user?.id ?? null, args.athleteId);
    }
    return goalRepository.getAllGoals(context?.user?.id ?? null);
  },

  sessionLogs: async (_parent: unknown, args: { athleteId?: string }, context: GraphQLContext): Promise<SessionLog[]> => {
    if (args.athleteId) {
      return sessionLogRepository.getSessionLogsByAthleteId(context?.user?.id ?? null, args.athleteId);
    }
    return sessionLogRepository.getAllSessionLogs(context?.user?.id ?? null);
  },
}
