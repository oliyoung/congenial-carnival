import type { Client } from "@/lib/types";
import { EntityRepository, type EntityMapping } from "./entityRepository";

// Client-specific column mappings
const clientMapping: EntityMapping<Client> = {
  tableName: 'clients',
  columnMappings: {
    firstName: 'first_name',
    lastName: 'last_name',
    userId: 'user_id',
    fitnessLevel: 'fitness_level',
    trainingHistory: 'training_history'
  },
  // Custom transform to handle specific fields
  transform: (data: any) => {
    if (!data) return null as unknown as Client;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      birthday: data.birthday,
      gender: data.gender,
      fitnessLevel: data.fitness_level,
      trainingHistory: data.training_history,
      height: data.height,
      weight: data.weight,
      tags: data.tags,
      notes: data.notes,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : null
    } as Client;
  }
};

export class ClientRepository extends EntityRepository<Client> {
  constructor() {
    super(clientMapping);
  }

  /**
   * Get all clients for a user with proper field mapping
   */
  async getClients(userId: string | null): Promise<Client[]> {
    return this.getAll(userId);
  }

  /**
   * Get a client by ID with proper field mapping
   */
  async getClientById(userId: string | null, clientId: string): Promise<Client | null> {
    return this.getById(userId, clientId);
  }

  /**
   * Get multiple clients by their IDs with proper field mapping
   */
  async getClientsByIds(userId: string | null, clientIds: string[]): Promise<Client[]> {
    return this.getByIds(userId, clientIds);
  }

  /**
   * Create a new client with proper field mapping
   */
  async createClient(userId: string | null, clientData: Partial<Client>): Promise<Client | null> {
    return this.create(userId, clientData);
  }

  /**
   * Update a client with proper field mapping
   */
  async updateClient(userId: string | null, clientId: string, clientData: Partial<Client>): Promise<Client | null> {
    return this.update(userId, clientId, clientData);
  }

  /**
   * Calculate age from birthday
   */
  calculateAge(birthday: string): number {
    const birthDate = new Date(birthday);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}