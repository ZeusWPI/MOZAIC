/**
 * Note on use: don't change anything in these files any more if they have been
 * used in production, instead, make a new migration file.
 * To do that copy the file from the previous migration, and change redefined
 * datatypes to a type alias from that migration.
 * Eg:
 * ```
 *  migrationV3
 *  export type GameConfig = V1.GameConfig;
 *  export interface BotConfig {
 *    name: string;
 *    command: string;
 *  }
 * ```
 * should result in:
 * ```
 *  migrationV4
 *  export type GameConfig = V1.GameConfig;
 *  export type BotConfig = V3.BotConfig;
 * ```
 */

export * from './migrationV4';
