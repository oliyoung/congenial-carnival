import type { Assistant, AssistantsInput, Client, Goal, SessionLog, TrainingPlan } from "../types";
import { supabaseServiceRole } from "../supabase/serviceRoleClient";

export async function getTrainingPlans(userId: string | null, clientId: string | null): Promise<TrainingPlan[]> {
  if (!userId) return [];
  const { data, error } = await supabaseServiceRole
    .from('training_plans')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching training plans:', error);
    return [];
  }
  return data as TrainingPlan[];
}

export async function getAssistants(input: AssistantsInput): Promise<Assistant[]> {
  const { filter } = input ?? {};
  const { sport, role, strengths } = filter ?? {};

  const query = supabaseServiceRole.from('assistants').select('*');
  if (sport) query.eq('sport', sport);
  if (role) query.eq('role', role);
  if (strengths) query.in('strengths', strengths);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assistants:', error);
    return [];
  }
  return data as Assistant[];
}

export async function createTrainingPlan(userId: string | null, input: Partial<TrainingPlan>): Promise<TrainingPlan> {
  if (!userId) return {} as TrainingPlan;

  const { data, error } = await supabaseServiceRole
    .from('training_plans')
    .insert({
      client_id: input.client?.id,
      title: input.title,
      overview: input.overview,
    })
    .select('*, createdAt:created_at, updatedAt:updated_at, deletedAt:deleted_at')
    .single();

  if (error) {
    console.error('Error creating training plan:', error);
    return {} as TrainingPlan;
  }
  return data as TrainingPlan;
}

export async function createClient(userId: string | null, input: Partial<Client>): Promise<Client> {
  if (!userId) return {} as Client;

  const { data, error } = await supabaseServiceRole
    .from('clients')
    .insert({
      user_id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      birthday: input.birthday,
      gender: input.gender,
      fitness_level: input.fitnessLevel,
      training_history: input.trainingHistory,
      height: input.height,
      weight: input.weight,
      tags: input.tags,
      notes: input.notes
    })
    .select('*, createdAt:created_at, updatedAt:updated_at, deletedAt:deleted_at')
    .single();

  if (error) {
    console.error('Error Creating clients:', error);
    return {} as Client;
  }
  return data as Client;
}

export async function getClients(userId: string | null): Promise<Client[]> {
  if (!userId) return [];
  const { data, error } = await supabaseServiceRole
    .from('clients')
    .select('*, firstName:first_name, userId:user_id, lastName:last_name, createdAt:created_at, updatedAt:updated_at, deletedAt:deleted_at')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return data as Client[];
}

export async function getClientById(userId: string | null, clientId: Client['id']): Promise<Client | null> {
  const { data, error } = await supabaseServiceRole
    .from('clients')
    .select('*, firstName:first_name, userId:user_id, lastName:last_name, createdAt:created_at, updatedAt:updated_at, deletedAt:deleted_at')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return data as Client;
}

export async function getGoalById(userId: string | null, goalId: Goal['id']): Promise<Goal | null> {
  const { data, error } = await supabaseServiceRole
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching goal:', error);
    return null;
  }
  return data as Goal;
}

export async function getGoalsByClientId(userId: string | null, clientId: Client['id']): Promise<Goal[]> {
  const { data, error } = await supabaseServiceRole
    .from('goals')
    .select('*')
    .eq('client_id', clientId);
  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  return data as Goal[];
}

export async function getSessionLogsByClientId(userId: string | null, clientId: Client['id']): Promise<SessionLog[]> {
  return [];
}
export async function getSessionLogById(userId: string | null, sessionLogId: SessionLog['id']): Promise<SessionLog | null> {
  return null;
}

// Function to calculate age from birthday
export function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
