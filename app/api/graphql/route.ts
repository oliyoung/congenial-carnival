import { readFileSync } from 'node:fs'
import { createAssistantLoader } from '@/lib/data-loaders/assistant';
import { createAthleteLoader } from '@/lib/data-loaders/athlete';
import { createCoachLoaders } from '@/lib/data-loaders/coach';
import { createCoachBillingLoaders } from '@/lib/data-loaders/coachBilling';
import { createGoalLoader } from '@/lib/data-loaders/goal';
import {
  createAthleteTrainingPlanIdsLoader,
  createGoalSessionLogIdsLoader,
  createGoalTrainingPlanIdsLoader,
  createSessionLogGoalIdsLoader,
  createTrainingPlanAssistantIdsLoader,
  createTrainingPlanGoalIdsLoader
} from '@/lib/data-loaders/relation';
import { createSessionLogLoader } from '@/lib/data-loaders/sessionLog';
import { createTrainingPlanLoader } from '@/lib/data-loaders/training-plan';
import {
  createWhiteboardLoader,
  createPlayLoader,
  createPhaseLoader,
  createPlayerPositionLoader,
  createMovementLoader,
  createAnnotationLoader
} from '@/lib/data-loaders/whiteboard-entities';
import {
  whiteboardByIdLoader,
  playsByWhiteboardIdLoader,
  phasesByPlayIdLoader,
  playerPositionsByPlayIdLoader,
  movementsByPhaseIdLoader,
  annotationsByPlayIdLoader,
  annotationsByPhaseIdLoader
} from '@/lib/data-loaders/whiteboard';
import { logger } from '@/lib/logger';
import { pubsub } from '@/lib/pubsub';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/supabase/config';
import type { User } from '@supabase/supabase-js';
import type DataLoader from 'dataloader'
import type { PubSub } from 'graphql-subscriptions'
import { type YogaInitialContext, createSchema, createYoga } from 'graphql-yoga'
import mutations from './mutations';
import queries from './queries';
import subscriptions from './subscriptions';

export interface GraphQLContext extends YogaInitialContext {
  user: User | null;
  userId: string | null;
  pubsub: PubSub;
  dataloaders?: {
    coachLoaders: ReturnType<typeof createCoachLoaders>;
    coachBillingLoaders: ReturnType<typeof createCoachBillingLoaders>;
  };
  loaders: {
    // Entity loaders
    athlete: ReturnType<typeof createAthleteLoader>;
    trainingPlan: ReturnType<typeof createTrainingPlanLoader>;
    assistant: ReturnType<typeof createAssistantLoader>;
    goal: ReturnType<typeof createGoalLoader>;
    sessionLog: ReturnType<typeof createSessionLogLoader>;

    // Whiteboard entity loaders
    whiteboardLoader: ReturnType<typeof createWhiteboardLoader>;
    playLoader: ReturnType<typeof createPlayLoader>;
    phaseLoader: ReturnType<typeof createPhaseLoader>;
    playerPositionLoader: ReturnType<typeof createPlayerPositionLoader>;
    movementLoader: ReturnType<typeof createMovementLoader>;
    annotationLoader: ReturnType<typeof createAnnotationLoader>;

    // Relationship loaders
    athleteTrainingPlanIds: ReturnType<typeof createAthleteTrainingPlanIdsLoader>;
    goalSessionLogIds: ReturnType<typeof createGoalSessionLogIdsLoader>;
    goalTrainingPlanIds: ReturnType<typeof createGoalTrainingPlanIdsLoader>;
    sessionLogGoalIds: ReturnType<typeof createSessionLogGoalIdsLoader>;
    trainingPlanAssistantIds: ReturnType<typeof createTrainingPlanAssistantIdsLoader>;
    trainingPlanGoalIds: ReturnType<typeof createTrainingPlanGoalIdsLoader>;

    // Whiteboard relationship loaders
    playsByWhiteboardId: typeof playsByWhiteboardIdLoader;
    phasesByPlayId: typeof phasesByPlayIdLoader;
    playerPositionsByPlayId: typeof playerPositionsByPlayIdLoader;
    movementsByPhaseId: typeof movementsByPhaseIdLoader;
    annotationsByPlayId: typeof annotationsByPlayIdLoader;
    annotationsByPhaseId: typeof annotationsByPhaseIdLoader;
  };
}

// Create a separate file for accessing pubsub singleton
// Export pubsub so it can be used by asynchronous background tasks
// export { pubsub };

/**
 * Helper function to safely load entities using DataLoader
 * Handles nullable IDs and filters out null results
 */
