import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HostGuard } from '../common/host.guard';
import { BookSlotDto, CreateSlotsDto } from './dto';
import { SchedulingService } from './scheduling.service';


@Controller('slots')
export class PublicSlotsController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get()
  list() {
    return this.scheduling.listPublic();
  }

  @Post(':id/book')
  book(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: BookSlotDto,
  ) {
    return this.scheduling.book(id, dto);
  }
}


@Controller('host')
@UseGuards(HostGuard)
export class HostController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get('overview')
  overview() {
    return this.scheduling.overview();
  }

  @Post('slots')
  create(@Body() dto: CreateSlotsDto) {
    return this.scheduling.createSlots(dto);
  }

  @Delete('slots/:id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.scheduling.deleteSlot(id);
  }
}
