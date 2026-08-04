/**
 * Users Repository — Placeholder.
 * Phase 5: Implement with User Mongoose model.
 */

export interface IUsersRepository {
  // Phase 5: findById(id: string): Promise<UserDocument | null>
  // Phase 5: update(id: string, data: UpdateProfileDto): Promise<UserDocument | null>
  // Phase 5: softDelete(id: string): Promise<boolean>
}

export class UsersRepository implements IUsersRepository {}
export const usersRepository = new UsersRepository();
