import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Slot } from './slot.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  slotId: string;

  @OneToOne(() => Slot, (slot) => slot.booking, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'slotId' })
  slot: Slot;

  @Column()
  name: string;

  @Column()
  email: string;


  @Column()
  team: string;


  @Column({ type: 'text' })
  topic: string;

  @Column({ type: 'text', nullable: true })
  confirmationMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  prepQuestions: string[] | null;

  
  @Column({ default: false })
  aiGenerated: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
