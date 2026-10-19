import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { Booking } from './booking.entity';
import { BookSlotDto, CreateSlotsDto } from './dto';
import { Slot } from './slot.entity';

const MINUTE = 60_000;
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Slot) private readonly slots: Repository<Slot>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly dataSource: DataSource,
    private readonly ai: AiService,
  ) {}

  

  
  async listPublic() {
    const rows = await this.slots
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.booking', 'b')
      .where('s.startsAt > now()')
      .orderBy('s.startsAt', 'ASC')
      .getMany();

    return rows.map((s) => ({
      id: s.id,
      startsAt: s.startsAt,
      durationMinutes: s.durationMinutes,
      booked: !!s.booking,
    }));
  }

  async book(slotId: string, dto: BookSlotDto) {
    const slot = await this.slots.findOne({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('This slot does not exist anymore.');
    if (slot.startsAt.getTime() <= Date.now()) {
      throw new ConflictException('This slot has already started.');
    }

    let booking: Booking;
    try {
      booking = await this.bookings.save(
        this.bookings.create({
          slotId,
          name: dto.name,
          email: dto.email,
          team: dto.team,
          topic: dto.topic,
        }),
      );
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as any).driverError?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'Sorry, someone just booked this slot. Please pick another one.',
        );
      }
      throw err;
    }

    
    const confirmation = await this.ai.confirmation({
      name: dto.name,
      team: dto.team,
      topic: dto.topic,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      timeZone: dto.timeZone,
    });

    booking.confirmationMessage = confirmation.message;
    booking.prepQuestions = confirmation.questions;
    booking.aiGenerated = confirmation.aiGenerated;
    await this.bookings.save(booking);

    return {
      id: booking.id,
      slotId,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      name: booking.name,
      email: booking.email,
      team: booking.team,
      topic: booking.topic,
      confirmationMessage: booking.confirmationMessage,
      prepQuestions: booking.prepQuestions,
      aiGenerated: booking.aiGenerated,
    };
  }

  

  
  async overview() {
    const rows = await this.slots.find({
      relations: { booking: true },
      order: { startsAt: 'ASC' },
    });
    return rows.map((s) => ({
      id: s.id,
      startsAt: s.startsAt,
      durationMinutes: s.durationMinutes,
      booking: s.booking
        ? {
            id: s.booking.id,
            name: s.booking.name,
            email: s.booking.email,
            team: s.booking.team,
            topic: s.booking.topic,
            confirmationMessage: s.booking.confirmationMessage,
            prepQuestions: s.booking.prepQuestions,
            aiGenerated: s.booking.aiGenerated,
          }
        : null,
    }));
  }

  
  async createSlots(dto: CreateSlotsDto) {
    const count = dto.count ?? 1;
    const first = new Date(dto.startsAt);
    if (first.getTime() <= Date.now()) {
      throw new BadRequestException('Slots must start in the future.');
    }

    const step = dto.durationMinutes * MINUTE;
    const starts = Array.from(
      { length: count },
      (_, i) => new Date(first.getTime() + i * step),
    );
    const rangeEnd = new Date(first.getTime() + count * step);

    return this.dataSource.transaction(async (manager) => {
      const clash = await manager
        .createQueryBuilder(Slot, 's')
        .where('s.startsAt < :rangeEnd', { rangeEnd })
        .andWhere(
          `s.startsAt + s.durationMinutes * interval '1 minute' > :rangeStart`,
          { rangeStart: first },
        )
        .getOne();

      if (clash) {
        throw new ConflictException(
          'This overlaps with a slot you already published.',
        );
      }

      const created = await manager.save(
        starts.map((startsAt) =>
          manager.create(Slot, {
            startsAt,
            durationMinutes: dto.durationMinutes,
          }),
        ),
      );

      return created.map((s) => ({
        id: s.id,
        startsAt: s.startsAt,
        durationMinutes: s.durationMinutes,
        booking: null,
      }));
    });
  }

  async deleteSlot(id: string) {
    const slot = await this.slots.findOne({
      where: { id },
      relations: { booking: true },
    });
    if (!slot) throw new NotFoundException('Slot not found.');
    if (slot.booking) {
      throw new ConflictException(
        'This slot is booked, so it cannot be removed.',
      );
    }
    await this.slots.delete(id);
    return { deleted: true };
  }
}
