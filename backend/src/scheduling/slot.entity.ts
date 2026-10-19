import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  
  @Index()
  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'int' })
  durationMinutes: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToOne(() => Booking, (booking) => booking.slot)
  booking?: Booking | null;
}