async function loadEntities<T>(
  ids: string[] | undefined | null,
  loader: DataLoader<string, T | null>
): Promise<T[]> {
  if (!ids || ids.length === 0) return [];

  try {
    const results = await Promise.all(
      ids.map(id => loader.load(id))
    );

    // Filter out any null results
    return results.filter(Boolean) as T[];
  } catch (error) {
    logger.error({ error }, 'Error loading entities');
    return [];
  }
}

const { handleRequest } = createYoga<GraphQLContext>({
  schema: createSchema({
    typeDefs: readFileSync('app/api/graphql/schema.graphql', 'utf-8'),
    resolvers: {
      Query: {
        ...queries,
      },
      Mutation: {
        ...mutations,
      },
      Subscription: {
        ...subscriptions,
      },
      Coach: {
        billing: async (parent, _args, context) => {
          try {
            if (context.dataloaders?.coachBillingLoaders) {
              return await context.dataloaders.coachBillingLoaders.coachBillingByCoachId.load(parent.id);
            }
            return null;
          } catch (error) {
            logger.error({ error, coachId: parent.id }, 'Error resolving coach billing');
            return null;
          }
        },
        athletes: async (parent, _args, context) => {
          try {
            // Get all athletes for this coach - this will need to be implemented
            // For now, return empty array as the data loader structure needs to be updated
            return [];
          } catch (error) {
            logger.error({ error, coachId: parent.id }, 'Error resolving coach athletes');
            return [];
          }
        },
        trainingPlans: async (parent, _args, context) => {
          try {
            // Get all training plans for this coach - this will need to be implemented
            // For now, return empty array as the data loader structure needs to be updated
            return [];
          } catch (error) {
            logger.error({ error, coachId: parent.id }, 'Error resolving coach training plans');
            return [];
          }
        }
      },
      TrainingPlan: {
        athlete: async (parent, _args, context) => {
          try {
            const athleteId = parent.athlete_id ?? parent.athlete?.id;
            if (!athleteId) return null;
            return await context.loaders.athlete.load(athleteId);
          } catch (error) {
            logger.error({ error, parent }, 'Error resolving training plan athlete');
            return null;
          }
        },
        assistants: async (parent, _args, context) => {
          try {
            // Get assistant IDs for this training plan
            const assistantIds = await context.loaders.trainingPlanAssistantIds.load(parent.id);

            // Load each assistant using the assistant loader
            return loadEntities(assistantIds, context.loaders.assistant);
          } catch (error) {
            logger.error({ error, trainingPlanId: parent.id }, 'Error resolving training plan assistants');
            return [];
          }
        },
        goals: async (parent, _args, context) => {
          try {
            // Get goal IDs for this training plan
            const goalIds = await context.loaders.trainingPlanGoalIds.load(parent.id);

            // Load each goal using the goal loader
            return loadEntities(goalIds, context.loaders.goal);
          } catch (error) {
            logger.error({ error, trainingPlanId: parent.id }, 'Error resolving training plan goals');
            return [];
          }
        },
      },
      Athlete: {
        trainingPlans: async (parent, _args, context) => {
          try {
            // Get training plan IDs for this athlete
            const trainingPlanIds = await context.loaders.athleteTrainingPlanIds.load(parent.id);

            // Load each training plan using the training plan loader
            return loadEntities(trainingPlanIds, context.loaders.trainingPlan);
          } catch (error) {
            logger.error({ error, athleteId: parent.id }, 'Error resolving athlete training plans');
            return [];
          }
        }
      },
      Goal: {
        athlete: async (parent, _args, context) => {
          try {
            const athleteId = parent.athlete_id;
            if (!athleteId) return null;
            return context.loaders.athlete.load(athleteId);
          } catch (error) {
            logger.error({ error, goalId: parent.id }, 'Error resolving goal athlete');
            return null;
          }
        },
        sessionLogs: async (parent, _args, context) => {
          try {
            // Get session log IDs linked to this goal
            const sessionLogIds = await context.loaders.goalSessionLogIds.load(parent.id);

            // Load each session log using the session log loader
            return loadEntities(sessionLogIds, context.loaders.sessionLog);
          } catch (error) {
            logger.error({ error, goalId: parent.id }, 'Error resolving goal session logs');
            return [];
          }
        },
        trainingPlans: async (parent, _args, context) => {
          try {
            // Get training plan IDs for this goal
            const trainingPlanIds = await context.loaders.goalTrainingPlanIds.load(parent.id);

            // Load each training plan using the training plan loader
            return loadEntities(trainingPlanIds, context.loaders.trainingPlan);
          } catch (error) {
            logger.error({ error, goalId: parent.id }, 'Error resolving goal training plans');
            return [];
          }
        }
      },
      SessionLog: {
        athlete: async (parent, _args, context) => {
          try {
            const athleteId = parent.athlete_id;
            if (!athleteId) return null;
            return context.loaders.athlete.load(athleteId);
          } catch (error) {
            logger.error({ error, sessionLogId: parent.id }, 'Error resolving session log athlete');
            return null;
          }
        },
        goals: async (parent, _args, context) => {
          try {
            // Get goal IDs linked to this session log
            const goalIds = await context.loaders.sessionLogGoalIds.load(parent.id);

            // Load each goal using the goal loader
            return loadEntities(goalIds, context.loaders.goal);
          } catch (error) {
            logger.error({ error, sessionLogId: parent.id }, 'Error resolving session log goals');
            return [];
          }
        }
      },
      Whiteboard: {
        coach: async (parent, _args, context) => {
          try {
            // Coach ID is stored as user_id in the whiteboard
            if (!parent.user_id && !context.dataloaders?.coachLoaders) return null;
            const coachId = parent.user_id || context.userId;
            return await context.dataloaders?.coachLoaders.coachByUserId.load(coachId);
          } catch (error) {
            logger.error({ error, whiteboardId: parent.id }, 'Error resolving whiteboard coach');
            return null;
          }
        },
        plays: async (parent, _args, context) => {
          try {
            return await context.loaders.playsByWhiteboardId.load(parent.id);
          } catch (error) {
            logger.error({ error, whiteboardId: parent.id }, 'Error resolving whiteboard plays');
            return [];
          }
        },
        athletes: async (parent, _args, context) => {
          try {
            // This would need a specific loader for whiteboard-athlete relationships
            // For now, return empty array - this can be implemented when needed
            return [];
          } catch (error) {
            logger.error({ error, whiteboardId: parent.id }, 'Error resolving whiteboard athletes');
            return [];
          }
        },
        trainingPlans: async (parent, _args, context) => {
          try {
            // This would need a specific loader for whiteboard-training plan relationships
            // For now, return empty array - this can be implemented when needed
            return [];
          } catch (error) {
            logger.error({ error, whiteboardId: parent.id }, 'Error resolving whiteboard training plans');
            return [];
          }
        }
      },
      Play: {
        whiteboard: async (parent, _args, context) => {
          try {
            const whiteboardId = parent.whiteboard_id || parent.whiteboardId;
            if (!whiteboardId) return null;
            return await context.loaders.whiteboardLoader.load(whiteboardId);
          } catch (error) {
            logger.error({ error, playId: parent.id }, 'Error resolving play whiteboard');
            return null;
          }
        },
        phases: async (parent, _args, context) => {
          try {
            return await context.loaders.phasesByPlayId.load(parent.id);
          } catch (error) {
            logger.error({ error, playId: parent.id }, 'Error resolving play phases');
            return [];
          }
        },
        startingPositions: async (parent, _args, context) => {
          try {
            return await context.loaders.playerPositionsByPlayId.load(parent.id);
          } catch (error) {
            logger.error({ error, playId: parent.id }, 'Error resolving play starting positions');
            return [];
          }
        },
        annotations: async (parent, _args, context) => {
          try {
            return await context.loaders.annotationsByPlayId.load(parent.id);
          } catch (error) {
            logger.error({ error, playId: parent.id }, 'Error resolving play annotations');
            return [];
          }
        }
      },
      Phase: {
        play: async (parent, _args, context) => {
          try {
            const playId = parent.play_id || parent.playId;
            if (!playId) return null;
            return await context.loaders.playLoader.load(playId);
          } catch (error) {
            logger.error({ error, phaseId: parent.id }, 'Error resolving phase play');
            return null;
          }
        },
        playerPositions: async (parent, _args, context) => {
          try {
            // Player positions that belong to this specific phase
            const allPositions = await context.loaders.playerPositionsByPlayId.load(parent.play_id || parent.playId);
            return allPositions.filter((position: any) => position.phaseId === parent.id);
          } catch (error) {
            logger.error({ error, phaseId: parent.id }, 'Error resolving phase player positions');
            return [];
          }
        },
        movements: async (parent, _args, context) => {
          try {
            return await context.loaders.movementsByPhaseId.load(parent.id);
          } catch (error) {
            logger.error({ error, phaseId: parent.id }, 'Error resolving phase movements');
            return [];
          }
        },
        annotations: async (parent, _args, context) => {
          try {
            return await context.loaders.annotationsByPhaseId.load(parent.id);
          } catch (error) {
            logger.error({ error, phaseId: parent.id }, 'Error resolving phase annotations');
            return [];
          }
        }
      },
      PlayerPosition: {
        play: async (parent, _args, context) => {
          try {
            const playId = parent.play_id || parent.playId;
            if (!playId) return null;
            return await context.loaders.playLoader.load(playId);
          } catch (error) {
            logger.error({ error, positionId: parent.id }, 'Error resolving player position play');
            return null;
          }
        },
        phase: async (parent, _args, context) => {
          try {
            const phaseId = parent.phase_id || parent.phaseId;
            if (!phaseId) return null;
            return await context.loaders.phaseLoader.load(phaseId);
          } catch (error) {
            logger.error({ error, positionId: parent.id }, 'Error resolving player position phase');
            return null;
          }
        }
      },
      Movement: {
        phase: async (parent, _args, context) => {
          try {
            const phaseId = parent.phase_id || parent.phaseId;
            if (!phaseId) return null;
            return await context.loaders.phaseLoader.load(phaseId);
          } catch (error) {
            logger.error({ error, movementId: parent.id }, 'Error resolving movement phase');
            return null;
          }
        }
      },
      Annotation: {
        play: async (parent, _args, context) => {
          try {
            const playId = parent.play_id || parent.playId;
            if (!playId) return null;
            return await context.loaders.playLoader.load(playId);
          } catch (error) {
            logger.error({ error, annotationId: parent.id }, 'Error resolving annotation play');
            return null;
          }
        },
        phase: async (parent, _args, context) => {
          try {
            const phaseId = parent.phase_id || parent.phaseId;
            if (!phaseId) return null;
            return await context.loaders.phaseLoader.load(phaseId);
          } catch (error) {
            logger.error({ error, annotationId: parent.id }, 'Error resolving annotation phase');
            return null;
          }
        }
      },
    }
  }),
  context: async (req) => {
    let user: User | null = null

    const authHeader = req.request?.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.replace('Bearer ', '')
      try {
        // Create a direct supabase client with the JWT token
        const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        })
        const { data: { user: headerUser }, error } = await supabase.auth.getUser()
        if (!error && headerUser) {
          user = headerUser
          logger.info({ userId: headerUser.id }, 'Authenticated via Authorization header')
        }
      } catch (error) {
        logger.error({ error }, 'Failed to authenticate with Authorization header')
      }
    }

    if (user) {
      // Create all data loaders
      const loaders = {
        // Entity loaders
        athlete: createAthleteLoader(user?.id),
        trainingPlan: createTrainingPlanLoader(user?.id),
        assistant: createAssistantLoader(),
        goal: createGoalLoader(user?.id),
        sessionLog: createSessionLogLoader(user?.id),

        // Whiteboard entity loaders
        whiteboardLoader: createWhiteboardLoader(user?.id),
        playLoader: createPlayLoader(),
        phaseLoader: createPhaseLoader(),
        playerPositionLoader: createPlayerPositionLoader(),
        movementLoader: createMovementLoader(),
        annotationLoader: createAnnotationLoader(),

        // Relationship loaders
        athleteTrainingPlanIds: createAthleteTrainingPlanIdsLoader(user?.id),
        goalSessionLogIds: createGoalSessionLogIdsLoader(),
        goalTrainingPlanIds: createGoalTrainingPlanIdsLoader(),
        sessionLogGoalIds: createSessionLogGoalIdsLoader(),
        trainingPlanAssistantIds: createTrainingPlanAssistantIdsLoader(),
        trainingPlanGoalIds: createTrainingPlanGoalIdsLoader(),

        // Whiteboard relationship loaders
        playsByWhiteboardId: playsByWhiteboardIdLoader,
        phasesByPlayId: phasesByPlayIdLoader,
        playerPositionsByPlayId: playerPositionsByPlayIdLoader,
        movementsByPhaseId: movementsByPhaseIdLoader,
        annotationsByPlayId: annotationsByPlayIdLoader,
        annotationsByPhaseId: annotationsByPhaseIdLoader,
      };

      // Create coach-specific data loaders
      const dataloaders = {
        coachLoaders: createCoachLoaders(),
        coachBillingLoaders: createCoachBillingLoaders(),
      };

      return {
        user,
        userId: user.id,
        pubsub,
        loaders,
        dataloaders
      };
    }
    return {
      user: null,
      userId: null,
      pubsub,
      loaders: {} as any,
      dataloaders: undefined
    }
  },
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response }
})

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS
}