import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Booking } from './booking.entity';
import { Slot } from './slot.entity';
import { HostController, PublicSlotsController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [TypeOrmModule.forFeature([Slot, Booking]), AiModule],
  controllers: [PublicSlotsController, HostController],
  providers: [SchedulingService],
})
export class SchedulingModule {}
