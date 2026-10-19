import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ALLOWED_DURATIONS = [15, 20, 30, 45, 60];

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateSlotsDto {
  
  @IsISO8601()
  startsAt: string;

  @IsInt()
  @IsIn(ALLOWED_DURATIONS)
  durationMinutes: number;

  
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  count?: number;
}

export class BookSlotDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(120)
  email: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  team: string;

  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  topic: string;

  
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;
}
